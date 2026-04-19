const express = require('express');
const multer = require('multer');
const path = require('path');

const auth = require('../middleware/auth');
const config = require('../config');
const db = require('../database');
const ragBridge = require('../services/rag-bridge');
const storageService = require('../services/storage.service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const hostedOverrides = {
  llmProvider: config.LLM_PROVIDER,
  embeddingProvider: config.EMBEDDING_PROVIDER,
  vectorProvider: config.VECTOR_DB_PROVIDER,
};

async function getProfile(userId) {
  const result = await db.query('SELECT chunk_size, chunk_overlap FROM profiles WHERE user_id = $1', [userId]);
  return result.rows[0] || {};
}

async function ingestDocument(doc, profile, overrides = {}) {
  const signedUrl = await storageService.createSignedUrl(doc.storage_bucket, doc.storage_object_path);
  const result = await ragBridge.ingest(
    doc.user_id,
    signedUrl,
    doc.id,
    doc.file_type,
    {
      chunkSize: profile.chunk_size,
      chunkOverlap: profile.chunk_overlap,
      sourceType: doc.source_type,
      sourceName: doc.source_name || doc.filename,
      externalUrl: doc.external_url,
      mimeType: doc.mime_type,
      ...overrides,
    },
  );

  await db.query(`
    UPDATE documents
    SET chunk_count = $1,
        status = 'ready',
        sync_status = $2,
        last_synced_at = $3,
        action_candidates = $4::jsonb,
        error_message = NULL
    WHERE id = $5
  `, [
    result.chunkCount || 0,
    overrides.vectorProvider === 'pinecone' || config.VECTOR_DB_PROVIDER === 'pinecone' ? 'synced' : 'local-only',
    overrides.vectorProvider === 'pinecone' || config.VECTOR_DB_PROVIDER === 'pinecone' ? new Date().toISOString() : null,
    JSON.stringify(result.actionCandidates || {}),
    doc.id,
  ]);

  return result;
}

async function clearDocumentVectors(userId, docId) {
  await Promise.allSettled([
    ragBridge.deleteDocumentFromProvider(userId, docId, { vectorProvider: 'faiss' }),
    ragBridge.deleteDocumentFromProvider(userId, docId, { vectorProvider: 'pinecone' }),
  ]);
}

router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const objectPath = `${req.auth.userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(req.file.originalname)}`;
    await storageService.uploadBuffer(
      config.SUPABASE_DOCUMENTS_BUCKET,
      objectPath,
      req.file.buffer,
      req.file.mimetype,
    );

    const inserted = await db.query(`
      INSERT INTO documents (
        user_id, filename, file_type, file_path, mime_type,
        storage_bucket, storage_object_path, status, source_type, source_name, sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing', 'local', $8, $9)
      RETURNING *
    `, [
      req.auth.userId,
      req.file.originalname,
      path.extname(req.file.originalname).toLowerCase().replace('.', ''),
      objectPath,
      req.file.mimetype,
      config.SUPABASE_DOCUMENTS_BUCKET,
      objectPath,
      req.file.originalname,
      config.VECTOR_DB_PROVIDER === 'pinecone' ? 'syncing' : 'local-only',
    ]);

    const doc = inserted.rows[0];
    const profile = await getProfile(req.auth.userId);

    ingestDocument(doc, profile).catch(async (error) => {
      await db.query(`
        UPDATE documents
        SET status = 'error', sync_status = 'error', error_message = $1
        WHERE id = $2
      `, [error.response?.data?.message || error.message || 'Unknown ingestion error', doc.id]);
    });

    res.status(201).json({ id: doc.id, filename: doc.filename, status: 'processing' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import/google-drive', auth, async (req, res) => {
  const { name, fileType = 'txt', mimeType = 'text/plain', externalId, externalUrl, contentText } = req.body;
  if (!name || !externalUrl || !contentText) {
    return res.status(400).json({ error: 'name, externalUrl, and contentText are required' });
  }

  try {
    const objectPath = `${req.auth.userId}/${Date.now()}-gdrive-${name.replace(/[^a-zA-Z0-9-_]/g, '_')}.${fileType}`;
    await storageService.uploadBuffer(config.SUPABASE_DOCUMENTS_BUCKET, objectPath, Buffer.from(contentText, 'utf8'), mimeType);

    const inserted = await db.query(`
      INSERT INTO documents (
        user_id, filename, file_type, file_path, mime_type, storage_bucket, storage_object_path,
        status, source_type, source_name, external_id, external_url, sync_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing', 'google_drive', $8, $9, $10, $11)
      RETURNING *
    `, [
      req.auth.userId,
      name,
      fileType,
      objectPath,
      mimeType,
      config.SUPABASE_DOCUMENTS_BUCKET,
      objectPath,
      name,
      externalId || null,
      externalUrl,
      config.VECTOR_DB_PROVIDER === 'pinecone' ? 'syncing' : 'local-only',
    ]);

    const doc = inserted.rows[0];
    const profile = await getProfile(req.auth.userId);

    ingestDocument(doc, profile).catch(async (error) => {
      await db.query(`
        UPDATE documents
        SET status = 'error', sync_status = 'error', error_message = $1
        WHERE id = $2
      `, [error.response?.data?.message || error.message || 'Google Drive ingestion failed', doc.id]);
    });

    res.status(201).json({ id: doc.id, status: 'processing', sourceType: 'google_drive' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const values = [req.auth.userId];
    const filters = ['user_id = $1'];
    let index = 2;

    if (req.query.query) {
      filters.push(`(filename ILIKE $${index} OR source_name ILIKE $${index + 1} OR external_url ILIKE $${index + 2})`);
      values.push(`%${req.query.query}%`, `%${req.query.query}%`, `%${req.query.query}%`);
      index += 3;
    }
    if (req.query.fileType) {
      filters.push(`file_type = $${index++}`);
      values.push(req.query.fileType);
    }
    if (req.query.name) {
      filters.push(`filename ILIKE $${index++}`);
      values.push(`%${req.query.name}%`);
    }
    if (req.query.status) {
      filters.push(`status = $${index++}`);
      values.push(req.query.status);
    }
    if (req.query.sourceType) {
      filters.push(`source_type = $${index++}`);
      values.push(req.query.sourceType);
    }
    if (req.query.dateFrom) {
      filters.push(`DATE(uploaded_at) >= DATE($${index++})`);
      values.push(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filters.push(`DATE(uploaded_at) <= DATE($${index++})`);
      values.push(req.query.dateTo);
    }

    const result = await db.query(`
      SELECT *
      FROM documents
      WHERE ${filters.join(' AND ')}
      ORDER BY uploaded_at DESC
    `, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/action-candidates', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    const doc = result.rows[0];
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (doc.action_candidates) {
      return res.json(doc.action_candidates);
    }
    const signedUrl = await storageService.createSignedUrl(doc.storage_bucket, doc.storage_object_path);
    const actionCandidates = await ragBridge.extractActions(signedUrl, doc.file_type);
    await db.query('UPDATE documents SET action_candidates = $1::jsonb WHERE id = $2', [JSON.stringify(actionCandidates), doc.id]);
    res.json(actionCandidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/sync-hosted', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    const doc = result.rows[0];
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const profile = await getProfile(req.auth.userId);
    await db.query('UPDATE documents SET sync_status = $1 WHERE id = $2', ['syncing', doc.id]);
    await ingestDocument(doc, profile, hostedOverrides);
    res.json({ status: 'synced', documentId: doc.id });
  } catch (error) {
    await db.query('UPDATE documents SET sync_status = $1, error_message = $2 WHERE id = $3', ['error', error.message, req.params.id]);
    res.status(500).json({ error: error.message });
  }
});

router.post('/sync-hosted', auth, async (req, res) => {
  try {
    const docsResult = await db.query('SELECT * FROM documents WHERE user_id = $1', [req.auth.userId]);
    const profile = await getProfile(req.auth.userId);
    for (const doc of docsResult.rows) {
      await db.query('UPDATE documents SET sync_status = $1 WHERE id = $2', ['syncing', doc.id]);
      await ingestDocument(doc, profile, hostedOverrides);
    }
    res.json({ status: 'synced', count: docsResult.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM documents WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    const doc = result.rows[0];
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    await clearDocumentVectors(req.auth.userId, doc.id);
    await storageService.removeObject(doc.storage_bucket, doc.storage_object_path);
    await db.query('DELETE FROM documents WHERE id = $1', [doc.id]);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/redigest', auth, async (req, res) => {
  try {
    const docsResult = await db.query('SELECT * FROM documents WHERE user_id = $1 AND file_type != $2', [req.auth.userId, '']);
    const profile = await getProfile(req.auth.userId);
    res.status(202).json({ message: `Redigest initiated for ${docsResult.rows.length} documents` });

    for (const doc of docsResult.rows) {
      await db.query(`
        UPDATE documents
        SET chunk_count = 0, status = 'processing', error_message = NULL
        WHERE id = $1
      `, [doc.id]);
      await clearDocumentVectors(req.auth.userId, doc.id);
      ingestDocument(doc, profile).catch(async (error) => {
        await db.query(`
          UPDATE documents
          SET status = 'error', sync_status = 'error', error_message = $1
          WHERE id = $2
        `, [error.response?.data?.message || error.message || 'Unknown ingestion error', doc.id]);
      });
    }
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;
