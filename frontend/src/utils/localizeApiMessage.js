export const localizeApiMessage = (i18n, t, serverMessage, translationKey, defaultValue) => {
  const language = i18n?.resolvedLanguage || i18n?.language || 'en';

  if (serverMessage && language.startsWith('en')) {
    return serverMessage;
  }

  return t(translationKey, { defaultValue });
};
