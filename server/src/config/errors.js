const { logErrorFromRequest } = require('../utils/systemErrorLogger');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Handle Multer errors
  if (['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_FIELD_COUNT', 'LIMIT_FIELD_VALUE', 'LIMIT_PART_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(err.code)) {
    const status = err.code === 'LIMIT_UNEXPECTED_FILE' ? 400 : 413;
    logErrorFromRequest(err, req, { statusCode: status, severity: 'warning' });
    return res.status(status).json({
      success: false,
      code: err.code,
      message: err.code === 'LIMIT_FILE_SIZE' ? 'File size limit exceeded' : 'Upload contains too many files, unexpected files or oversized fields'
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
