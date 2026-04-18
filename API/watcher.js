const chokidar = require('chokidar');

const config = require('./config');

function startWatcher() {
  if (config.DEPLOYMENT_MODE === 'hosted') {
    console.log('File watcher disabled in hosted mode because storage is handled by Supabase Storage.');
    return null;
  }

  const watcher = chokidar.watch(config.UPLOAD_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher.on('ready', () => {
    console.log('Chokidar file watcher initialized on', config.UPLOAD_DIR);
  });

  return watcher;
}

module.exports = { startWatcher };
