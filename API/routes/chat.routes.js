const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../database');
const ragBridge = require('../services/rag-bridge');

// Send a message
router.post('/', auth, async (req, res) => {
  const { question } = req.body;
  const user_id = req.auth.userId;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // 1. Get chat history from DB
    const history = db.prepare('SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 10').all(user_id);

    // 2. Save user message to DB
    db.prepare('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)')
      .run(user_id, 'user', question);

    // Get user profile for RAG params
    const profile = db.prepare('SELECT top_k, temperature, similarity_threshold FROM profiles WHERE user_id = ?').get(user_id) || {};

    // 3. Call Python RAG
    const result = await ragBridge.query(user_id, question, history, {
      topK: profile.top_k,
      temperature: profile.temperature,
      similarityThreshold: profile.similarity_threshold
    });

    // 4. Save assistant response to DB
    db.prepare('INSERT INTO chat_history (user_id, role, content, source_chunks) VALUES (?, ?, ?, ?)')
      .run(user_id, 'assistant', result.answer, JSON.stringify(result.sourceChunks));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get chat history
router.get('/history', auth, (req, res) => {
  try {
    const history = db.prepare('SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC').all(req.auth.userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
