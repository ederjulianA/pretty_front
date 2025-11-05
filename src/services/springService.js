// src/services/springService.js
import { springAxios } from '../axiosConfig.js';

/**
 * Servicio base para consumir endpoints de microservicios Spring
 * Este servicio proporciona métodos genéricos para realizar peticiones HTTP
 * a los microservicios Spring configurados
 */
class SpringService {
  /**
   * Realiza una petición GET a un endpoint de Spring
   * @param {string} endpoint - Ruta del endpoint (ej: '/nits')
   * @param {object} params - Parámetros de consulta (query params)
   * @returns {Promise} Respuesta de la petición
   */
  async get(endpoint, params = {}) {
    try {
      const response = await springAxios.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`Error en GET ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Realiza una petición POST a un endpoint de Spring
   * @param {string} endpoint - Ruta del endpoint
   * @param {object} data - Datos a enviar en el cuerpo de la petición
   * @returns {Promise} Respuesta de la petición
   */
  async post(endpoint, data = {}) {
    try {
      const response = await springAxios.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error en POST ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Realiza una petición PUT a un endpoint de Spring
   * @param {string} endpoint - Ruta del endpoint
   * @param {object} data - Datos a enviar en el cuerpo de la petición
   * @returns {Promise} Respuesta de la petición
   */
  async put(endpoint, data = {}) {
    try {
      const response = await springAxios.put(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error en PUT ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Realiza una petición DELETE a un endpoint de Spring
   * @param {string} endpoint - Ruta del endpoint
   * @returns {Promise} Respuesta de la petición
   */
  async delete(endpoint) {
    try {
      const response = await springAxios.delete(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error en DELETE ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Realiza una petición PATCH a un endpoint de Spring
   * @param {string} endpoint - Ruta del endpoint
   * @param {object} data - Datos a enviar en el cuerpo de la petición
   * @returns {Promise} Respuesta de la petición
   */
  async patch(endpoint, data = {}) {
    try {
      const response = await springAxios.patch(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error en PATCH ${endpoint}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Manejo centralizado de errores
   * @param {Error} error - Error capturado
   * @returns {Error} Error procesado con mensaje descriptivo
   */
  handleError(error) {
    // Si el error fue cancelado/abortado
    if (error.code === 'ECONNABORTED' || error.message === 'Request aborted') {
      return new Error('La petición fue cancelada o excedió el tiempo de espera. Verifique su conexión.');
    }
    
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const status = error.response.status;
      let message = error.response.data?.message || 
                   error.response.data?.error || 
                   `Error ${status}: ${error.response.statusText}`;
      
      // Mensajes más específicos según el código de estado
      if (status === 401) {
        message = 'No autorizado. Verifique su token de autenticación.';
      } else if (status === 404) {
        message = 'Endpoint no encontrado. Verifique la URL.';
      } else if (status === 500) {
        message = 'Error interno del servidor.';
      }
      
      return new Error(message);
    } else if (error.request) {
      // La petición se hizo pero no se recibió respuesta
      if (error.code === 'ERR_NETWORK') {
        return new Error('Error de red: No se pudo conectar con el servidor. Verifique que Spring esté corriendo.');
      }
      return new Error('Error de conexión: No se pudo conectar con el servidor');
    } else {
      // Algo pasó al configurar la petición
      return new Error(`Error: ${error.message}`);
    }
  }
}

// Exportar una instancia del servicio
export const springService = new SpringService();

// También exportar la clase por si necesitas crear instancias personalizadas
export default SpringService;

