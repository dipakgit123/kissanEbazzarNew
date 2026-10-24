const appJson = require('./app.json');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  process.env.GOOGLE_SERVICES_FILE ||
  './google-services.json';

module.exports = () => {
  const expoConfig = appJson.expo;
  const profile = process.env.EAS_BUILD_PROFILE;
  if (['production', 'preview'].includes(profile)) {
    let url;
    try { url = new URL(process.env.EXPO_PUBLIC_API_URL); } catch { throw new Error('Set EXPO_PUBLIC_API_URL to your HTTPS API URL for release builds'); }
    const placeholderHost = ['example.com', 'example.org', 'example.net', 'example', 'invalid', 'test'].some(host => url.hostname === host || url.hostname.endsWith('.' + host));
    if (url.protocol !== 'https:' || placeholderHost || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
      throw new Error('Release builds require a real HTTPS API URL');
    }
    if (process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true') throw new Error('Disable cleartext traffic for release builds');
  }

  return {
    ...expoConfig,
    android: {
      ...expoConfig.android,
      googleServicesFile,
    },
    extra: {
      ...expoConfig.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || expoConfig.extra?.apiUrl,
      pushProvider: process.env.EXPO_PUBLIC_PUSH_PROVIDER || expoConfig.extra?.pushProvider || 'firebase',
    },
  };
};
