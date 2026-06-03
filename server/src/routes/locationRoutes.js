// src/routes/locationRoutes.js
const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middlewares/authMiddleware');

// Define validators directly in this file since they're missing
const validateCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ success: false, message: 'Invalid coordinates' });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return res.status(400).json({ success: false, message: 'Coordinates out of range' });
  }
  
  req.body.latitude = lat;
  req.body.longitude = lon;
  next();
};

const validateAddress = (req, res, next) => {
  const { city, country } = req.body;
  if (!city || !country) {
    return res.status(400).json({ 
      success: false, 
      message: 'City and country are required' 
    });
  }
  next();
};

// Rest of your routes...
router.use(authMiddleware);
router.post('/set/current', validateCoordinates, locationController.setLocationFromCurrent);

// POST /api/location/set/manual - Set location from address (one-time)
router.post('/set/manual', validateAddress || ((req, res, next) => next()), locationController.setLocationFromManual);

// PUT /api/location/update - Update existing location
router.put('/update', (req, res, next) => {
  // Dynamic validation based on update type
  if (req.body.type === 'current') {
    if (validateCoordinates) {
      return validateCoordinates(req, res, next);
    }
  } else if (req.body.type === 'manual') {
    if (validateAddress) {
      return validateAddress(req, res, next);
    }
  }
  next();
}, locationController.updateLocation);

// GET /api/location/me - Get current user's location
router.get('/me', locationController.getUserLocation);

// GET /api/location/status - Check if location is set
router.get('/status', locationController.checkLocationStatus);

// GET /api/location/lookup/pincode/:postalCode - Lookup pincode details
router.get('/lookup/pincode/:postalCode', locationController.lookupPostalCode);

// GET /api/location/nearby - Get nearby users within radius
router.get('/nearby', locationController.getNearbyUsers);

module.exports = router;
