const { randomId, logEvent } = require('./utils');
const config = require('./config');

class PeerManager {
  constructor() {
    this.peers = {};
  }

  addPeer(socket, meta = {}) {
    const id = socket.id;
    this.peers[id] = {
      id,
      socket,
      username: meta.username || `Peer_${randomId(4)}`,
      avatar: meta.avatar || null,
      files: meta.files || [],
      lastSeen: Date.now(),
      online: true,
    };
    logEvent('peer_connected', { id, username: this.peers[id].username });
    return this.peers[id];
  }

  removePeer(id) {
    if (this.peers[id]) {
      logEvent('peer_disconnected', { id, username: this.peers[id].username });
      delete this.peers[id];
    }
  }

  updatePeer(id, meta) {
    if (this.peers[id]) {
      Object.assign(this.peers[id], meta, { lastSeen: Date.now() });
    }
  }

  heartbeat(id) {
    if (this.peers[id]) {
      this.peers[id].lastSeen = Date.now();
      this.peers[id].online = true;
    }
  }

  getPeer(id) {
    return this.peers[id];
  }

  getAllPeers() {
    return Object.values(this.peers);
  }

  getOnlinePeers() {
    return Object.values(this.peers).filter(p => p.online);
  }

  checkTimeouts() {
    const now = Date.now();
    for (const id in this.peers) {
      if (now - this.peers[id].lastSeen > config.PEER_TIMEOUT) {
        this.peers[id].online = false;
      }
    }
  }
}

module.exports = new PeerManager(); 