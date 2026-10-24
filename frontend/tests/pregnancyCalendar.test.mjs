import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKey, addDays, dayNumber, moveMonth, daysRemaining, daysSinceBreeding, businessToday, recordOnDate, pregnancyProgress, calendarDayRecords, recordsInMonth } from '../src/utils/pregnancyCalendar.js';

test('confirmation never resets the breeding clock, and server summaries advance daily', () => {
  const record = { status: 'pregnant', mating_date: '2026-07-21', expected_delivery_date: '2027-04-27', pregnancy_duration_days: 280, confirmed_on: '2026-10-21', days_since_breeding: 92, days_remaining: 188, calculation_date: '2026-10-21' };
  assert.equal(daysRemaining(record, '2026-10-21'), 188);
  assert.equal(daysRemaining(record, '2026-10-22'), 187);
  assert.equal(daysSinceBreeding(record, '2026-10-22'), 93);
  assert.equal(businessToday('Asia/Kolkata', new Date('2026-10-21T19:00:00Z')), '2026-10-22');
});

test('pending animals appear on breeding and examination dates without being counted as confirmed or due', () => {
  const pending = { id: 1, status: 'pending_confirmation', mating_date: '2026-07-21', next_check_date: '2026-10-21', expected_delivery_date: '2027-04-27' };
  const confirmed = { id: 2, status: 'pregnant', confirmed_on: '2026-08-21', mating_date: '2026-07-21', expected_delivery_date: '2027-04-27' };
  const day = calendarDayRecords([pending, confirmed], '2026-10-21', '2026-10-21');
  assert.deepEqual(day.pending.map(record => record.id), [1]);
  assert.deepEqual(day.active.map(record => record.id), [2]);
  assert.equal(day.due.length, 0);
  assert.equal(recordsInMonth([pending], new Date(2026, 9, 1)).length, 1);
  assert.equal(recordOnDate(pending, '2027-04-27'), false);
  const legacy = { ...confirmed, id: 3, confirmed_on: null, confirmation_source: 'legacy_unrecorded' };
  assert.equal(calendarDayRecords([legacy], '2026-10-21').active.length, 1);
  assert.equal(calendarDayRecords([legacy], '2027-04-27').due.length, 1);
  assert.equal(legacy.confirmed_on, null, 'Showing the record must not invent a doctor confirmation');
});

test('four legacy pregnancies retain overlapping highlights, due dates and overdue periods', () => {
  const records = [-1, 0, 7, 31].map((offset, index) => ({ id: index + 1, status: 'pregnant', confirmed_on: null, mating_date: '2026-01-01', expected_delivery_date: new Date(Date.UTC(2026, 9, 21 + offset)).toISOString().slice(0, 10) }));
  assert.equal(calendarDayRecords(records, '2026-10-21', '2026-10-21').active.length, 4);
  assert.equal(calendarDayRecords(records, '2026-10-21', '2026-10-21').due.length, 1);
  assert.equal(records.filter(record => daysRemaining(record, '2026-10-21') < 0).length, 1);
  assert.equal(records.filter(record => daysRemaining(record, '2026-10-21') >= 0 && daysRemaining(record, '2026-10-21') <= 30).length, 2);
  assert.equal(recordsInMonth(records, new Date(2026, 9, 1), '2026-10-21').length, 4);
});

test('month navigation starts at day one, including leap years and year boundaries', () => {
  assert.equal(dateKey(moveMonth(new Date(2026, 0, 31), 1)), '2026-02-01');
  assert.equal(dateKey(moveMonth(new Date(2024, 2, 31), -1)), '2024-02-01');
  assert.equal(dateKey(moveMonth(new Date(2026, 11, 31), 1)), '2027-01-01');
});
test('date-only calculations reject impossible dates and survive DST boundaries', () => {
  assert.ok(Number.isNaN(dayNumber('2026-02-30')));
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2026-03-07', 3), '2026-03-10');
  assert.equal(addDays('2026-10-31', 2), '2026-11-02');
  assert.equal(addDays('2026-01-01', 0), '');
  assert.equal(addDays('2026-01-01', 1.5), '');
});
test('due dates distinguish today and overdue and progress is bounded', () => {
  const record = { status: 'pregnant', confirmed_on: '2026-01-01', mating_date: '2026-01-01', expected_delivery_date: '2026-10-08', pregnancy_duration_days: 280 };
  assert.equal(daysRemaining(record, '2026-10-08'), 0);
  assert.equal(daysRemaining(record, '2026-10-09'), -1);
  assert.equal(pregnancyProgress(record, '2025-12-31'), 0);
  assert.equal(pregnancyProgress(record, '2027-01-01'), 100);
  assert.equal(recordOnDate(record, '2026-01-01', '2026-10-09'), true);
  assert.equal(recordOnDate(record, '2026-10-09', '2026-10-09'), true);
  assert.equal(recordOnDate(record, '2025-12-31', '2026-10-09'), false);
});
test('delivered records use actual delivery date, not the pregnancy interval', () => {
  const record = { status: 'delivered', mating_date: '2026-01-01', expected_delivery_date: '2026-10-08', actual_delivery_date: '2026-10-07' };
  assert.equal(recordOnDate(record, '2026-10-07'), true);
  assert.equal(recordOnDate(record, '2026-10-08'), false);
});

test('overlapping animals retain separate periods and shared due dates', () => {
  const records = [
    { id: 1, status: 'pregnant', confirmed_on: '2026-01-01', mating_date: '2026-01-01', expected_delivery_date: '2026-10-25' },
    { id: 2, status: 'pregnant', confirmed_on: '2026-01-01', mating_date: '2026-09-01', expected_delivery_date: '2026-10-25' },
    { id: 3, status: 'delivered', mating_date: '2026-08-01', actual_delivery_date: '2026-10-25' },
    { id: 4, status: 'cancelled', mating_date: '2026-08-01', expected_delivery_date: '2026-10-25' },
  ];
  const day = calendarDayRecords(records, '2026-10-25', '2026-10-21');
  assert.deepEqual(day.active.map(record => record.id), [1, 2]);
  assert.deepEqual(day.due.map(record => record.id), [1, 2]);
  assert.deepEqual(day.delivered.map(record => record.id), [3]);
  assert.equal(calendarDayRecords(records, '2026-10-26', '2026-10-21').active.length, 0);
  assert.equal(calendarDayRecords(records, '2026-08-31', '2026-10-21').active.length, 1);
  assert.deepEqual(recordsInMonth(records, new Date(2026, 9, 1), '2026-10-21').map(record => record.id), [1, 2, 3]);
  assert.equal(recordsInMonth(records, new Date(2026, 10, 1), '2026-10-21').length, 0);
});

test('overdue pregnancies remain highlighted through today across month boundaries', () => {
  const records = [{ id: 1, status: 'pregnant', confirmed_on: '2026-01-01', mating_date: '2026-01-01', expected_delivery_date: '2026-09-30' }];
  assert.equal(recordsInMonth(records, new Date(2026, 9, 1), '2026-10-21').length, 1);
  assert.equal(calendarDayRecords(records, '2026-10-21', '2026-10-21').active.length, 1);
  assert.equal(calendarDayRecords(records, '2026-10-22', '2026-10-21').active.length, 0);
});
