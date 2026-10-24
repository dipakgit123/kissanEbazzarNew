'use strict';
const { calendarDate } = require('./businessTime');
const difference = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);
const isOpen = record => ['pregnant', 'pending_confirmation'].includes(record.status);
function pregnancySummary(record, today = calendarDate()) {
  const data = record.toJSON ? record.toJSON() : { ...record };
  return {
    ...data,
    calculation_date: today,
    calculation_timezone: process.env.APP_TIMEZONE || process.env.NOTIFICATION_TIMEZONE || 'Asia/Kolkata',
    days_since_breeding: difference(today, data.mating_date),
    days_remaining: isOpen(data) ? difference(data.expected_delivery_date, today) : null,
    progress_percentage: isOpen(data) ? Math.round(Math.min(100, Math.max(0, difference(today, data.mating_date) / data.pregnancy_duration_days * 100))) : 100,
    confirmation_recorded: Boolean(data.confirmed_on),
    delivery_estimate_provisional: !data.confirmed_on,
  };
}
module.exports = { pregnancySummary, difference, isOpen };
