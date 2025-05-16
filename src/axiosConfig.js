// src/axiosConfig.js
import axios from 'axios';
import Swal from 'sweetalert2';

import { API_URL } from './config.js';

// Crea una instancia de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token a todas las solicitudes
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pedidos_pretty_token');
    if (token) {
      config.headers['x-access-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar expiración de token
axiosInstance.interceptors.response.use(
  (response) => response, // Si la respuesta es exitosa, la retorna
  (error) => {
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
  }
);

export default axiosInstance;
