const cron = require('node-cron');
const db = require('../database');
const emailService = require('./email.service');

const startScheduler = () => {
  // Check every minute for due reminders
  cron.schedule('* * * * *', () => {
    const now = new Date().toISOString();
    
    try {
      // Find pending reminders due now or earlier
      const dueReminders = db.prepare(`
        SELECT * 
        FROM reminders
        WHERE remind_at <= ? AND status = 'pending'
      `).all(now);

      for (const reminder of dueReminders) {
        console.log(`Processing reminder: ${reminder.title} for user ${reminder.user_id}`);

        // Send email if requested
        if (reminder.email_notify) {
          // Note: In Clerk mode, we'd need to fetch the email from Clerk API or store it locally.
          // For now, we'll log it.
          console.log(`Email notification requested for ${reminder.user_id}, but Clerk email sync is pending.`);
          // emailService.sendReminder(userEmail, reminder.title, reminder.description);
        }

        // Update status to 'fired'
        db.prepare("UPDATE reminders SET status = 'fired' WHERE id = ?").run(reminder.id);

        // Handle recurrence (simplified: if daily, schedule for tomorrow)
        if (reminder.recurrence === 'daily') {
          const nextDate = new Date(reminder.remind_at);
          nextDate.setDate(nextDate.getDate() + 1);
          
          db.prepare('INSERT INTO reminders (user_id, title, description, remind_at, recurrence, email_notify) VALUES (?, ?, ?, ?, ?, ?)')
            .run(reminder.user_id, reminder.title, reminder.description, nextDate.toISOString(), 'daily', reminder.email_notify);
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    }
  });

  console.log('MindSpace Scheduler started');
};

module.exports = { startScheduler };
