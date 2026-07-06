'use strict';

const express = require('express');
const router = express.Router();
const governmentSchemeController = require('../controllers/governmentSchemeController');

router.get('/', governmentSchemeController.getSchemes.bind(governmentSchemeController));
router.get('/featured', governmentSchemeController.getFeaturedSchemes.bind(governmentSchemeController));
router.get('/:slug', governmentSchemeController.getSchemeBySlug.bind(governmentSchemeController));

module.exports = router;
