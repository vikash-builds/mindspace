const express = require('express');

const auth = require('../middleware/auth');
const db = require('../database');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [req.auth.userId]);
    const profile = result.rows[0];
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  const userId = req.auth.userId;
  const {
    email,
    name,
    profession,
    chunk_size,
    chunk_overlap,
    top_k,
    temperature,
    similarity_threshold,
  } = req.body;

  if (!name || !profession) {
    return res.status(400).json({ error: 'Name and profession are required' });
  }

  try {
    await db.query(`
      INSERT INTO profiles (
        user_id, email, name, profession, chunk_size, chunk_overlap, top_k, temperature, similarity_threshold
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        profession = EXCLUDED.profession,
        chunk_size = EXCLUDED.chunk_size,
        chunk_overlap = EXCLUDED.chunk_overlap,
        top_k = EXCLUDED.top_k,
        temperature = EXCLUDED.temperature,
        similarity_threshold = EXCLUDED.similarity_threshold
    `, [
      userId,
      email || '',
      name,
      profession,
      chunk_size,
      chunk_overlap,
      top_k,
      temperature,
      similarity_threshold,
    ]);

    res.json({ message: 'Profile saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
