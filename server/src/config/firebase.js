const admin = require('firebase-admin');
const logger = require('../utils/logger');

let firebaseApp = null;

const normalizePrivateKey = (value) => (
  value ? String(value).replace(/\\n/g, '\n') : value
);

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
};

const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  try {
    const serviceAccount = getServiceAccount();

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    } else {
      logger.warn('Firebase Admin is not configured. FCM notifications will be skipped.');
      return null;
    }

    logger.log('Firebase Admin initialized for FCM notifications');
    return firebaseApp;
  } catch (error) {
    logger.error('Firebase Admin initialization failed:', error.message);
    return null;
  }
};

const getMessaging = () => {
  const app = initializeFirebase();
  return app ? admin.messaging(app) : null;
};

module.exports = {
  getMessaging,
  initializeFirebase,
};
