const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./database');

const app = express();

app.use(cors());
app.use(express.json());

// Routes will be added here
app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/reminders', require('./routes/reminders.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const { startScheduler } = require('./services/scheduler');

app.listen(config.PORT, () => {
  console.log(`MindSpace API running on port ${config.PORT}`);
  startScheduler();
});
