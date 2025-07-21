const express = require('express');
const peerManager = require('./peers');
const { verifyToken, logEvent } = require('./utils');
const config = require('./config');

const router = express.Router();

// Middleware for JWT auth
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
}

// Middleware for admin
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token === config.ADMIN_TOKEN) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Peer registration
router.post('/register', (req, res) => {
  // In real app, validate req.body
  const { username, avatar } = req.body;
  // Simulate registration, return JWT
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ username, avatar }, config.JWT_SECRET, { expiresIn: '1h' });
  logEvent('peer_registered', { username });
  res.json({ token });
});

// Get all online peers
router.get('/peers', auth, (req, res) => {
  res.json(peerManager.getOnlinePeers().map(p => ({ id: p.id, username: p.username, avatar: p.avatar, files: p.files })));
});

// Update peer metadata
router.post('/peers/update', auth, (req, res) => {
  const { id, username, avatar, files } = req.body;
  peerManager.updatePeer(id, { username, avatar, files });
  res.json({ success: true });
});

// Search files
router.get('/files/search', auth, (req, res) => {
  const { q } = req.query;
  const results = peerManager.getOnlinePeers().flatMap(p =>
    (p.files || []).filter(f => f.name.includes(q)).map(f => ({ ...f, peerId: p.id, username: p.username }))
  );
  res.json(results);
});

// Admin: get all peers
router.get('/admin/peers', adminAuth, (req, res) => {
  res.json(peerManager.getAllPeers());
});

// Admin: get server stats
router.get('/admin/stats', adminAuth, (req, res) => {
  res.json({
    totalPeers: peerManager.getAllPeers().length,
    onlinePeers: peerManager.getOnlinePeers().length,
    time: new Date().toISOString(),
  });
});

module.exports = router; 