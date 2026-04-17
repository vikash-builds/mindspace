const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../database');

// Get profile
router.get('/', auth, (req, res) => {
  const user_id = req.auth.userId;
  try {
    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user_id);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create/Update profile
router.post('/', auth, (req, res) => {
  const user_id = req.auth.userId;
  const { email, name, profession, chunk_size, chunk_overlap, top_k, temperature, similarity_threshold } = req.body;

  console.log("Profile request received:", { user_id, body: req.body });

  if (!name || !profession) {
    console.error("Validation failed:", { name, profession });
    return res.status(400).json({ error: 'Name and profession are required' });
  }

  try {
    const existing = db.prepare('SELECT user_id FROM profiles WHERE user_id = ?').get(user_id);
    
    if (existing) {
      db.prepare(`
        UPDATE profiles SET 
          email = ?, name = ?, profession = ?, 
          chunk_size = ?, chunk_overlap = ?, top_k = ?, 
          temperature = ?, similarity_threshold = ?
        WHERE user_id = ?
      `).run(email || '', name, profession, chunk_size, chunk_overlap, top_k, temperature, similarity_threshold, user_id);
    } else {
      db.prepare(`
        INSERT INTO profiles (
          user_id, email, name, profession, 
          chunk_size, chunk_overlap, top_k, 
          temperature, similarity_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user_id, email || '', name, profession, chunk_size, chunk_overlap, top_k, temperature, similarity_threshold);
    }
    
    res.json({ message: 'Profile saved successfully' });
  } catch (err) {
    console.error("Profile save error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
