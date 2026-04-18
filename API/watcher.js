const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const config = require('./config');
const ragBridge = require('./services/rag-bridge');

function startWatcher() {
  // Watch all directories and files inside storage/uploads
  const watcher = chokidar.watch(config.UPLOAD_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Do not trigger on existing files during startup
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      try {
        const ext = path.extname(filePath).toLowerCase().replace('.', '');
        // Validate extension
        const allowed = ['pdf', 'txt', 'docx', 'xlsx', 'pptx', 'jpg', 'jpeg', 'png', 'webp'];
        if (!allowed.includes(ext)) return;

        // Path structure: UPLOAD_DIR / user_id / filename
        const relativePath = path.relative(config.UPLOAD_DIR, filePath);
        const parts = relativePath.split(path.sep);
        if (parts.length < 2) return; // Not in a user folder

        const userId = parts[0];
        const filename = parts.slice(1).join('/');

        // Check if DB already knows about this file (to prevent looping from UI upload)
        const existing = db.prepare('SELECT id FROM documents WHERE file_path = ?').get(filePath);
        if (existing) {
          // File was added via UI/Multer. Ingestion is handled by the route or we can delegate it all to here.
          // Since the route delegates to this watcher? Wait, the UI route already triggers ingest.
          // IF we want the route to continue doing it, we just ignore this.
          // Let's just ignore it so we don't double ingest.
          return;
        }

        // It's a brand new external file drop!
        const stmt = db.prepare('INSERT INTO documents (user_id, filename, file_type, file_path, status) VALUES (?, ?, ?, ?, ?)');
        const info = stmt.run(userId, filename, ext, filePath, 'processing');
        const docId = info.lastInsertRowid;

        const profile = db.prepare('SELECT chunk_size, chunk_overlap FROM profiles WHERE user_id = ?').get(userId) || {};
        
        try {
          const result = await ragBridge.ingest(userId, filePath, docId, ext, {
            chunkSize: profile.chunk_size,
            chunkOverlap: profile.chunk_overlap
          });
          db.prepare('UPDATE documents SET chunk_count = ?, status = ? WHERE id = ?')
            .run(result.chunkCount, 'ready', docId);
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message || 'Unknown ingestion error';
          db.prepare('UPDATE documents SET status = ?, error_message = ? WHERE id = ?')
            .run('error', errorMsg, docId);
        }
      } catch (err) {
        console.error('Watcher Add error:', err);
      }
    })
    .on('change', async (filePath) => {
      try {
        const existing = db.prepare('SELECT id, user_id, file_type FROM documents WHERE file_path = ?').get(filePath);
        if (!existing) return;

        const docId = existing.id;
        const userId = existing.user_id;

        // Reset to processing
        db.prepare('UPDATE documents SET chunk_count = 0, status = ?, error_message = NULL WHERE id = ?').run('processing', docId);

        // Delete from FAISS
        await ragBridge.deleteDocument(userId, docId).catch(() => {});

        // Re-ingest
        const profile = db.prepare('SELECT chunk_size, chunk_overlap FROM profiles WHERE user_id = ?').get(userId) || {};
        try {
          const result = await ragBridge.ingest(userId, filePath, docId, existing.file_type, {
            chunkSize: profile.chunk_size,
            chunkOverlap: profile.chunk_overlap
          });
          db.prepare('UPDATE documents SET chunk_count = ?, status = ? WHERE id = ?')
            .run(result.chunkCount, 'ready', docId);
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message || 'Unknown ingestion error';
          db.prepare('UPDATE documents SET status = ?, error_message = ? WHERE id = ?')
            .run('error', errorMsg, docId);
        }
      } catch (err) {
        console.error('Watcher Change error:', err);
      }
    })
    .on('unlink', async (filePath) => {
      try {
        const existing = db.prepare('SELECT id, user_id FROM documents WHERE file_path = ?').get(filePath);
        if (!existing) return;

        const docId = existing.id;
        const userId = existing.user_id;

        // Remove from RAG
        await ragBridge.deleteDocument(userId, docId).catch(() => {});

        // Remove from DB
        db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
      } catch (err) {
        console.error('Watcher Unlink error:', err);
      }
    });

  console.log('Chokidar file watcher initialized on', config.UPLOAD_DIR);
}

module.exports = { startWatcher };
