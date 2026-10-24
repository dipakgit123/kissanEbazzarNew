'use strict';
// Integration test: use only a disposable, migrated local PostgreSQL database.
// Run with the audit isolation preload, or explicitly supply OTP_TEST_DATABASE_URL.
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const url = new URL(process.env.OTP_TEST_DATABASE_URL || 'postgres://invalid');
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/audit|test/i.test(url.pathname)) {
  throw new Error('OTP_TEST_DATABASE_URL must name an isolated local audit/test database');
}
process.env.DATABASE_URL = url.toString();
process.env.NODE_ENV = 'test';
process.env.OTP_PROVIDER = 'twilio-sms';
process.env.OTP_EXPOSE_IN_RESPONSE = 'false';
process.env.TWILIO_ACCOUNT_SID = 'AC00000000000000000000000000000000';
process.env.TWILIO_AUTH_TOKEN = 'local-test-only';
const db = require('../src/models');
const monitor = require('../src/utils/twilioMonitor');
monitor.checkBalanceSufficient = async () => ({ sufficient: true });
const delivery = require('../src/services/twilioService');
const sent = [];
let failDelivery = false;
delivery.sendSMSOTP = async (phone, code) => {
  if (failDelivery) throw new Error('Simulated SMS provider rejection');
  sent.push({ phone, code });
  return { success: true, messageSid: 'audit-' + randomUUID(), status: 'queued', channel: 'sms' };
};
const otp = require('../src/services/otpService');
const { resetPhoneNumberLimit } = require('../src/utils/rateLimiter');
const users = [], results = [];
const phone = () => '+919' + String(require('node:crypto').randomInt(100000000, 999999999));
const create = async verified => {
  const user = await db.User.create({ phone_number: phone(), is_verified: verified, last_otp_sent_at: new Date(Date.now() - 61000) });
  users.push(user);
  return user;
};
async function check(name, fn) {
  try { await fn(); results.push({ name, result: 'PASS' }); console.log('PASS ' + name); }
  catch (error) { results.push({ name, result: 'FAIL', error: error.message }); console.error('FAIL ' + name + ': ' + error.message); }
}
async function run() {
  try {
    await check('verified returning user can send, resend and complete OTP login', async () => {
      const user = await create(true);
      assert.equal((await otp.sendOTP(user.phone_number)).success, true);
      const originalHash = (await user.reload()).otp;
      await user.update({ last_otp_sent_at: new Date(Date.now() - 61000) });
      const result = await otp.resendOTP(user.phone_number);
      assert.equal(result.success, true);
      assert.equal(result.debugOtp, undefined);
      assert.notEqual((await user.reload()).otp, originalHash);
      assert.equal(user.is_verified, true);
      assert.equal((await otp.verifyOTP(user.phone_number, sent.at(-1).code)).success, true);
      assert.equal((await user.reload()).otp, null);
    });
    await check('unverified signup can resend OTP', async () => {
      const user = await create(false);
      assert.equal((await otp.resendOTP(user.phone_number)).success, true);
      assert.equal((await user.reload()).is_verified, false);
    });
    await check('verified account resend still enforces the one-minute cooldown', async () => {
      const user = await create(true);
      await otp.sendOTP(user.phone_number);
      const count = sent.length;
      await assert.rejects(otp.resendOTP(user.phone_number), /wait 1 minute/);
      assert.equal(sent.length, count);
    });
    await check('verified blocked account cannot resend or remove its block', async () => {
      const user = await create(true);
      await user.update({ is_blocked: true, blocked_until: null });
      const count = sent.length;
      await assert.rejects(otp.resendOTP(user.phone_number), /blocked/);
      assert.equal(sent.length, count);
      assert.equal((await user.reload()).is_blocked, true);
    });
    await check('failed SMS resend propagates error and preserves the earlier challenge', async () => {
      const user = await create(true);
      await otp.sendOTP(user.phone_number);
      await user.reload();
      const previous = user.otp;
      await user.update({ last_otp_sent_at: new Date(Date.now() - 61000) });
      failDelivery = true;
      try { await assert.rejects(otp.resendOTP(user.phone_number), /Simulated SMS provider rejection/); }
      finally { failDelivery = false; }
      assert.equal((await user.reload()).otp, previous);
    });
    await check('resend retains daily phone request limits', async () => {
      const user = await create(true);
      for (let i = 0; i < 5; i++) {
        await user.update({ last_otp_sent_at: new Date(Date.now() - 61000) });
        assert.equal((await otp.resendOTP(user.phone_number)).success, true);
      }
      await assert.rejects(otp.resendOTP(user.phone_number), /Daily OTP limit/);
    });
    await check('unknown account must request its first OTP before resending', async () => {
      await assert.rejects(otp.resendOTP(phone()), /request OTP first/);
    });
    console.log(JSON.stringify({ checks: results.length, passed: results.filter(r => r.result === 'PASS').length, results }));
  } finally {
    for (const user of users) {
      await db.OtpLog.destroy({ where: { user_id: user.id } });
      await user.destroy();
      resetPhoneNumberLimit(user.phone_number);
    }
    await db.sequelize.close();
  }
  process.exit(results.some(r => r.result !== 'PASS') ? 1 : 0);
}
run().catch(error => { console.error(error.message); process.exit(1); });
