const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'server.log');
const MAX_LOG_SIZE = 1024 * 1024 * 2; // 2MB

function logToFile(message) {
  if (fs.existsSync(LOG_FILE) && fs.statSync(LOG_FILE).size > MAX_LOG_SIZE) {
    fs.renameSync(LOG_FILE, LOG_FILE + '.' + Date.now());
  }
  fs.appendFileSync(LOG_FILE, message + '\n');
}

function logEvent(event, data) {
  const msg = `[${new Date().toISOString()}] [${event}] ${JSON.stringify(data)}`;
  console.log(msg);
  logToFile(msg);
}

function logError(error, data) {
  const msg = `[${new Date().toISOString()}] [ERROR] ${error} ${JSON.stringify(data)}`;
  console.error(msg);
  logToFile(msg);
}

module.exports = { logEvent, logError }; 