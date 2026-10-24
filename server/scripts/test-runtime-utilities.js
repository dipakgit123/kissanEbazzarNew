'use strict';
// No database or network required.
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { calendarDate, appointmentInstant, addCalendarDays } = require('../src/utils/businessTime');
const { mediaLifecycle, trackUpload, deferDeletion } = require('../src/utils/mediaLifecycle');
async function run() {
  assert.equal(calendarDate(new Date('2026-10-20T20:00:00Z'), 'Asia/Kolkata'), '2026-10-21');
  assert.equal(appointmentInstant('2026-10-21', '09:00:00', 'Asia/Kolkata').toISOString(), '2026-10-21T03:30:00.000Z');
  assert.equal(addCalendarDays('2026-12-31', 1), '2027-01-01');
  for (const status of [200, 500]) {
    const response = new EventEmitter();
    response.statusCode = status;
    const removed = [];
    let late;
    mediaLifecycle({}, response, () => {
      trackUpload(async () => removed.push('new'));
      deferDeletion(async () => removed.push('old'));
      late = new Promise(resolve => setTimeout(() => { trackUpload(async () => removed.push('late')); resolve(); }, 5));
      response.emit('finish');
    });
    await late;
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.deepEqual(removed.sort(), status === 200 ? ['old'] : ['late', 'new']);
  }
  console.log('Runtime utility regression tests passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
