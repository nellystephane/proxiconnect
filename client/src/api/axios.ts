import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://proxiconnect.onrender.com';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ajouter automatiquement le token aux requêtes
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;