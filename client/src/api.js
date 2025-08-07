// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '', // не добавляем /api, потому что уже указываем его вручную в путях
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
