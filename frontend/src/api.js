const BASE = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'nh_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(method, path, body) {
  const headers = {};

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error((data && data.error) || 'Something went wrong. Please try again.');
  }

  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body || {}),
  put: (path, body) => request('PUT', path, body || {}),
  patch: (path, body) => request('PATCH', path, body || {}),
  del: (path) => request('DELETE', path),

  async download(path, filename) {
    const response = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) {
      throw new Error('We could not download that file.');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  },
};
