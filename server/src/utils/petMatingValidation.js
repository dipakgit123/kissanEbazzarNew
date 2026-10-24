'use strict';

const enums = {
  pet_type: ['dog', 'cat'],
  gender: ['male', 'female'],
  fee_type: ['free', 'paid', 'negotiable'],
  vaccination_status: ['unknown', 'not_vaccinated', 'partial', 'up_to_date'],
  deworming_status: ['unknown', 'not_done', 'done'],
  mating_experience: ['unknown', 'first_time', 'experienced'],
  preferred_gender: ['male', 'female', 'any']
};
const limits = {
  pet_name: 120,
  breed: 160,
  color: 100,
  registered_with: 160,
  temperament: 200,
  preferred_breed: 160,
  description: 4000,
  medical_notes: 2000,
  owner_name: 160,
  city: 120,
  state: 120,
  postal_code: 20,
  health_certificate_url: 500
};
const invalid = (field, message) => {
  const error = new Error(message);
  error.status = 400;
  error.fields = {
    [field]: message
  };
  throw error;
};
function validateProfile(body, existing = {}) {
  const merged = {
    ...(existing.toJSON ? existing.toJSON() : existing),
    ...body
  };
  for (const field of ['pet_name', 'breed']) if (!String(merged[field] || '').trim()) invalid(field, `${field.replaceAll('_', ' ')} is required`);
  for (const [field, values] of Object.entries(enums)) {
    if (merged[field] != null && !values.includes(merged[field])) invalid(field, `Choose a valid ${field.replaceAll('_', ' ')}`);
  }
  for (const field of ['pet_type', 'gender']) if (!merged[field]) invalid(field, `${field.replaceAll('_', ' ')} is required`);
  for (const [field, length] of Object.entries(limits)) {
    if (merged[field] != null && (typeof merged[field] !== 'string' || merged[field].length > length)) invalid(field, `${field.replaceAll('_', ' ')} must be text of at most ${length} characters`);
  }
  for (const [field, min, max, integer] of [['age_months', 1, 600, true], ['weight_kg', 0.01, 300], ['fee_amount', 0, 100000000], ['latitude', -90, 90], ['longitude', -180, 180], ['animal_profile_id', 1, 2147483647, true]]) {
    const value = merged[field];
    if (value == null || value === '') continue;
    const number = Number(value);
    if (!Number.isFinite(number) || number < min || number > max || integer && !Number.isInteger(number)) invalid(field, `Enter a valid ${field.replaceAll('_', ' ')} between ${min} and ${max}`);
  }
  if (merged.fee_type === 'paid' && !(Number(merged.fee_amount) > 0)) invalid('fee_amount', 'Enter a fee greater than zero, or choose Free / Negotiable');
  const phone = String(merged.owner_phone || '').trim().replace(/[\s()-]/g, '');
  if (!/^\+?[1-9]\d{6,14}$/.test(phone)) invalid('owner_phone', 'Enter a valid contact phone number including country code when needed');
  for (const field of ['last_vaccination_date', 'last_deworming_date', 'available_from', 'available_to']) {
    const value = merged[field];
    if (!value) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) invalid(field, 'Enter a valid date in YYYY-MM-DD format');
    if (field.startsWith('last_') && value > new Date().toISOString().slice(0, 10)) invalid(field, 'A completed treatment date cannot be in the future');
  }
  if (merged.available_from && merged.available_to && merged.available_to < merged.available_from) invalid('available_to', 'Availability end date must be on or after the start date');
  if (merged.available_to && merged.available_to < new Date().toISOString().slice(0, 10) && (!existing.id || body.status === 'active')) invalid('available_to', 'Choose a current or future availability end date');
  if (merged.health_certificate_url && !/^https:\/\//i.test(merged.health_certificate_url)) invalid('health_certificate_url', 'Use an HTTPS certificate link');
  return phone;
}
function pagination(query, max = 50) {
  const page = Number(query.page ?? 1),
    limit = Number(query.limit ?? 12);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) invalid('page', 'Enter a valid page number');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > max) invalid('limit', `Limit must be between 1 and ${max}`);
  return {
    page,
    limit,
    offset: (page - 1) * limit
  };
}
module.exports = {
  validateProfile,
  pagination,
  invalid
};
