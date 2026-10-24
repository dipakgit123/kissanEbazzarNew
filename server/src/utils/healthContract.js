'use strict';
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SPECIES = ['cow', 'buffalo', 'horse', 'goat', 'sheep', 'dog', 'cat', 'other'];
const fail = (message, code = 'HEALTH_INVALID_INPUT', status = 400) => Object.assign(new Error(message), { code, status });
function text(value, name, max = 2000) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.length > max) throw fail(`Invalid ${name}`);
  return value.trim();
}
function context(body = {}) {
  if (!SPECIES.includes(body.animalType)) throw fail('Select a valid animal type.');
  const group = require('../services/animalGroupScope').currentGroup();
  if (group && !require('./animalGroup').allowsSpecies(group, body.animalType)) throw fail('Select an animal from the current experience.');
  const result = { animalType: body.animalType, animalGroup: group || require('./animalGroup').groupForSpecies(body.animalType) }; 
  for (const [key, max] of Object.entries({ symptoms: 2000, age: 80, additionalInfo: 3000, animalName: 100, animalTag: 80, customQuestion: 2000 })) result[key] = text(body[key], key, max);
  if (/^-/.test(result.age)) throw fail('Invalid age.');
  result.languageHint = text(body.languageHint || 'en', 'language', 12).split('-')[0];
  if (!['en', 'mr', 'hi'].includes(result.languageHint)) result.languageHint = 'en';
  result.sex = body.sex || 'unknown';
  if (!['unknown', 'female', 'male'].includes(result.sex)) throw fail('Invalid animal sex.');
  for (const [key, max] of Object.entries({ symptomDurationDays: 3650, ageMonths: 1200, cowId: 2147483647, animalId: 2147483647 })) {
    const value = body[key];
    if (value == null || value === '') { result[key] = null; continue; }
    if (!['number', 'string'].includes(typeof value) || !/^\d+$/.test(String(value)) || Number(value) > max || (['cowId', 'animalId'].includes(key) && Number(value) < 1)) throw fail(`Invalid ${key}`);
    result[key] = Number(value);
  }
  return result;
}
function image(buffer, declaredMime) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw fail('Choose an image.');
  if (buffer.length > MAX_IMAGE_BYTES) throw fail('Use an image under 8 MB.', 'HEALTH_IMAGE_TOO_LARGE', 413);
  const mime = buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ? 'image/jpeg'
    : buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png'
      : buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' ? 'image/webp'
        : /^GIF8[79]a$/.test(buffer.toString('ascii', 0, 6)) ? 'image/gif' : null;
  if (!mime || mime !== declaredMime) throw fail('Use a JPEG, PNG, WebP or GIF image.', 'HEALTH_INVALID_IMAGE');
  return { base64: buffer.toString('base64'), mimeType: mime };
}
function analysis(raw) {
  const invalid = () => fail('The photo could not be assessed reliably. Please try again with a clear photo.', 'AI_INVALID_RESPONSE', 502);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || typeof raw.animalDetected !== 'boolean') throw invalid();
  if (raw.imageUsable != null && typeof raw.imageUsable !== 'boolean') throw invalid();
  const reasons = {
    no_animal: ['No animal was identified. Please upload a photo of your animal.', 'AI_NO_ANIMAL'],
    unclear: ['The animal is obscured or too blurred to assess. Please take another photo.', 'AI_IMAGE_UNCLEAR'],
    multiple_animals: ['Please choose a photo with one main animal clearly identifiable.', 'AI_MULTIPLE_ANIMALS'],
    species_mismatch: ['The detected animal differs from the selected type. Check your selection.', 'AI_SPECIES_MISMATCH'],
    not_real_photo: ['AI could not verify this as a photograph of a real animal. Please use a recent camera photo of your animal.', 'AI_REAL_PHOTO_REQUIRED'],
    cannot_assess: ['AI could not assess this image. This does not necessarily mean the photo is unclear. Try another view and describe the symptoms.', 'AI_IMAGE_NOT_ASSESSABLE'],
  };
  if (raw.rejectionReason != null && raw.rejectionReason !== 'none' && !Object.hasOwn(reasons, raw.rejectionReason)) throw invalid();
  if (!raw.animalDetected || raw.imageUsable === false) {
    const [message, code] = reasons[raw.rejectionReason] || reasons.cannot_assess;
    throw fail(message, code, 422);
  }
  if (raw.rejectionReason && raw.rejectionReason !== 'none') throw invalid();
  const out = { animalDetected: true };
  for (const key of ['overallHealth', 'animalType', 'animalTypeEnglish', 'urgencyLevel', 'whenToSeeVet', 'disclaimer', 'questionAnswer']) {
    if (raw[key] != null && (typeof raw[key] !== 'string' || raw[key].length > 6000)) throw invalid();
    out[key] = raw[key] || '';
  }
  if (!out.overallHealth || !out.whenToSeeVet) throw invalid();
  for (const [key, max] of [['healthScore', 10], ['bodyConditionScore', 5]]) {
    if (raw[key] == null) { out[key] = null; continue; }
    if (typeof raw[key] !== 'number' || !Number.isFinite(raw[key]) || raw[key] < 1 || raw[key] > max) throw invalid();
    out[key] = raw[key];
  }
  for (const key of ['visibleSigns', 'healthyIndicators', 'recommendations', 'firstAid', 'dietarySuggestions', 'preventiveCare', 'assessmentLimitations']) {
    if (raw[key] != null && (!Array.isArray(raw[key]) || raw[key].length > 20 || raw[key].some(v => typeof v !== 'string' || v.length > 2000))) throw invalid();
    out[key] = raw[key] || [];
  }
  if (raw.potentialIssues != null && (!Array.isArray(raw.potentialIssues) || raw.potentialIssues.length > 12)) throw invalid();
  out.potentialIssues = (raw.potentialIssues || []).map(issue => {
    if (!issue || typeof issue !== 'object' || typeof issue.condition !== 'string') throw invalid();
    return Object.fromEntries(['condition', 'conditionEnglish', 'likelihood', 'description', 'symptoms'].map(key => {
      if (issue[key] != null && (typeof issue[key] !== 'string' || issue[key].length > 2000)) throw invalid();
      return [key, issue[key] || ''];
    }));
  });
  // Interpret legacy labels too, and never turn an unknown level into reassurance.
  const label = `${raw.urgencyCode || ''} ${out.urgencyLevel}`.toLowerCase();
  out.urgencyCode = /emergency|critical|urgent|आणीबाणी|आपात/.test(label) ? 'emergency'
    : /soon|high|लवकर|जल्द/.test(label) ? 'soon'
      : /monitor|moderate|medium|निरीक्षण|निगरानी/.test(label) ? 'monitor'
        : /routine|normal|सामान्य/.test(label) ? 'routine' : 'unknown';
  // A photograph cannot establish age, fertility or pregnancy readiness.
  return out;
}
module.exports = { MAX_IMAGE_BYTES, SPECIES, fail, text, context, image, analysis };
