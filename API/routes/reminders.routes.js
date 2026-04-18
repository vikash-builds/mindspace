const express = require('express');

const auth = require('../middleware/auth');
const db = require('../database');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  const {
    title,
    description,
    remind_at,
    recurrence,
    email_notify,
    priority = 'medium',
    category = 'general',
    notes = '',
    source_document_id = null,
    source_message_id = null,
  } = req.body;

  if (!title || !remind_at) {
    return res.status(400).json({ error: 'Title and remind_at are required' });
  }

  try {
    const result = await db.query(`
      INSERT INTO reminders (
        user_id, title, description, remind_at, recurrence, status,
        priority, category, notes, source_document_id, source_message_id, email_notify
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      req.auth.userId,
      title,
      description,
      remind_at,
      recurrence,
      priority,
      category,
      notes,
      source_document_id,
      source_message_id,
      Boolean(email_notify),
    ]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const statusFilter = req.query.status;
    const history = req.query.history === 'true';
    let query = `
      SELECT *
      FROM reminders
      WHERE user_id = $1
    `;
    const params = [req.auth.userId];

    if (statusFilter) {
      query += ' AND status = $2';
      params.push(statusFilter);
    } else if (history) {
      query += " AND status IN ('completed', 'fired')";
    } else {
      query += " AND status NOT IN ('completed')";
    }

    query += ' ORDER BY remind_at ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/notifications', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, title, description, remind_at, delivered_at, status
      FROM reminders
      WHERE user_id = $1
        AND status = 'fired'
        AND acknowledged_at IS NULL
      ORDER BY remind_at DESC
      LIMIT 10
    `, [req.auth.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/notifications/:id/ack', auth, async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE reminders
      SET acknowledged_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [req.params.id, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json({ acknowledged: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const current = await db.query('SELECT * FROM reminders WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    const reminder = current.rows[0];
    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const merged = {
      ...reminder,
      ...req.body,
      email_notify: req.body.email_notify !== undefined ? Boolean(req.body.email_notify) : reminder.email_notify,
    };

    await db.query(`
      UPDATE reminders
      SET title = $1, description = $2, remind_at = $3, recurrence = $4, status = $5,
          priority = $6, category = $7, notes = $8, source_document_id = $9, source_message_id = $10,
          email_notify = $11, updated_at = NOW()
      WHERE id = $12
    `, [
      merged.title,
      merged.description,
      merged.remind_at,
      merged.recurrence,
      merged.status,
      merged.priority,
      merged.category,
      merged.notes,
      merged.source_document_id,
      merged.source_message_id,
      merged.email_notify,
      reminder.id,
    ]);

    res.json({ id: reminder.id, updated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checklists', auth, async (req, res) => {
  const { title, description = '', due_date = null, status = 'active', items = [], source_document_id = null } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const checklistId = await db.withTransaction(async (client) => {
      const checklistResult = await client.query(`
        INSERT INTO checklists (user_id, title, description, due_date, status, source_document_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [req.auth.userId, title, description, due_date, status, source_document_id]);

      const id = checklistResult.rows[0].id;
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        await client.query(`
          INSERT INTO checklist_items (checklist_id, item_text, is_done, priority, due_date, position)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, item.item_text || item, Boolean(item.is_done), item.priority || 'medium', item.due_date || null, index]);
      }

      return id;
    });

    res.status(201).json({ id: checklistId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/checklists', auth, async (req, res) => {
  try {
    const checklistResult = await db.query(`
      SELECT *
      FROM checklists
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.auth.userId]);

    const itemsResult = await db.query(`
      SELECT checklist_items.*
      FROM checklist_items
      JOIN checklists ON checklists.id = checklist_items.checklist_id
      WHERE checklists.user_id = $1
      ORDER BY checklist_items.position ASC, checklist_items.created_at ASC
    `, [req.auth.userId]);

    const itemsByChecklist = new Map();
    for (const item of itemsResult.rows) {
      if (!itemsByChecklist.has(item.checklist_id)) {
        itemsByChecklist.set(item.checklist_id, []);
      }
      itemsByChecklist.get(item.checklist_id).push(item);
    }

    res.json(checklistResult.rows.map((checklist) => ({
      ...checklist,
      items: itemsByChecklist.get(checklist.id) || [],
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/checklists/:id', auth, async (req, res) => {
  try {
    const current = await db.query('SELECT * FROM checklists WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    const checklist = current.rows[0];
    if (!checklist) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const merged = { ...checklist, ...req.body };
    await db.query(`
      UPDATE checklists
      SET title = $1, description = $2, due_date = $3, status = $4, source_document_id = $5, updated_at = NOW()
      WHERE id = $6
    `, [merged.title, merged.description, merged.due_date, merged.status, merged.source_document_id, checklist.id]);

    res.json({ id: checklist.id, updated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/checklists/:id', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM checklists WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Checklist not found' });
    }
    res.json({ message: 'Checklist deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/checklists/:id/items', auth, async (req, res) => {
  const { item_text, priority = 'medium', due_date = null } = req.body;
  if (!item_text) {
    return res.status(400).json({ error: 'item_text is required' });
  }

  try {
    const checklist = await db.query('SELECT * FROM checklists WHERE id = $1 AND user_id = $2', [req.params.id, req.auth.userId]);
    if (!checklist.rows[0]) {
      return res.status(404).json({ error: 'Checklist not found' });
    }

    const posResult = await db.query('SELECT COALESCE(MAX(position), -1) AS max_position FROM checklist_items WHERE checklist_id = $1', [req.params.id]);
    const position = Number(posResult.rows[0].max_position) + 1;
    const result = await db.query(`
      INSERT INTO checklist_items (checklist_id, item_text, priority, due_date, position)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [req.params.id, item_text, priority, due_date, position]);

    res.status(201).json({ id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/checklists/items/:id', auth, async (req, res) => {
  try {
    const itemResult = await db.query(`
      SELECT checklist_items.*, checklists.user_id
      FROM checklist_items
      JOIN checklists ON checklists.id = checklist_items.checklist_id
      WHERE checklist_items.id = $1
    `, [req.params.id]);
    const item = itemResult.rows[0];
    if (!item || item.user_id !== req.auth.userId) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    const merged = { ...item, ...req.body };
    await db.query(`
      UPDATE checklist_items
      SET item_text = $1, is_done = $2, priority = $3, due_date = $4, position = $5, updated_at = NOW()
      WHERE id = $6
    `, [merged.item_text, Boolean(merged.is_done), merged.priority || 'medium', merged.due_date || null, merged.position ?? item.position, item.id]);

    res.json({ id: item.id, updated: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/checklists/items/:id', auth, async (req, res) => {
  try {
    const result = await db.query(`
      DELETE FROM checklist_items
      WHERE id = $1 AND checklist_id IN (SELECT id FROM checklists WHERE user_id = $2)
      RETURNING id
    `, [req.params.id, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    res.json({ message: 'Checklist item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/import-candidates', auth, async (req, res) => {
  const { reminders = [], checklists = [] } = req.body;

  try {
    await db.withTransaction(async (client) => {
      for (const reminder of reminders) {
        await client.query(`
          INSERT INTO reminders (
            user_id, title, description, remind_at, recurrence, status,
            priority, category, notes, source_document_id, source_message_id, email_notify
          ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, $9, $10, $11)
        `, [
          req.auth.userId,
          reminder.title,
          reminder.description || '',
          reminder.remind_at || new Date().toISOString(),
          reminder.recurrence || '',
          reminder.priority || 'medium',
          reminder.category || 'imported',
          reminder.notes || '',
          reminder.source_document_id || null,
          reminder.source_message_id || null,
          Boolean(reminder.email_notify),
        ]);
      }

      for (const checklist of checklists) {
        const checklistResult = await client.query(`
          INSERT INTO checklists (user_id, title, description, due_date, status, source_document_id)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [
          req.auth.userId,
          checklist.title,
          checklist.description || '',
          checklist.due_date || null,
          checklist.status || 'active',
          checklist.source_document_id || null,
        ]);
        const checklistId = checklistResult.rows[0].id;
        for (let index = 0; index < (checklist.items || []).length; index += 1) {
          const item = checklist.items[index];
          await client.query(`
            INSERT INTO checklist_items (checklist_id, item_text, is_done, priority, due_date, position)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [checklistId, item.item_text || item, Boolean(item.is_done), item.priority || 'medium', item.due_date || null, index]);
        }
      }
    });

    res.status(201).json({ imported: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
