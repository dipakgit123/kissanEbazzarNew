'use strict';

const express = require('express');
const router = express.Router();
const petMatingController = require('../controllers/petMatingController');
const authMiddleware = require('../middlewares/authMiddleware');
const { createUploadFields } = require('../config/cloudinary');
const { uploadLimiter } = require('../config/rateLimiter');

const optionalUserAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return authMiddleware(req, res, next);
};

const petMatingUploadFields = createUploadFields([
  { name: 'photos', maxCount: 5 },
  { name: 'video', maxCount: 1 }
], {
  maxFileSizeBytes: 25 * 1024 * 1024,
  fieldTypeMap: {
    photos: ['image'],
    video: ['video']
  }
});

router.get('/', optionalUserAuth, petMatingController.getProfiles.bind(petMatingController));
router.get('/my-profiles', authMiddleware, petMatingController.getMyProfiles.bind(petMatingController));
router.get('/:id', petMatingController.getProfileById.bind(petMatingController));
router.post(
  '/',
  authMiddleware,
  uploadLimiter,
  petMatingUploadFields,
  petMatingController.createProfile.bind(petMatingController)
);
router.put(
  '/:id',
  authMiddleware,
  uploadLimiter,
  petMatingUploadFields,
  petMatingController.updateProfile.bind(petMatingController)
);
router.patch('/:id/matched', authMiddleware, petMatingController.markMatched.bind(petMatingController));
router.delete('/:id', authMiddleware, petMatingController.deleteProfile.bind(petMatingController));
router.post('/:id/contact', authMiddleware, petMatingController.trackContact.bind(petMatingController));
router.post('/:id/report', authMiddleware, petMatingController.reportProfile.bind(petMatingController));

module.exports = router;
