import api from './api';
export async function healthRequest(path, options = {}) {
  const response = await api.request({ url: `/api/health-check${path}`, method: options.method || 'GET', data: options.body, timeout: 55000 });
  if (!response.data.success) throw Object.assign(new Error(response.data.message), { code: response.data.code });
  return response.data;
}
