const express = require('express');
const cors = require('cors');
const { clerkMiddleware } = require('@clerk/express');

const config = require('./config');
const db = require('./database');
const storageService = require('./services/storage.service');

const app = express();

app.use(clerkMiddleware({
  publishableKey: config.CLERK_PUBLISHABLE_KEY,
  secretKey: config.CLERK_SECRET_KEY,
}));
app.use(cors());
app.use(express.json({ limit: '25mb' }));

app.use('/api/profile', require('./routes/profile.routes'));
app.use('/api/documents', require('./routes/documents.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/reminders', require('./routes/reminders.routes'));
app.use('/api/integrations', require('./routes/integrations.routes'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    deploymentMode: config.DEPLOYMENT_MODE,
  });
});

app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.stack);
  res.status(err.statusCode || 500).json({ error: err.message });
});

const { startScheduler } = require('./services/scheduler');
const { startWatcher } = require('./watcher');

async function start() {
  await db.initDatabase();
  await storageService.ensureBuckets();

  app.listen(config.PORT, () => {
    console.log(`MindSpace API running on port ${config.PORT}`);
    startWatcher();
    startScheduler();
  });
}

start().catch((error) => {
  console.error('Failed to start API server:', error);
  process.exit(1);
});
