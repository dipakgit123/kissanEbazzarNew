// src/middlewares/validationMiddleware.js

/**
 * Validate phone number in E.164 format
 */
const validatePhone = (req, res, next) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  // E.164 format validation: starts with + followed by 1-15 digits
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
    });
  }

  next();
};

/**
 * Validate OTP format
 */
const getExpectedOtpLength = () => {
  const provider = (process.env.OTP_PROVIDER || 'twilio-sms').toLowerCase();

  if (provider === 'messagecentral') {
    return parseInt(process.env.MESSAGE_CENTRAL_OTP_LENGTH, 10) || 4;
  }

  if (provider === 'messagecentral-sms') {
    return parseInt(process.env.MESSAGE_CENTRAL_SMS_OTP_LENGTH, 10)
      || parseInt(process.env.OTP_LENGTH, 10)
      || 4;
  }

  return parseInt(process.env.OTP_LENGTH, 10) || 6;
};

const validateOTP = (req, res, next) => {
  const { phoneNumber, otp } = req.body;

  // Validate phone number
  if (!phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Phone number is required'
    });
  }

  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)'
    });
  }

  // Validate OTP
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'OTP is required'
    });
  }

  // Check if OTP is a string of digits
  if (!/^\d+$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must contain only digits'
    });
  }

  // Check OTP length (default is 6 digits)
  const otpLength = getExpectedOtpLength();
  
  if (otp.length !== otpLength) {
    return res.status(400).json({
      success: false,
      message: `OTP must be exactly ${otpLength} digits`
    });
  }

  next();
};

/**
 * Validate location coordinates
 */
const validateCoordinates = (req, res, next) => {
  const { latitude, longitude } = req.body;

  if (latitude === undefined || latitude === null) {
    return res.status(400).json({
      success: false,
      message: 'Latitude is required'
    });
  }

  if (longitude === undefined || longitude === null) {
    return res.status(400).json({
      success: false,
      message: 'Longitude is required'
    });
  }

  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude must be valid numbers'
    });
  }

  if (lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: 'Latitude must be between -90 and 90'
    });
  }

  if (lon < -180 || lon > 180) {
    return res.status(400).json({
      success: false,
      message: 'Longitude must be between -180 and 180'
    });
  }

  // Convert to numbers for consistency
  req.body.latitude = lat;
  req.body.longitude = lon;

  next();
};

/**
 * Validate manual address input
 */
const validateAddress = (req, res, next) => {
  const { city, country } = req.body;

  if (!city || city.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'City is required'
    });
  }

  if (!country || country.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Country is required'
    });
  }

  if (city.length < 2 || city.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'City name must be between 2 and 100 characters'
    });
  }

  if (country.length < 2 || country.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Country name must be between 2 and 100 characters'
    });
  }

  // Validate postal code if provided
  if (req.body.postal_code) {
    const postalCode = req.body.postal_code.trim();
    
    if (postalCode.length > 0) {
      if (!/^[A-Za-z0-9\s-]{3,10}$/.test(postalCode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid postal code format'
        });
      }
    }
  }

  // Trim all fields
  req.body.city = city.trim();
  req.body.country = country.trim();
  if (req.body.state) req.body.state = req.body.state.trim();
  if (req.body.address) req.body.address = req.body.address.trim();
  if (req.body.postal_code) req.body.postal_code = req.body.postal_code.trim();

  next();
};

module.exports = {
  validatePhone,
  validateOTP,
  validateCoordinates,
  validateAddress
};
