const appJson = require('./app.json');

const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ||
  process.env.GOOGLE_SERVICES_FILE ||
  './google-services.json';

module.exports = () => {
  const expoConfig = appJson.expo;

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
