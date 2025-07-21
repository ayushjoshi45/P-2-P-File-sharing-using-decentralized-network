const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store connected peers
let peers = {};

io.on('connection', (socket) => {
  console.log('Peer connected:', socket.id);
  peers[socket.id] = socket;

  socket.on('signal', (data) => {
    // Forward signaling data to the target peer
    const { target, signal } = data;
    if (peers[target]) {
      peers[target].emit('signal', { from: socket.id, signal });
    }
  });

  socket.on('disconnect', () => {
    console.log('Peer disconnected:', socket.id);
    delete peers[socket.id];
    io.emit('peer-disconnected', socket.id);
  });

  // Send the list of currently connected peers
  socket.emit('peers', Object.keys(peers).filter(id => id !== socket.id));
  // Notify others of the new peer
  socket.broadcast.emit('new-peer', socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}); 