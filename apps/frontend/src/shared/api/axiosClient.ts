import axios from 'axios';

export const DEFAULT_API_URL = 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;