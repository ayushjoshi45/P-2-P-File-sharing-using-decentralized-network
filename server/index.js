const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const config = require('./config');
const peerManager = require('./peers');
const apiRoutes = require('./routes');
const { logEvent, logError } = require('./logger');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api', apiRoutes);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Heartbeat and presence
setInterval(() => {
  peerManager.checkTimeouts();
}, config.HEARTBEAT_INTERVAL);

// WebSocket logic
io.on('connection', (socket) => {
  logEvent('ws_connect', { id: socket.id, ip: socket.handshake.address });
  // Register peer on connect
  peerManager.addPeer(socket);

  socket.on('heartbeat', () => {
    peerManager.heartbeat(socket.id);
    logEvent('heartbeat', { id: socket.id });
  });

  socket.on('update_meta', (meta) => {
    peerManager.updatePeer(socket.id, meta);
    logEvent('update_meta', { id: socket.id, meta });
  });

  socket.on('announce_files', (files) => {
    peerManager.updatePeer(socket.id, { files });
    logEvent('announce_files', { id: socket.id, files });
  });

  socket.on('signal', (data) => {
    const { target, signal } = data;
    const targetPeer = peerManager.getPeer(target);
    if (targetPeer) {
      targetPeer.socket.emit('signal', { from: socket.id, signal });
      logEvent('signal_forwarded', { from: socket.id, to: target });
    } else {
      logError('signal_failed', { from: socket.id, to: target });
    }
  });

  socket.on('chat', (msg) => {
    // Relay chat to target peer
    const { to, message } = msg;
    const targetPeer = peerManager.getPeer(to);
    if (targetPeer) {
      targetPeer.socket.emit('chat', { from: socket.id, message });
      logEvent('chat_relay', { from: socket.id, to, message });
    }
  });

  socket.on('disconnect', () => {
    peerManager.removePeer(socket.id);
    io.emit('peer-disconnected', socket.id);
    logEvent('ws_disconnect', { id: socket.id });
  });

  // Send the list of currently connected peers
  socket.emit('peers', peerManager.getOnlinePeers().map(p => p.id).filter(id => id !== socket.id));
  // Notify others of the new peer
  socket.broadcast.emit('new-peer', socket.id);
});

// REST API root
app.get('/', (req, res) => {
  res.send('P2P File Sharing Signaling Server is running.');
});

// Error handler
app.use((err, req, res, next) => {
  logError('express_error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

server.listen(config.PORT, () => {
  logEvent('server_start', { port: config.PORT });
  console.log(`Signaling server running on port ${config.PORT}`);
}); 