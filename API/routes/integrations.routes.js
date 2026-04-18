const express = require('express');
const path = require('path');

const auth = require('../middleware/auth');
const config = require('../config');
const db = require('../database');
const ragBridge = require('../services/rag-bridge');
const storageService = require('../services/storage.service');
const googleService = require('../services/google.service');

const router = express.Router();

function getErrorMessage(error, fallback) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    fallback
  );
}

async function getGoogleAccount(userId) {
  const result = await db.query(
    'SELECT * FROM integration_accounts WHERE user_id = $1 AND provider = $2',
    [userId, 'google'],
  );
  return result.rows[0] || null;
}

router.get('/google/start', auth, async (req, res) => {
  try {
    const url = googleService.getAuthUrl(req.auth.userId);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to list Drive files') });
  }
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const payload = googleService.verifyState(state);
    const { tokens, email } = await googleService.exchangeCodeForTokens(code);

    await db.query(`
      INSERT INTO integration_accounts (user_id, provider, email, scopes, tokens)
      VALUES ($1, 'google', $2, $3::jsonb, $4::jsonb)
      ON CONFLICT (user_id, provider) DO UPDATE SET
        email = EXCLUDED.email,
        scopes = EXCLUDED.scopes,
        tokens = EXCLUDED.tokens,
        updated_at = NOW()
    `, [
      payload.userId,
      email,
      JSON.stringify(googleService.ALL_SCOPES),
      JSON.stringify(tokens),
    ]);

    res.send(`
      <html>
        <body style="font-family: sans-serif; background:#161c24; color:#fff; display:flex; align-items:center; justify-content:center; min-height:100vh;">
          <div style="max-width:420px; text-align:center;">
            <h2>Google connected</h2>
            <p>You can close this tab and return to MindSpace.</p>
            <script>window.opener && window.opener.postMessage({ type: 'google-connected' }, '*');</script>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Google callback failed: ${error.message}`);
  }
});

router.get('/google/status', auth, async (req, res) => {
  try {
    const account = await getGoogleAccount(req.auth.userId);
    res.json({
      connected: Boolean(account),
      email: account?.email || null,
      scopes: account?.scopes || [],
    });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to get Google status') });
  }
});

router.get('/google/drive/files', auth, async (req, res) => {
  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }
    const files = await googleService.listDriveFiles(account.tokens, {
      pageToken: req.query.pageToken,
      search: req.query.search || '',
      includeSharedDrives: req.query.includeSharedDrives === 'true',
      pageSize: Math.min(Number(req.query.pageSize) || 20, 100),
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to list Drive files') });
  }
});

router.post('/google/drive/import', auth, async (req, res) => {
  const { fileId, name, mimeType, webViewLink } = req.body;
  if (!fileId || !name || !mimeType) {
    return res.status(400).json({ error: 'fileId, name, and mimeType are required' });
  }

  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }

    const downloaded = await googleService.downloadDriveFile(account.tokens, fileId, mimeType);
    const fileType = (downloaded.extension || path.extname(name).replace('.', '') || 'txt').toLowerCase();
    const objectPath = `${req.auth.userId}/${Date.now()}-gdrive-${name.replace(/[^a-zA-Z0-9-_]/g, '_')}.${fileType}`;

    await storageService.uploadBuffer(
      config.SUPABASE_DOCUMENTS_BUCKET,
      objectPath,
      downloaded.buffer,
      downloaded.mimeType || mimeType,
    );

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
      downloaded.mimeType || mimeType,
      config.SUPABASE_DOCUMENTS_BUCKET,
      objectPath,
      name,
      fileId,
      webViewLink || null,
      config.VECTOR_DB_PROVIDER === 'pinecone' ? 'syncing' : 'local-only',
    ]);

    const profileResult = await db.query('SELECT chunk_size, chunk_overlap FROM profiles WHERE user_id = $1', [req.auth.userId]);
    const profile = profileResult.rows[0] || {};
    const doc = inserted.rows[0];
    const signedUrl = await storageService.createSignedUrl(doc.storage_bucket, doc.storage_object_path);
    const ragResult = await ragBridge.ingest(req.auth.userId, signedUrl, doc.id, doc.file_type, {
      chunkSize: profile.chunk_size,
      chunkOverlap: profile.chunk_overlap,
      sourceType: 'google_drive',
      sourceName: doc.source_name,
      externalUrl: doc.external_url,
      mimeType: doc.mime_type,
    });

    await db.query(`
      UPDATE documents
      SET chunk_count = $1, status = 'ready', sync_status = $2, last_synced_at = NOW(), action_candidates = $3::jsonb
      WHERE id = $4
    `, [
      ragResult.chunkCount || 0,
      config.VECTOR_DB_PROVIDER === 'pinecone' ? 'synced' : 'local-only',
      JSON.stringify(ragResult.actionCandidates || {}),
      doc.id,
    ]);

    res.status(201).json({ id: doc.id, status: 'ready' });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to list Gmail drafts') });
  }
});

router.get('/google/gmail/messages', auth, async (req, res) => {
  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }
    const messages = await googleService.listInboxMessages(account.tokens);
    const search = (req.query.search || '').trim().toLowerCase();
    const filtered = search
      ? messages.filter((message) => (
          [message.subject, message.from, message.snippet].join(' ').toLowerCase().includes(search)
        ))
      : messages;
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to create Gmail draft') });
  }
});

router.get('/google/gmail/messages/:id', auth, async (req, res) => {
  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }
    const message = await googleService.getInboxMessage(account.tokens, req.params.id);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to load Gmail message') });
  }
});

router.get('/google/gmail/messages/:id/actions', auth, async (req, res) => {
  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }

    const message = await googleService.getInboxMessage(account.tokens, req.params.id);
    const text = [
      `Subject: ${message.subject}`,
      `From: ${message.from}`,
      `Date: ${message.date}`,
      '',
      message.body || message.snippet || '',
    ].join('\n');
    const actionCandidates = await ragBridge.extractActions(null, null, text);
    res.json({
      message,
      actionCandidates,
    });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error, 'Failed to extract Gmail actions') });
  }
});

router.get('/google/gmail/drafts', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, external_draft_id, recipient, subject, body, status, metadata, created_at
      FROM mail_drafts
      WHERE user_id = $1 AND provider = 'gmail'
      ORDER BY created_at DESC
    `, [req.auth.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/google/gmail/drafts', auth, async (req, res) => {
  const { recipient, subject, body } = req.body;
  if (!recipient || !subject || !body) {
    return res.status(400).json({ error: 'recipient, subject, and body are required' });
  }

  try {
    const account = await getGoogleAccount(req.auth.userId);
    if (!account) {
      return res.status(400).json({ error: 'Google is not connected' });
    }

    const draft = await googleService.createGmailDraft(account.tokens, { to: recipient, subject, body });
    const result = await db.query(`
      INSERT INTO mail_drafts (user_id, provider, external_draft_id, recipient, subject, body, status, metadata)
      VALUES ($1, 'gmail', $2, $3, $4, $5, 'draft', $6::jsonb)
      RETURNING id
    `, [
      req.auth.userId,
      draft.id || null,
      recipient,
      subject,
      body,
      JSON.stringify(draft),
    ]);

    res.status(201).json({ id: result.rows[0].id, externalDraftId: draft.id || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
