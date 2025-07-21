module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret',
  HEARTBEAT_INTERVAL: 30000, // ms
  PEER_TIMEOUT: 60000, // ms
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || 'adminsecret',
}; 