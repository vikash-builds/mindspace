const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../database');
const ragBridge = require('../services/rag-bridge');

// Get list of chat sessions
router.get('/sessions', auth, (req, res) => {
  const user_id = req.auth.userId;
  try {
    const sessions = db.prepare('SELECT id, title, created_at, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC').all(user_id);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a chat session
router.delete('/sessions/:chatId', auth, (req, res) => {
  const user_id = req.auth.userId;
  const chat_id = req.params.chatId;
  try {
    const info = db.prepare('DELETE FROM chats WHERE id = ? AND user_id = ?').run(chat_id, user_id);
    if (info.changes === 0) return res.status(404).json({ error: 'Chat not found' });
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat history for a specific session
router.get('/history/:chatId', auth, (req, res) => {
  const user_id = req.auth.userId;
  const chat_id = req.params.chatId;
  
  if (chat_id === 'temp') {
    return res.json([]);
  }

  try {
    const history = db.prepare('SELECT * FROM chat_history WHERE user_id = ? AND chat_id = ? ORDER BY created_at ASC').all(user_id, chat_id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  const { question, chatId } = req.body;
  const user_id = req.auth.userId;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    let currentChatId = chatId;
    let history = [];

    if (currentChatId === 'temp') {
      // Do not load history from DB, don't save to DB
    } else {
      if (!currentChatId) {
        // Create new chat
        const title = question.length > 30 ? question.substring(0, 30) + '...' : question;
        const stmt = db.prepare('INSERT INTO chats (user_id, title) VALUES (?, ?)');
        const info = stmt.run(user_id, title);
        currentChatId = info.lastInsertRowid;
      } else {
        // Verify chat ownership and update updated_at
        const chat = db.prepare('SELECT id FROM chats WHERE id = ? AND user_id = ?').get(currentChatId, user_id);
        if (!chat) return res.status(403).json({ error: 'Unauthorized or chat not found' });
        db.prepare('UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(currentChatId);

        // Get history for RAG context
        history = db.prepare('SELECT role, content FROM chat_history WHERE user_id = ? AND chat_id = ? ORDER BY created_at ASC LIMIT 10').all(user_id, currentChatId);
      }

      // Save user message to DB
      db.prepare('INSERT INTO chat_history (user_id, chat_id, role, content) VALUES (?, ?, ?, ?)')
        .run(user_id, currentChatId, 'user', question);
    }

    // Get user profile for RAG params
    const profile = db.prepare('SELECT top_k, temperature, similarity_threshold FROM profiles WHERE user_id = ?').get(user_id) || {};

    // 3. Call Python RAG
    const result = await ragBridge.query(user_id, question, history, {
      topK: profile.top_k,
      temperature: profile.temperature,
      similarityThreshold: profile.similarity_threshold
    });

    if (currentChatId !== 'temp') {
      // 4. Save assistant response to DB
      db.prepare('INSERT INTO chat_history (user_id, chat_id, role, content, source_chunks) VALUES (?, ?, ?, ?, ?)')
        .run(user_id, currentChatId, 'assistant', result.answer, JSON.stringify(result.sourceChunks));
    }

    res.json({ ...result, chatId: currentChatId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
