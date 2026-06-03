const connectedUsers = new Map(); // userId -> socketId mapping
const logger = require('../utils/logger');

const setupSocketIO = (io) => {
  io.on('connection', (socket) => {
    logger.log('👤 User connected:', socket.id);

    // User authentication and registration
    socket.on('register', (userId) => {
      connectedUsers.set(userId.toString(), socket.id);
      logger.log(`✅ User ${userId} registered with socket ${socket.id}`);
      logger.log(`👥 Total connected users: ${connectedUsers.size}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      // Remove user from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          logger.log(`❌ User ${userId} disconnected`);
          break;
        }
      }
      logger.log(`👥 Total connected users: ${connectedUsers.size}`);
    });
  });

  // Make connectedUsers accessible globally
  global.connectedUsers = connectedUsers;
  global.io = io;
};

module.exports = { setupSocketIO, connectedUsers };
