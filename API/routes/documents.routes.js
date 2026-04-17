const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const db = require('../database');
const config = require('../config');
const ragBridge = require('../services/rag-bridge');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const user_id = req.auth.userId;
    const userUploadDir = path.join(config.UPLOAD_DIR, user_id);
    if (!fs.existsSync(userUploadDir)) {
      fs.mkdirSync(userUploadDir, { recursive: true });
    }
    cb(null, userUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.txt', '.docx', '.xlsx', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, TXT, DOCX, XLSX, and PPTX are allowed.'));
    }
  }
});

// Upload document
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { filename, path: filePath, originalname } = req.file;
  const fileType = path.extname(originalname).toLowerCase().replace('.', '');
  const user_id = req.auth.userId;

  try {
    const stmt = db.prepare('INSERT INTO documents (user_id, filename, file_type, file_path, status) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(user_id, originalname, fileType, filePath, 'processing');
    const docId = info.lastInsertRowid;

    // Get user profile for RAG params
    const profile = db.prepare('SELECT chunk_size, chunk_overlap FROM profiles WHERE user_id = ?').get(user_id) || {};

    // Call Python RAG ingest in the background (Node doesn't wait)
    ragBridge.ingest(user_id, filePath, docId, fileType, {
      chunkSize: profile.chunk_size,
      chunkOverlap: profile.chunk_overlap
    })
      .then(result => {
        db.prepare('UPDATE documents SET chunk_count = ?, status = ? WHERE id = ?')
          .run(result.chunkCount, 'ready', docId);
      })
      .catch(err => {
        console.error(`Ingest failed for doc ${docId}:`, err);
        db.prepare('UPDATE documents SET status = ? WHERE id = ?')
          .run('error', docId);
      });

    res.status(201).json({ 
      id: docId,
      filename: originalname,
      status: 'processing'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List documents
router.get('/', auth, (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(req.auth.userId);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  const docId = req.params.id;
  const user_id = req.auth.userId;
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND user_id = ?').get(docId, user_id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete from Python RAG
    await ragBridge.deleteDocument(user_id, docId);

    // Delete file from disk
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);

    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
