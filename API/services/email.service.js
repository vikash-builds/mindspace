const nodemailer = require('nodemailer');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.EMAIL_CONFIG.host,
      port: config.EMAIL_CONFIG.port,
      secure: config.EMAIL_CONFIG.port == 465,
      auth: {
        user: config.EMAIL_CONFIG.user,
        pass: config.EMAIL_CONFIG.pass,
      },
    });
  }

  async sendReminder(email, title, description) {
    if (!config.EMAIL_CONFIG.user) {
      console.log('Email not configured, skipping send for:', title);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `"MindSpace Assistant" <${config.EMAIL_CONFIG.user}>`,
        to: email,
        subject: `Reminder: ${title}`,
        text: `Hello,\n\nThis is a reminder for: ${title}\n\nDescription: ${description || 'No description'}\n\nHave a great day!`,
      });
      console.log('Email sent successfully to:', email);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}

module.exports = new EmailService();
