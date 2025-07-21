const jwt = require('jsonwebtoken');
const config = require('./config');

function generateToken(payload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1h' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function logEvent(event, data) {
  console.log(`[${new Date().toISOString()}] [${event}]`, data);
}

function randomId(length = 8) {
  return Math.random().toString(36).substr(2, length);
}

module.exports = { generateToken, verifyToken, logEvent, randomId }; 