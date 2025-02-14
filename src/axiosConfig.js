// src/axiosConfig.js
import axios from 'axios';
import Swal from 'sweetalert2';

import { API_URL } from './config.js';

// Crea una instancia de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
});

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
        window.location.reload();
      });
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
