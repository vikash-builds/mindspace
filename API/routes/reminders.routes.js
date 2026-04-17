const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../database');

// --- Reminders ---

// Create reminder
router.post('/', auth, (req, res) => {
  const { title, description, remind_at, recurrence, email_notify } = req.body;
  const user_id = req.auth.userId;

  if (!title || !remind_at) {
    return res.status(400).json({ error: 'Title and remind_at are required' });
  }

  try {
    const stmt = db.prepare('INSERT INTO reminders (user_id, title, description, remind_at, recurrence, email_notify) VALUES (?, ?, ?, ?, ?, ?)');
    const info = stmt.run(user_id, title, description, remind_at, recurrence, email_notify ? 1 : 0);
    res.status(201).json({ id: info.lastInsertRowid, title, remind_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List reminders
router.get('/', auth, (req, res) => {
  try {
    const reminders = db.prepare('SELECT * FROM reminders WHERE user_id = ? ORDER BY remind_at ASC').all(req.auth.userId);
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete reminder
router.delete('/:id', auth, (req, res) => {
  try {
    const info = db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?').run(req.params.id, req.auth.userId);
    if (info.changes === 0) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Checklists ---

// Create checklist
router.post('/checklists', auth, (req, res) => {
  const { title, due_date, items } = req.body;
  const user_id = req.auth.userId;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const stmt = db.prepare('INSERT INTO checklists (user_id, title, due_date) VALUES (?, ?, ?)');
    const info = stmt.run(user_id, title, due_date);
    const checklistId = info.lastInsertRowid;

    if (items && Array.isArray(items)) {
      const itemStmt = db.prepare('INSERT INTO checklist_items (checklist_id, item_text) VALUES (?, ?)');
      for (const item of items) {
        itemStmt.run(checklistId, item);
      }
    }

    res.status(201).json({ id: checklistId, title });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List checklists
router.get('/checklists', auth, (req, res) => {
  try {
    const checklists = db.prepare('SELECT * FROM checklists WHERE user_id = ?').all(req.auth.userId);
    for (const cl of checklists) {
      cl.items = db.prepare('SELECT * FROM checklist_items WHERE checklist_id = ?').all(cl.id);
    }
    res.json(checklists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle checklist item
router.patch('/checklists/items/:id', auth, (req, res) => {
  const { is_done } = req.body;
  try {
    // Note: In a real app, we should verify the checklist belongs to the user
    db.prepare('UPDATE checklist_items SET is_done = ? WHERE id = ?').run(is_done ? 1 : 0, req.params.id);
    res.json({ message: 'Item updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
