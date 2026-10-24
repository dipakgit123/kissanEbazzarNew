'use strict';
const { calendarDate } = require('./businessTime');

const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const stamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value;
};

function validateRecord(data, { partial = false, type = data.animal_type, today = calendarDate() } = {}) {
  if ((!partial || data.animal_name !== undefined) && (typeof data.animal_name !== 'string' || !data.animal_name.trim() || data.animal_name.trim().length > 100)) return 'Animal name must contain 1 to 100 characters.';
  if ((!partial || data.mating_date !== undefined) && (!validDate(data.mating_date) || data.mating_date > today)) return 'Mating date must be a valid date no later than today.';
  if (type === 'other' && (!partial || data.pregnancy_duration_days !== undefined)) {
    const days = Number(data.pregnancy_duration_days);
    if (!Number.isInteger(days) || days < 1 || days > 1000) return 'Pregnancy duration must be a whole number from 1 to 1000 days.';
  }
  for (const [field, limit] of [['ear_badge_number', 100], ['notes', 5000]]) {
    if (data[field] != null && (typeof data[field] !== 'string' || data[field].length > limit)) return `${field} must be text of at most ${limit} characters.`;
  }
  if (data.mating_type !== undefined && !['natural', 'artificial_insemination'].includes(data.mating_type)) return 'Choose natural mating or artificial insemination.';
  if (data.reminder_enabled !== undefined && typeof data.reminder_enabled !== 'boolean') return 'Reminder setting must be true or false.';
  return null;
}

function validateDelivery(data, matingDate, today = calendarDate()) {
  if (!validDate(data.delivery_date) || data.delivery_date < matingDate || data.delivery_date > today) return 'Delivery date must be between the mating date and today.';
  const count = Number(data.offspring_count);
  if (!Number.isInteger(count) || count < 1 || count > 100) return 'Offspring count must be a whole number from 1 to 100.';
  if (data.offspring_gender != null && !['male', 'female', 'mixed'].includes(data.offspring_gender)) return 'Invalid offspring gender.';
  if (data.offspring_details != null && (typeof data.offspring_details !== 'string' || data.offspring_details.length > 5000)) return 'Offspring details must be text of at most 5000 characters.';
  return null;
}

function validateCheckup(data, matingDate, today = calendarDate()) {
  if (!validDate(data.checked_on) || data.checked_on < matingDate || data.checked_on > today) return 'Examination date must be between the breeding date and today.';
  if (!['pregnant', 'not_pregnant', 'recheck'].includes(data.result)) return 'Choose the doctor’s result.';
  if (typeof data.request_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.request_id)) return 'A valid request ID is required.';
  if (data.estimated_age_value != null && data.estimated_age_value !== '') {
    const age = Number(data.estimated_age_value);
    const limits = { days: 1000, weeks: 143, months: 34 };
    if (!['number', 'string'].includes(typeof data.estimated_age_value) || !Number.isFinite(age) || age <= 0 || !Object.hasOwn(limits, data.estimated_age_unit) || age > limits[data.estimated_age_unit]) return 'Enter a valid approximate age in days, weeks or months.';
  }
  if (data.next_check_date && (!validDate(data.next_check_date) || data.next_check_date <= data.checked_on)) return 'Next examination must be after this examination.';
  if (data.result === 'not_pregnant' && data.next_check_date) return 'Start a new breeding record for another attempt.';
  for (const [field, limit] of [['doctor_name', 100], ['notes', 5000]]) {
    if (data[field] != null && (typeof data[field] !== 'string' || data[field].length > limit)) return `${field} must be text of at most ${limit} characters.`;
  }
  return null;
}

module.exports = { validDate, validateRecord, validateDelivery, validateCheckup };
