// src/config.js
export const API_URL = '/api';

const isDevelopment = import.meta.env.MODE === 'development';

export const baseUrl = isDevelopment
  ? import.meta.env.VITE_MIPUNTO_URL
  : '/apigenexus';

// URL base para microservicios Spring
// Por defecto usa el proxy (/api-spring) para evitar problemas de CORS
// La variable de entorno VITE_SPRING_API_URL solo se usa si está definida y es necesaria
// NOTA: Si usas URL absoluta, asegúrate de que Spring tenga CORS configurado
export const SPRING_API_URL = import.meta.env.VITE_SPRING_API_URL || '/api-spring';

