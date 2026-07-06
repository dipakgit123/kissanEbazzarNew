const { logErrorFromRequest } = require('../utils/systemErrorLogger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    logErrorFromRequest(err, req, { statusCode: 400, severity: 'warning' });
    return res.status(400).json({
      success: false,
      message: 'File size limit exceeded'
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    logErrorFromRequest(err, req, { statusCode: 400, severity: 'warning' });
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  logErrorFromRequest(err, req, { statusCode: 500, severity: 'error' });

  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
};

module.exports = { errorHandler, notFoundHandler };
