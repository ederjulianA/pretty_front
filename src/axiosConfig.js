// src/axiosConfig.js
import axios from 'axios';
import Swal from 'sweetalert2';

import { API_URL, SPRING_API_URL } from './config.js';

// Función compartida para agregar el token a las solicitudes
const addTokenInterceptor = (config) => {
  const token = localStorage.getItem('pedidos_pretty_token');
  if (token) {
    config.headers['x-access-token'] = token;
  }
  return config;
};

// Función compartida para manejar errores de autenticación
const handleAuthError = (error) => {
  if (error.response && error.response.status === 401) {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión Expirada',
      text: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
      confirmButtonColor: '#f58ea3',
    }).then(() => {
      // Limpia el token y redirige a la pantalla de login
      localStorage.removeItem('pedidos_pretty_token');
      localStorage.removeItem('user_pretty');
      localStorage.removeItem('user_role');
      localStorage.removeItem('user_permissions');
      window.location.href = '/login';
    });
  }
  return Promise.reject(error);
};

// Crea una instancia de axios para la API principal
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token a todas las solicitudes
axiosInstance.interceptors.request.use(
  addTokenInterceptor,
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar expiración de token
axiosInstance.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, la retorna
  handleAuthError
);

// Crea una instancia de axios para microservicios Spring
export const springAxios = axios.create({
  baseURL: SPRING_API_URL,
  timeout: 30000, // 30 segundos de timeout
});

// Interceptor para agregar el token a las solicitudes de Spring
springAxios.interceptors.request.use(
  addTokenInterceptor,
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas de Spring
// Nota: No redirige a login automáticamente porque Spring puede devolver 401 por otras razones
springAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Los errores se manejan en los servicios específicos
    return Promise.reject(error);
  }
);

export default axiosInstance;
