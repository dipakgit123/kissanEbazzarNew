const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackApiUrl = import.meta.env.PROD ? '' : 'http://localhost:5000';

export const API_BASE_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : fallbackApiUrl;
export const API_BASE_API = `${API_BASE_URL}/api`;
