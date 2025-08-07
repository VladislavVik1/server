import axios from 'axios';

const api = axios.create({
  baseURL: '/', // т.к. Express отдаёт статику и API вместе
});

export function setAuthToken(token) {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
}

export default api;
