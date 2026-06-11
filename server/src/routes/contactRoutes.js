'use strict';

const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

router.post('/', contactController.submitInquiry.bind(contactController));

module.exports = router;
