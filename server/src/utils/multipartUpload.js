'use strict';
const multer = require('multer');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const logger = require('./logger');

const MAX_FILES = 6;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_REQUEST_BYTES = 160 * 1024 * 1024;
// Bound temporary disk usage and concurrent S3 buffers for a single EC2 process.
const MAX_ACTIVE_UPLOADS = 2;
let activeUploads = 0;

function createMultipartUpload(fields, { maxFileSizeBytes = MAX_FILE_BYTES, fileFilter } = {}) {
  const fileCount = fields.reduce((sum, field) => sum + field.maxCount, 0);
  if (fileCount > MAX_FILES || !fileCount || maxFileSizeBytes > MAX_FILE_BYTES) throw new Error('Upload configuration exceeds the proxy upload budget');
  const parser = multer({
    storage: multer.diskStorage({
      destination: (req, _file, cb) => cb(null, req.uploadDirectory),
      filename: (_req, _file, cb) => cb(null, randomUUID())
    }),
    limits: { fileSize: maxFileSizeBytes, files: fileCount, fields: 100, fieldSize: 64 * 1024, parts: 100 + fileCount },
    fileFilter
  }).fields(fields);

  return async (req, res, next) => {
    if (Number(req.headers['content-length']) > MAX_REQUEST_BYTES) {
      return res.status(413).json({ success: false, code: 'UPLOAD_TOO_LARGE', message: 'Upload exceeds the 160 MB request limit.' });
    }
    if (activeUploads >= MAX_ACTIVE_UPLOADS) {
      res.set('Retry-After', '5');
      return res.status(429).json({ success: false, code: 'UPLOAD_BUSY', message: 'Other uploads are in progress. Please retry shortly.' });
    }
    activeUploads++;
    let directory, parsing = true, finished = false, cleaned = false;
    const abortController = new AbortController();
    const cleanup = async () => {
      if (parsing || !finished || cleaned) return;
      cleaned = true;
      try {
        // directory is created exclusively by mkdtemp below, never from user input.
        if (directory) await fs.rm(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch (error) { logger.error('Temporary upload cleanup failed', error); }
      finally { activeUploads--; }
    };
    const finish = () => {
      finished = true;
      if (!res.writableFinished) abortController.abort();
      void cleanup();
    };
    res.once('finish', finish);
    res.once('close', finish);
    req.once('aborted', finish);
    try {
      directory = await fs.mkdtemp(path.join(os.tmpdir(), 'animal-ebazar-upload-'));
      req.uploadDirectory = directory;
      if (finished || req.destroyed) { parsing = false; finished = true; await cleanup(); return; }
      parser(req, res, error => {
        parsing = false;
        if (error || finished) {
          finished = true;
          void cleanup().then(() => { if (error && !res.destroyed && !res.headersSent) next(error); });
          return;
        }
        for (const files of Object.values(req.files || {})) for (const file of files) file.abortController = abortController;
        next();
      });
    } catch (error) {
      parsing = false;
      finished = true;
      await cleanup();
      if (!res.destroyed && !res.headersSent) next(error);
    }
  };
}
module.exports = { createMultipartUpload, MAX_REQUEST_BYTES };
