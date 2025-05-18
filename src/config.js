// src/config.js
export const API_URL = import.meta.env.VITE_API_URL || '/api';

const isDevelopment = import.meta.env.MODE === 'development';

export const baseUrl = isDevelopment
  ? import.meta.env.VITE_MIPUNTO_URL
  : '/apigenexus';

