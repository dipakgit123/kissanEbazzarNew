'use strict';
// Isolated checks: loopback HTTP only; no dotenv, database, SMTP, AI or AWS requests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');
const { once } = require('node:events');
const express = require('express');
const { createMultipartUpload } = require('../src/utils/multipartUpload');
const root = path.resolve(__dirname, '..');
function load(file, deps, extra = {}) {
  const box = { module: { exports: {} }, require: id => { if (!(id in deps)) throw Error('Unmocked import: ' + id); return deps[id]; }, process: { env: { NODE_ENV: 'production' } }, console, Buffer, ...extra };
  vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), box);
  return box.module.exports;
}
async function until(check) {
  for (let n = 0; n < 200; n++) { if (await check()) return; await new Promise(r => setTimeout(r, 10)); }
  assert.fail('Timed out waiting for cleanup');
}

test('production AI codes survive but internal messages and unknown codes do not', () => {
  const noop = () => {}, middleware = [];
  const app = load('src/config/app.js', { '../utils/mediaLifecycle': { mediaLifecycle: noop }, express: { json: () => noop, urlencoded: () => noop }, cors: () => noop, helmet: () => noop, morgan: () => noop, './rateLimiter': { generalLimiter: noop }, dotenv: { config: noop } });
  app.setupMiddleware({ set: noop, use: (...args) => middleware.push(args.at(-1)) });
  for (const [code, status] of [['AI_UNAVAILABLE',503], ['AI_NOT_CONFIGURED',503], ['AI_INVALID_RESPONSE',502], ['MILK_ADVICE_ERROR',500], ['DATABASE_PASSWORD',500]]) {
    const res = { statusCode: status, locals: {}, json: value => value };
    for (const handler of middleware) if (handler.toString().includes('healthPublicError')) handler({}, res, noop);
    const result = res.json({ code, message: 'provider-secret', debug: 'secret' });
    assert.equal(result.code, code === 'DATABASE_PASSWORD' ? undefined : code);
    assert.ok(!JSON.stringify(result).includes('secret'));
  }
});

test('production logging records failures and redacts credentials', () => {
  const events = [];
  const logger = load('src/utils/logger.js', {}, { Error, console: Object.fromEntries(['log','debug','info','warn','error'].map(level => [level, (...args) => events.push([level, args])])) });
  logger.error('OTP delivery failed', { authorization: 'Bearer secret-key', password: 'secret-pass', nested: { api_key: 'secret-api' } });
  logger.warn(new Error('request failed token=secret-token'));
  logger.error(new Error('provider unavailable'));
  logger.debug('do not print this');
  assert.equal(events.length, 3);
  assert.ok(JSON.stringify(events).includes('provider unavailable'));
  assert.ok(!JSON.stringify(events).includes('secret-'));
});

test('updated bcrypt, UUID/Sequelize and Nodemailer retain required behaviour', async () => {
  const bcrypt = require('bcrypt'), bcryptjs = require('bcryptjs');
  const password = 'test-password-\u0928\u092e\u0938\u094d\u0924\u0947';
  const oldHash = await bcryptjs.hash(password, 4);
  assert.equal(await bcrypt.compare(password, oldHash), true);
  assert.equal(await bcrypt.compare('wrong', oldHash), false);
  assert.equal(await bcryptjs.compare(password, await bcrypt.hash(password, 4)), true);
  const { Sequelize, DataTypes } = require('sequelize');
  const db = new Sequelize('postgres://unused:unused@127.0.0.1/unused', { logging: false });
  const Model = db.define('Fixture', { id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true } });
  assert.match(Model.build().id, /^[a-f0-9-]{36}$/);
  await db.close();
  const mail = require('nodemailer').createTransport({ streamTransport: true, buffer: true });
  const message = await mail.sendMail({ from: 'sender@example.invalid', to: 'receiver@example.invalid', subject: 'Registration', text: 'Local test', html: '<p>Local test</p>' });
  assert.ok(message.message.toString().includes('Registration'));
});

test('S3 adapter streams disk uploads with bounded buffers and preserves buffer uploads', async () => {
  const options = [], sizes = [];
  const storage = load('src/config/cloudinary.js', {
    '../utils/mediaLifecycle': { trackUpload: () => {}, deferDeletion: () => false },
    '@aws-sdk/client-s3': { S3Client: class {}, DeleteObjectCommand: class {}, GetObjectCommand: class {} },
    '@aws-sdk/lib-storage': { Upload: class {
      constructor(config) { options.push(config); this.config = config; }
      async done() {
        const body = this.config.params.Body;
        if (Buffer.isBuffer(body)) sizes.push(body.length);
        else { let size = 0; for await (const chunk of body) size += chunk.length; sizes.push(size); }
        return { ETag: 'fixture' };
      }
    } },
    '../utils/multipartUpload': { createMultipartUpload: () => () => {} },
    'node:fs': fs, 'node:crypto': require('node:crypto'), path
  }, { process: { env: { AWS_REGION: 'test', AWS_S3_BUCKET: 'fixture-bucket' } }, console: { log() {}, warn() {}, error() {} } });
  const fixture = path.join(__dirname, 'test-production-hardening.cjs');
  await storage.uploadToStorage({ path: fixture, originalname: 'fixture.jpg', mimetype: 'image/jpeg', abortController: new AbortController() }, 'image');
  await storage.uploadToStorage({ buffer: Buffer.from('fixture'), originalname: 'fixture.jpg', mimetype: 'image/jpeg' }, 'image');
  assert.equal(sizes[0], fs.statSync(fixture).size);
  assert.equal(sizes[1], 7);
  assert.equal(options[0].queueSize, 1);
  assert.equal(options[0].partSize, 5 * 1024 * 1024);
  assert.ok(options[0].params.Body.destroyed);
});

test('large multipart uploads stream from disk, enforce limits and clean up on all exits', async t => {
  const app = express(), requests = [], held = [];
  app.use((req, _res, next) => { requests.push(req); next(); });
  const fields = [{ name: 'photos', maxCount: 5 }, { name: 'video', maxCount: 1 }];
  const upload = createMultipartUpload(fields);
  app.post('/upload', upload, async (req, res) => {
    const files = Object.values(req.files || {}).flat();
    assert.ok(files.every(f => !f.buffer && f.path));
    let bytes = 0;
    for (const file of files) for await (const chunk of fs.createReadStream(file.path)) bytes += chunk.length;
    res.json({ bytes, count: files.length });
  });
  app.post('/fail', upload, (_req, res) => res.status(400).json({ success: false }));
  app.post('/hold', upload, (_req, res) => held.push(res));
  app.use((err, _req, res, _next) => res.status(413).json({ code: err.code }));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { held.forEach(res => res.end()); server.closeAllConnections(); await new Promise(r => server.close(r)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const form = (size, count = 1) => { const f = new FormData(); for (let i = 0; i < count; i++) f.append('photos', new Blob([Buffer.alloc(size)]), `photo${i}.jpg`); return f; };
  let response = await fetch(base + '/upload', { method: 'POST', body: form(20 * 1024 * 1024, 2) });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).bytes, 40 * 1024 * 1024);
  await until(() => !fs.existsSync(requests.at(-1).uploadDirectory));
  const sixFiles = form(1, 5);
  sixFiles.append('video', new Blob([Buffer.from('video')]), 'clip.mp4');
  response = await fetch(base + '/upload', { method: 'POST', body: sixFiles });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 6);
  await until(() => !fs.existsSync(requests.at(-1).uploadDirectory));
  response = await fetch(base + '/upload', { method: 'POST', body: form(25 * 1024 * 1024 + 1) });
  assert.equal(response.status, 413);
  assert.equal((await response.json()).code, 'LIMIT_FILE_SIZE');
  response = await fetch(base + '/upload', { method: 'POST', body: form(1, 6) });
  assert.equal(response.status, 413);
  response = await fetch(base + '/fail', { method: 'POST', body: form(100) });
  assert.equal(response.status, 400);
  await until(() => !fs.existsSync(requests.at(-1).uploadDirectory));
  const pending = [fetch(base + '/hold', { method: 'POST', body: form(100) }), fetch(base + '/hold', { method: 'POST', body: form(100) })];
  await until(() => held.length === 2);
  response = await fetch(base + '/upload', { method: 'POST', body: form(1) });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '5');
  held.forEach(res => res.end());
  await Promise.all(pending);
  await until(() => requests.filter(r => r.uploadDirectory).every(r => !fs.existsSync(r.uploadDirectory)));
  const abortReq = http.request(base + '/upload', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=abort-test' } });
  abortReq.on('error', () => {});
  abortReq.write('--abort-test\r\nContent-Disposition: form-data; name="photos"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\npartial');
  await until(() => requests.at(-1).uploadDirectory && fs.existsSync(requests.at(-1).uploadDirectory));
  const abandoned = requests.at(-1);
  abortReq.destroy();
  await until(() => !fs.existsSync(abandoned.uploadDirectory));
  // A cancelled upload must release its concurrency slot.
  response = await fetch(base + '/upload', { method: 'POST', body: form(1) });
  assert.equal(response.status, 200);
  await until(() => !fs.existsSync(requests.at(-1).uploadDirectory));
  for (const config of ['nginx.conf', 'nginx.ssl.example.conf']) assert.match(await fsp.readFile(path.join(root, config), 'utf8'), /client_max_body_size 160m;/);
});
