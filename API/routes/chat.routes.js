const express = require('express');
const multer = require('multer');
const path = require('path');

const auth = require('../middleware/auth');
const config = require('../config');
const db = require('../database');
const ragBridge = require('../services/rag-bridge');
const storageService = require('../services/storage.service');
const { buildSearchRegex, detectActionIntent, findBestTaskReference } = require('../services/action-intent.service');

const router = express.Router();
const attachmentUpload = multer({ storage: multer.memoryStorage() });

async function findOrCreateChecklist(userId, title) {
  const existing = await db.query(`
    SELECT id
    FROM checklists
    WHERE user_id = $1 AND title = $2
    ORDER BY updated_at DESC
    LIMIT 1
  `, [userId, title]);

  if (existing.rows[0]) {
    return existing.rows[0].id;
  }

  const created = await db.query(`
    INSERT INTO checklists (user_id, title, description, status)
    VALUES ($1, $2, $3, 'active')
    RETURNING id
  `, [userId, title, 'Created automatically from chat']);

  return created.rows[0].id;
}

async function findReminderByTitle(userId, title) {
  const result = await db.query(`
    SELECT *
    FROM reminders
    WHERE user_id = $1
      AND LOWER(title) LIKE LOWER($2)
    ORDER BY created_at DESC
    LIMIT 1
  `, [userId, `%${title}%`]);
  return result.rows[0] || null;
}

async function findChecklistByTitle(userId, title) {
  const result = await db.query(`
    SELECT *
    FROM checklists
    WHERE user_id = $1
      AND LOWER(title) LIKE LOWER($2)
    ORDER BY updated_at DESC
    LIMIT 1
  `, [userId, `%${title}%`]);
  return result.rows[0] || null;
}

async function findTaskByReference(userId, reference) {
  const result = await db.query(`
    SELECT checklist_items.*, checklists.user_id, checklists.title AS checklist_title
    FROM checklist_items
    JOIN checklists ON checklists.id = checklist_items.checklist_id
    WHERE checklists.user_id = $1
    ORDER BY checklist_items.updated_at DESC, checklist_items.created_at DESC
  `, [userId]);

  const tasks = result.rows;
  if (!tasks.length) {
    return null;
  }
  if (!reference || reference === '__last__') {
    return tasks[0];
  }

  const regex = buildSearchRegex(reference);
  return tasks.find((task) => regex.test(task.item_text)) || null;
}

async function listReminderSummary(userId, { remind_at, history = false, entity = 'reminder' }) {
  if (entity === 'checklist' || entity === 'task') {
    const checklistsResult = await db.query(`
      SELECT checklists.*, checklist_items.id AS item_id, checklist_items.item_text, checklist_items.is_done, checklist_items.due_date
      FROM checklists
      LEFT JOIN checklist_items ON checklist_items.checklist_id = checklists.id
      WHERE checklists.user_id = $1
      ORDER BY checklists.updated_at DESC, checklist_items.position ASC
    `, [userId]);

    if (entity === 'checklist') {
      const checklistMap = new Map();
      for (const row of checklistsResult.rows) {
        if (!checklistMap.has(row.id)) {
          checklistMap.set(row.id, { title: row.title, status: row.status, items: [] });
        }
        if (row.item_id) {
          checklistMap.get(row.id).items.push(row);
        }
      }
      const entries = [...checklistMap.values()]
        .filter((checklist) => history ? checklist.status === 'completed' : checklist.status !== 'completed')
        .slice(0, 5);
      if (!entries.length) {
        return `You don't have any ${history ? 'completed' : 'active'} checklists right now.`;
      }
      return entries
        .map((checklist, index) => `${index + 1}. ${checklist.title} (${checklist.items.filter((item) => item.is_done).length}/${checklist.items.length} done)`)
        .join('\n');
    }

    const tasks = checklistsResult.rows
      .filter((row) => row.item_id)
      .filter((row) => history ? row.is_done : !row.is_done)
      .slice(0, 8);
    if (!tasks.length) {
      return `You don't have any ${history ? 'completed' : 'open'} tasks right now.`;
    }
    return tasks
      .map((task, index) => `${index + 1}. ${task.item_text}${task.due_date ? ` — due ${new Date(task.due_date).toLocaleString()}` : ''}`)
      .join('\n');
  }

  let query = `
    SELECT title, remind_at, status
    FROM reminders
    WHERE user_id = $1
  `;
  const params = [userId];

  if (history) {
    query += " AND status IN ('completed', 'fired')";
  } else {
    query += " AND status NOT IN ('completed')";
  }

  if (remind_at) {
    query += ' AND DATE(remind_at) = DATE($2)';
    params.push(remind_at);
  }

  query += ' ORDER BY remind_at ASC LIMIT 8';
  const result = await db.query(query, params);
  if (!result.rows.length) {
    return `You don't have any ${history ? 'completed' : 'upcoming'} reminders${remind_at ? ' for that time period' : ''}.`;
  }

  return result.rows
    .map((reminder, index) => `${index + 1}. ${reminder.title} — ${new Date(reminder.remind_at).toLocaleString()}${history ? ` (${reminder.status})` : ''}`)
    .join('\n');
}

async function createActionFromIntent(userId, intent, sourceMessageId) {
  if (!intent?.valid) {
    return {
      answer: `I can create that for you, but I still need the ${intent?.missing || 'details'}.`,
      sourceChunks: [],
    };
  }

  if (intent.type === 'reminder') {
    const result = await db.query(`
      INSERT INTO reminders (
        user_id, title, description, remind_at, recurrence, status,
        priority, category, notes, source_document_id, source_message_id, email_notify
      ) VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8, NULL, $9, $10)
      RETURNING id, title, remind_at
    `, [
      userId,
      intent.payload.title,
      intent.payload.description,
      intent.payload.remind_at,
      intent.payload.recurrence,
      intent.payload.priority,
      intent.payload.category,
      intent.payload.notes,
      sourceMessageId,
      Boolean(intent.payload.email_notify),
    ]);

    const reminder = result.rows[0];
    return {
      answer: `Reminder created: "${reminder.title}" for ${new Date(reminder.remind_at).toLocaleString()}.`,
      sourceChunks: [],
      action: { type: 'reminder', id: reminder.id },
    };
  }

  if (intent.type === 'reminder_complete') {
    const reminder = await findReminderByTitle(userId, intent.payload.title);
    if (!reminder) {
      return {
        answer: `I couldn't find a reminder matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query(`
      UPDATE reminders
      SET status = 'completed', updated_at = NOW(), acknowledged_at = COALESCE(acknowledged_at, NOW())
      WHERE id = $1
    `, [reminder.id]);

    return {
      answer: `Reminder completed: "${reminder.title}".`,
      sourceChunks: [],
      action: { type: 'reminder_complete', id: reminder.id },
    };
  }

  if (intent.type === 'reminder_delete') {
    const reminder = await findReminderByTitle(userId, intent.payload.title);
    if (!reminder) {
      return {
        answer: `I couldn't find a reminder matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query('DELETE FROM reminders WHERE id = $1', [reminder.id]);
    return {
      answer: `Reminder deleted: "${reminder.title}".`,
      sourceChunks: [],
      action: { type: 'reminder_delete', id: reminder.id },
    };
  }

  if (intent.type === 'reminder_edit') {
    const reminder = await findReminderByTitle(userId, intent.payload.title);
    if (!reminder) {
      return {
        answer: `I couldn't find a reminder matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    const nextTitle = intent.payload.nextTitle || reminder.title;
    const nextRemindAt = intent.payload.remind_at || reminder.remind_at;

    await db.query(`
      UPDATE reminders
      SET title = $1, remind_at = $2, updated_at = NOW(), status = CASE WHEN status = 'completed' THEN 'pending' ELSE status END
      WHERE id = $3
    `, [nextTitle, nextRemindAt, reminder.id]);

    return {
      answer: `Reminder updated: "${nextTitle}" for ${new Date(nextRemindAt).toLocaleString()}.`,
      sourceChunks: [],
      action: { type: 'reminder_edit', id: reminder.id },
    };
  }

  if (intent.type === 'reminder_snooze') {
    const reminder = await findReminderByTitle(userId, intent.payload.title);
    if (!reminder) {
      return {
        answer: `I couldn't find a reminder matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query(`
      UPDATE reminders
      SET remind_at = $1, status = 'pending', delivered_at = NULL, acknowledged_at = NULL, updated_at = NOW()
      WHERE id = $2
    `, [intent.payload.remind_at, reminder.id]);

    return {
      answer: `Reminder snoozed: "${reminder.title}" is now set for ${new Date(intent.payload.remind_at).toLocaleString()}.`,
      sourceChunks: [],
      action: { type: 'reminder_snooze', id: reminder.id },
    };
  }

  if (intent.type === 'reminder_list') {
    const answer = await listReminderSummary(userId, intent.payload);
    return {
      answer,
      sourceChunks: [],
      action: { type: 'reminder_list' },
    };
  }

  if (intent.type === 'checklist') {
    const checklistId = await db.withTransaction(async (client) => {
      const checklistResult = await client.query(`
        INSERT INTO checklists (user_id, title, description, status)
        VALUES ($1, $2, $3, 'active')
        RETURNING id
      `, [userId, intent.payload.title, intent.payload.description || 'Created from chat']);

      const createdChecklistId = checklistResult.rows[0].id;
      for (let index = 0; index < intent.payload.items.length; index += 1) {
        const item = intent.payload.items[index];
        await client.query(`
          INSERT INTO checklist_items (checklist_id, item_text, is_done, priority, due_date, position)
          VALUES ($1, $2, false, $3, $4, $5)
        `, [createdChecklistId, item.item_text, item.priority || 'medium', item.due_date || null, index]);
      }

      return createdChecklistId;
    });

    return {
      answer: `Checklist created: "${intent.payload.title}" with ${intent.payload.items.length} item${intent.payload.items.length === 1 ? '' : 's'}.`,
      sourceChunks: [],
      action: { type: 'checklist', id: checklistId },
    };
  }

  if (intent.type === 'checklist_complete') {
    const checklist = await findChecklistByTitle(userId, intent.payload.title);
    if (!checklist) {
      return {
        answer: `I couldn't find a checklist matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query(`
      UPDATE checklists
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1
    `, [checklist.id]);
    await db.query(`
      UPDATE checklist_items
      SET is_done = true, updated_at = NOW()
      WHERE checklist_id = $1
    `, [checklist.id]);

    return {
      answer: `Checklist completed: "${checklist.title}".`,
      sourceChunks: [],
      action: { type: 'checklist_complete', id: checklist.id },
    };
  }

  if (intent.type === 'checklist_delete') {
    const checklist = await findChecklistByTitle(userId, intent.payload.title);
    if (!checklist) {
      return {
        answer: `I couldn't find a checklist matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query('DELETE FROM checklists WHERE id = $1', [checklist.id]);
    return {
      answer: `Checklist deleted: "${checklist.title}".`,
      sourceChunks: [],
      action: { type: 'checklist_delete', id: checklist.id },
    };
  }

  if (intent.type === 'task') {
    const checklistId = await findOrCreateChecklist(userId, intent.payload.checklistTitle);
    const posResult = await db.query('SELECT COALESCE(MAX(position), -1) AS max_position FROM checklist_items WHERE checklist_id = $1', [checklistId]);
    const position = Number(posResult.rows[0].max_position) + 1;
    const result = await db.query(`
      INSERT INTO checklist_items (checklist_id, item_text, is_done, priority, due_date, position)
      VALUES ($1, $2, false, $3, $4, $5)
      RETURNING id
    `, [checklistId, intent.payload.item_text, intent.payload.priority || 'medium', intent.payload.due_date || null, position]);

    return {
      answer: `Task added to "${intent.payload.checklistTitle}": "${intent.payload.item_text}".`,
      sourceChunks: [],
      action: { type: 'task', id: result.rows[0].id, checklistId },
    };
  }

  if (intent.type === 'task_complete') {
    const task = await findTaskByReference(userId, intent.payload.title || findBestTaskReference(intent.payload.title));
    if (!task) {
      return {
        answer: `I couldn't find a task matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query(`
      UPDATE checklist_items
      SET is_done = true, updated_at = NOW()
      WHERE id = $1
    `, [task.id]);

    return {
      answer: `Task completed: "${task.item_text}".`,
      sourceChunks: [],
      action: { type: 'task_complete', id: task.id },
    };
  }

  if (intent.type === 'task_delete') {
    const task = await findTaskByReference(userId, intent.payload.title || findBestTaskReference(intent.payload.title));
    if (!task) {
      return {
        answer: `I couldn't find a task matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    await db.query('DELETE FROM checklist_items WHERE id = $1', [task.id]);
    return {
      answer: `Task deleted: "${task.item_text}".`,
      sourceChunks: [],
      action: { type: 'task_delete', id: task.id },
    };
  }

  if (intent.type === 'task_edit') {
    const task = await findTaskByReference(userId, intent.payload.title);
    if (!task) {
      return {
        answer: `I couldn't find a task matching "${intent.payload.title}".`,
        sourceChunks: [],
      };
    }

    const nextTitle = intent.payload.nextTitle || task.item_text;
    const nextDueDate = intent.payload.due_date || task.due_date;
    await db.query(`
      UPDATE checklist_items
      SET item_text = $1, due_date = $2, updated_at = NOW()
      WHERE id = $3
    `, [nextTitle, nextDueDate, task.id]);

    return {
      answer: `Task updated: "${nextTitle}"${nextDueDate ? ` for ${new Date(nextDueDate).toLocaleString()}` : ''}.`,
      sourceChunks: [],
      action: { type: 'task_edit', id: task.id },
    };
  }

  return null;
}

router.post('/attachments', auth, attachmentUpload.array('files'), async (req, res) => {
  try {
    const uploads = await Promise.all((req.files || []).map(async (file) => {
      const objectPath = `${req.auth.userId}/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      await storageService.uploadBuffer(
        config.SUPABASE_CHAT_ATTACHMENTS_BUCKET,
        objectPath,
        file.buffer,
        file.mimetype,
      );
      const signedUrl = await storageService.createSignedUrl(config.SUPABASE_CHAT_ATTACHMENTS_BUCKET, objectPath);
      return {
        id: objectPath,
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        bucket: config.SUPABASE_CHAT_ATTACHMENTS_BUCKET,
        objectPath,
        url: signedUrl,
      };
    }));
    res.status(201).json({ attachments: uploads });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, title, created_at, updated_at
      FROM chats
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `, [req.auth.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pins', auth, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, chat_id, content, role, attachments, pinned_at, created_at
      FROM chat_history
      WHERE user_id = $1 AND is_pinned = true
      ORDER BY pinned_at DESC, created_at DESC
    `, [req.auth.userId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/messages/:messageId/pin', auth, async (req, res) => {
  try {
    const result = await db.query('SELECT id FROM chat_history WHERE id = $1 AND user_id = $2', [req.params.messageId, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Message not found' });
    }
    const isPinned = Boolean(req.body.isPinned);
    await db.query(`
      UPDATE chat_history
      SET is_pinned = $1, pinned_at = $2
      WHERE id = $3
    `, [isPinned, isPinned ? new Date().toISOString() : null, req.params.messageId]);
    res.json({ id: req.params.messageId, isPinned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/sessions/:chatId', auth, async (req, res) => {
  try {
    const result = await db.query('DELETE FROM chats WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.chatId, req.auth.userId]);
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/history/:chatId', auth, async (req, res) => {
  if (req.params.chatId === 'temp') {
    return res.json([]);
  }

  try {
    const result = await db.query(`
      SELECT *
      FROM chat_history
      WHERE user_id = $1 AND chat_id = $2
      ORDER BY created_at ASC
    `, [req.auth.userId, req.params.chatId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { question, chatId, attachments = [] } = req.body;
  const userId = req.auth.userId;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    let currentChatId = chatId;
    let history = [];
    let userMessageId = null;

    if (currentChatId !== 'temp') {
      if (!currentChatId) {
        const title = question.length > 30 ? `${question.substring(0, 30)}...` : question;
        const inserted = await db.query('INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id', [userId, title]);
        currentChatId = inserted.rows[0].id;
      } else {
        const chat = await db.query('SELECT id FROM chats WHERE id = $1 AND user_id = $2', [currentChatId, userId]);
        if (!chat.rows[0]) {
          return res.status(403).json({ error: 'Unauthorized or chat not found' });
        }
        await db.query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [currentChatId]);
        const historyResult = await db.query(`
          SELECT role, content, attachments
          FROM chat_history
          WHERE user_id = $1 AND chat_id = $2
          ORDER BY created_at ASC
          LIMIT 10
        `, [userId, currentChatId]);
        history = historyResult.rows;
      }

      const userMessageResult = await db.query(`
        INSERT INTO chat_history (user_id, chat_id, role, content, attachments)
        VALUES ($1, $2, 'user', $3, $4::jsonb)
        RETURNING id
      `, [userId, currentChatId, question, JSON.stringify(attachments)]);
      userMessageId = userMessageResult.rows[0].id;
    }

    const actionIntent = detectActionIntent(question);
    const ragResult = actionIntent
      ? await createActionFromIntent(userId, actionIntent, userMessageId)
      : await (async () => {
          const profileResult = await db.query(`
            SELECT top_k, temperature, similarity_threshold
            FROM profiles
            WHERE user_id = $1
          `, [userId]);
          const profile = profileResult.rows[0] || {};

          return ragBridge.query(userId, question, history, {
            topK: profile.top_k,
            temperature: profile.temperature,
            similarityThreshold: profile.similarity_threshold,
          });
        })();

    let assistantMessageId = null;
    if (currentChatId !== 'temp') {
      const inserted = await db.query(`
        INSERT INTO chat_history (user_id, chat_id, role, content, source_chunks)
        VALUES ($1, $2, 'assistant', $3, $4::jsonb)
        RETURNING id
      `, [userId, currentChatId, ragResult.answer, JSON.stringify(ragResult.sourceChunks)]);
      assistantMessageId = inserted.rows[0].id;
    }

    res.json({ ...ragResult, chatId: currentChatId, assistantMessageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
