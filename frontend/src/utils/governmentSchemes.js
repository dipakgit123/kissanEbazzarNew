export const SCHEME_CATEGORIES = ['loan', 'subsidy', 'insurance', 'training', 'health', 'general'];
export const SCHEME_ANIMALS = ['farm', 'pet', 'both'];

export const schemeLanguage = language => String(language || 'en').split('-')[0];
export const schemeLocale = language => language === 'mr' ? 'mr-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';

export const schemeText = (scheme, field, language) => {
  const translations = scheme?.translations || {};
  return translations[schemeLanguage(language)]?.[field] || translations.en?.[field] || scheme?.[field] || '';
};

export const schemeItems = (scheme, field, language) => {
  const values = [scheme?.translations?.[schemeLanguage(language)]?.[field], scheme?.translations?.en?.[field], scheme?.[field]];
  return values.find(Array.isArray) || [];
};

export const schemeAmount = (value, language) => {
  const text = value == null ? '' : String(value).trim();
  return /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) ? Number(text).toLocaleString(schemeLocale(language)) : text;
};

export const schemeDeadline = (value, language) => {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString(schemeLocale(language), { day: 'numeric', month: 'short', year: 'numeric' });
};

export const schemeWebsite = value => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
};
