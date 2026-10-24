'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();

const trackUpload = (cleanup) => {
  const context = storage.getStore();
  if (!context) return;
  if (context.finished && !context.success) {
    Promise.resolve().then(cleanup).catch(error => console.error('Media cleanup failed:', error.message));
  } else if (!context.finished) context.uploads.push(cleanup);
};
const deferDeletion = (remove) => {
  const context = storage.getStore();
  if (!context) return false;
  context.deletions.push(remove);
  return true;
};
const mediaLifecycle = (_req, res, next) => {
  const context = { uploads: [], deletions: [], finished: false };
  const finish = async (success) => {
    if (context.finished) return;
    context.finished = true;
    context.success = success;
    // Keep old objects until persistence succeeds; clean up new objects after failure.
    const operations = success ? context.deletions : context.uploads;
    const results = await Promise.allSettled(operations.map(operation => operation()));
    for (const result of results) {
      if (result.status === 'rejected') console.error('Media cleanup failed:', result.reason?.message);
    }
  };
  res.once('finish', () => finish(res.statusCode >= 200 && res.statusCode < 300));
  res.once('close', () => { if (!res.writableFinished) finish(false); });
  storage.run(context, next);
};
module.exports = { mediaLifecycle, trackUpload, deferDeletion };
