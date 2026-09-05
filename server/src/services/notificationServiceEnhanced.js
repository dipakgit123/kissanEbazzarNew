// Backward-compatible entry point. The production delivery implementation now
// lives in one service so retries, receipts, preferences, and token cleanup do
// not drift between call sites.
module.exports = require('./notificationService');
