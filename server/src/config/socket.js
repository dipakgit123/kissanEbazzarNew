const connectedUsers = new Map();
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { getJwtSecret } = require('./jwt');

const getSocketKey = (recipient) => `${recipient.type}:${recipient.id}`;
const getSocketRoom = (recipient) => `recipient:${getSocketKey(recipient)}`;

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded.type === 'veterinarian') {
      const veterinarian = await db.Veterinarian.findByPk(decoded.id);
      if (!veterinarian || !veterinarian.is_active || veterinarian.verification_status !== 'verified') {
        return next(new Error('Veterinarian account is not allowed'));
      }

      socket.recipient = {
        id: veterinarian.id,
        type: 'veterinarian',
      };
      return next();
    }

    const userId = decoded.userId;
    if (!userId) {
      return next(new Error('Invalid user token'));
    }

    const user = await db.User.findByPk(userId);
    if (!user || !user.is_verified || user.is_blocked) {
      return next(new Error('User account is not allowed'));
    }

    socket.recipient = {
      id: user.id,
      type: 'user',
    };
    return next();
  } catch (error) {
    logger.error('Socket authentication error:', error.message);
    return next(new Error('Invalid token'));
  }
};

const setupSocketIO = (io) => {
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    logger.log('Socket.IO client connected:', socket.id);

    const registerSocket = () => {
      if (!socket.recipient) {
        return;
      }

      const socketKey = getSocketKey(socket.recipient);
      const socketIds = connectedUsers.get(socketKey) || new Set();
      socketIds.add(socket.id);
      connectedUsers.set(socketKey, socketIds);
      socket.join(getSocketRoom(socket.recipient));

      if (socket.recipient.type === 'user') {
        connectedUsers.set(String(socket.recipient.id), socketIds);
      }

      logger.log(`Socket registered for ${socketKey}`);
      logger.log(`Total connected sockets: ${connectedUsers.size}`);
    };

    registerSocket();
    socket.on('register', registerSocket);

    socket.on('disconnect', () => {
      for (const [recipientKey, socketIds] of connectedUsers.entries()) {
        if (socketIds instanceof Set) {
          socketIds.delete(socket.id);
          if (socketIds.size === 0) connectedUsers.delete(recipientKey);
        }
      }
      logger.log(`Socket.IO client disconnected: ${socket.id}`);
      logger.log(`Total connected sockets: ${connectedUsers.size}`);
    });
  });

  global.connectedUsers = connectedUsers;
  global.io = io;
};

module.exports = { setupSocketIO, connectedUsers };
