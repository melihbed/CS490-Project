const BASE =
  (process.env.REACT_APP_API_BASE || '')

  
const handleRes = async (res) => {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
};

const api = {
  get: async (path) => {
    const res = await fetch(`${BASE}${path}`);
    return handleRes(res);
  },
  post: async (path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleRes(res);
  },
  put: async (path, body = {}) => {
    const res = await fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleRes(res);
  },
};

export default api;
