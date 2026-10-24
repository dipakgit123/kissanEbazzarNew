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
    socket.data.expiresAt = decoded.exp ? decoded.exp * 1000 : null;

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
    if (!user || !user.is_verified || (user.is_blocked && (!user.blocked_until || new Date(user.blocked_until) > new Date()))) {
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
    const remaining = socket.data.expiresAt ? socket.data.expiresAt - Date.now() : null;
    const expiryTimer = remaining !== null ? setTimeout(() => socket.disconnect(true), Math.max(0, Math.min(remaining, 2147483647))) : null;
    expiryTimer?.unref?.();
    socket.use(async (_packet, next) => {
      const recipient = socket.recipient;
      try {
        const account = await (recipient.type === 'veterinarian' ? db.Veterinarian : db.User).findByPk(recipient.id);
        const allowed = account && (recipient.type === 'veterinarian'
          ? account.is_active && account.verification_status === 'verified'
          : account.is_verified && !(account.is_blocked && (!account.blocked_until || new Date(account.blocked_until) > new Date())));
        if (!allowed) return socket.disconnect(true);
        next();
      } catch { socket.disconnect(true); }
    });
    socket.on('register', registerSocket);

    socket.on('disconnect', () => {
      if (expiryTimer) clearTimeout(expiryTimer);
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
