'use strict';

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactLimiter } = require('../config/rateLimiter');

router.post('/', contactLimiter, contactController.submitInquiry.bind(contactController));

module.exports = router;
