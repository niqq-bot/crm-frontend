const DEFAULT_BASE = import.meta.env.VITE_API_BASE_URL || 'http://3.85.210.31:8000';
export const getBase = () => (localStorage.getItem('crm_api_base') || DEFAULT_BASE).replace(/\/$/, '');
export const getToken = () => localStorage.getItem('crm_token') || '';
export const setToken = (v) => v ? localStorage.setItem('crm_token', v) : localStorage.removeItem('crm_token');
export const setBase = (v) => localStorage.setItem('crm_api_base', v.replace(/\/$/, ''));

export async function api(path, options = {}) {
  const { body, headers = {}, ...rest } = options;
  const token = getToken();
  const isForm = body instanceof FormData;
  const finalHeaders = { ...(!isForm && body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers };
  if (token && !finalHeaders.Authorization) finalHeaders.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${getBase()}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: body === undefined ? undefined : isForm || typeof body === 'string' ? body : JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(`Could not reach the API at ${getBase()}. Check the server and CORS settings. ${e.message}`);
  }
  const raw = await response.text();
  let data = null;
  if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }
  if (!response.ok) {
    const msg = typeof data === 'string' ? data : data?.message || data?.error || `${response.status} ${response.statusText}`;
    throw new Error(msg || 'Request failed');
  }
  return data;
}
export const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return [];
  for (const key of ['content','items','data','results','leads','deals','tasks','contacts','users','organizations','records']) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};
export const pretty = (value) => value == null ? '—' : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
