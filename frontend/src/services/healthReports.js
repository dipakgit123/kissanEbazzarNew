import { API_BASE_URL } from '../config/api';
export async function healthRequest(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/health-check${path}`, {
      ...options, signal: controller.signal,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}`, ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...options.headers }
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    const fallbackCode = response.status === 401 ? 'HEALTH_AUTH_REQUIRED' : response.status === 403 ? 'HEALTH_ACCESS_DENIED' : response.status === 413 ? 'HEALTH_IMAGE_TOO_LARGE' : [408, 504].includes(response.status) ? 'HEALTH_REQUEST_TIMEOUT' : response.status === 429 ? 'AI_RATE_LIMITED' : response.status >= 500 ? 'HEALTH_SERVER_UNAVAILABLE' : 'HEALTH_INVALID_RESPONSE';
    if (!response.ok || !data?.success) throw Object.assign(new Error('Health request failed'), { code: data?.code || fallbackCode, status: response.status });
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw Object.assign(new Error('Health request timed out'), { code: 'HEALTH_REQUEST_TIMEOUT' });
    if (error instanceof TypeError && !error.code) throw Object.assign(new Error('Cannot reach health service'), { code: 'HEALTH_NETWORK_ERROR' });
    throw error;
  } finally { clearTimeout(timer); }
}
