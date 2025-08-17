// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '', // используем относительные пути /api/...
  withCredentials: false,
});

// ===== Интерцептор: автоматически добавляет Bearer-токен из localStorage =====
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== Совместимость со старым кодом =====
// Можно вызывать после логина: setAuthToken(token)
// (хранит токен в localStorage и сразу прописывает хедер для текущего инстанса)
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
