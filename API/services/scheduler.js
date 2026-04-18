const db = require('../database');
const emailService = require('./email.service');

const startScheduler = () => {
  let running = false;

  const runCycle = async () => {
    if (running) {
      return;
    }

    running = true;
    const now = new Date().toISOString();

    try {
      const result = await db.query(`
        SELECT reminders.*, profiles.email
        FROM reminders
        LEFT JOIN profiles ON profiles.user_id = reminders.user_id
        WHERE remind_at <= $1 AND status = 'pending'
      `, [now]);

      for (const reminder of result.rows) {
        if (reminder.email_notify) {
          await emailService.sendReminder(reminder.email, reminder.title, reminder.description);
        }

        await db.query(
          "UPDATE reminders SET status = 'fired', delivered_at = NOW(), updated_at = NOW() WHERE id = $1",
          [reminder.id],
        );

        if (reminder.recurrence === 'daily') {
          const nextDate = new Date(reminder.remind_at);
          nextDate.setDate(nextDate.getDate() + 1);
          await db.query(`
            INSERT INTO reminders (
              user_id, title, description, remind_at, recurrence, status,
              priority, category, notes, source_document_id, source_message_id, email_notify
            ) VALUES ($1, $2, $3, $4, 'daily', 'pending', $5, $6, $7, $8, $9, $10)
          `, [
            reminder.user_id,
            reminder.title,
            reminder.description,
            nextDate.toISOString(),
            reminder.priority,
            reminder.category,
            reminder.notes,
            reminder.source_document_id,
            reminder.source_message_id,
            reminder.email_notify,
          ]);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    } finally {
      running = false;
    }
  };

  runCycle().catch(() => {});
  setInterval(() => {
    runCycle().catch(() => {});
  }, 15000);

  console.log('MindSpace Scheduler started (15s cadence)');
};

module.exports = { startScheduler };
