// src/config.js
export const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.11:3000/api';

const isDevelopment = import.meta.env.MODE === 'development';

export const baseUrl = isDevelopment
  ? import.meta.env.VITE_MIPUNTO_URL
  : '/apigenexus';

