// src/services/nitService.js
import { springService } from './springService';

/**
 * Servicio para gestionar NITs/Clientes desde el microservicio Spring
 */
class NitService {
  /**
   * Obtiene la lista de NITs con paginación y filtros opcionales
   * Decide automáticamente si usar el endpoint simple o búsqueda avanzada
   * @param {Object} params - Parámetros de búsqueda y paginación
   * @param {string} params.nombre - Nombre del NIT (búsqueda parcial)
   * @param {string} params.identificacion - Número de identificación (búsqueda parcial)
   * @param {string} params.email - Email del NIT (búsqueda parcial)
   * @param {number} params.page - Número de página (0-indexed)
   * @param {number} params.size - Tamaño de página
   * @returns {Promise} Respuesta con content y pageInfo
   */
  async obtenerListaNits(params = {}) {
    const {
      nombre = '',
      identificacion = '',
      email = '',
      page = 0,
      size = 20
    } = params;

    // Si hay algún filtro, usar búsqueda avanzada
    const tieneFiltros = nombre || identificacion || email;
    
    if (tieneFiltros) {
      return await this.buscarNits(params);
    } else {
      return await this.obtenerNits({ page, size });
    }
  }

  /**
   * Búsqueda avanzada de NITs con filtros (usa /api/nits/buscar-avanzada)
   * @param {Object} params - Parámetros de búsqueda y paginación
   * @param {string} params.nombre - Nombre del NIT (búsqueda parcial)
   * @param {string} params.identificacion - Número de identificación (búsqueda parcial)
   * @param {string} params.email - Email del NIT (búsqueda parcial)
   * @param {number} params.page - Número de página (0-indexed)
   * @param {number} params.size - Tamaño de página
   * @returns {Promise} Respuesta con content y pageInfo
   */
  async buscarNits(params = {}) {
    const {
      nombre = '',
      identificacion = '',
      email = '',
      page = 0,
      size = 20
    } = params;

    // Construir los query params como parámetros separados
    const queryParams = {
      page,
      size
    };
    
    // Agregar filtros si tienen valor
    if (nombre) queryParams.nombre = nombre;
    if (identificacion) queryParams.identificacion = identificacion;
    if (email) queryParams.email = email;

    // Usar búsqueda avanzada con parámetros separados
    // Ejemplo: /api/nits/buscar-avanzada?nombre=Lady&page=0&size=20
    return await springService.get('/nits/buscar-avanzada', queryParams);
  }

  /**
   * Obtiene la lista de NITs simple (sin búsqueda avanzada)
   * Usa /api/nits con paginación simple
   * @param {Object} params - Parámetros de paginación
   * @param {number} params.page - Número de página (0-indexed)
   * @param {number} params.size - Tamaño de página
   * @returns {Promise} Respuesta con content y pageInfo
   */
  async obtenerNits(params = {}) {
    const { page = 0, size = 20 } = params;
    
    return await springService.get('/nits', {
      page,
      size
    });
  }

  /**
   * Obtiene un NIT por su ID
   * @param {string} nitSec - ID del NIT
   * @returns {Promise} Datos del NIT
   */
  async obtenerNitPorId(nitSec) {
    return await springService.get(`/nits/${nitSec}`);
  }

  /**
   * Crea un nuevo NIT
   * @param {Object} nitData - Datos del NIT a crear
   * @returns {Promise} NIT creado
   */
  async crearNit(nitData) {
    return await springService.post('/nits', nitData);
  }

  /**
   * Actualiza un NIT existente
   * @param {string} nitSec - ID del NIT
   * @param {Object} nitData - Datos actualizados del NIT
   * @returns {Promise} NIT actualizado
   */
  async actualizarNit(nitSec, nitData) {
    return await springService.put(`/nits/${nitSec}`, nitData);
  }

  /**
   * Elimina un NIT
   * @param {string} nitSec - ID del NIT
   * @returns {Promise} Resultado de la eliminación
   */
  async eliminarNit(nitSec) {
    return await springService.delete(`/nits/${nitSec}`);
  }
}

export const nitService = new NitService();
export default NitService;

