import axios from 'axios';

const API = axios.create({
  baseURL: 'https://proxiconnect.onrender.com/api',
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