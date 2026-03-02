import axiosInstance from '../axiosConfig';

const BASE_URL = '/auditoria/facturas'; // Assuming axiosInstance baseURL is '/api'

/**
 * Servicio para consumir la API de Auditoría de Facturas
 */
const auditoriaFacturasService = {
    /**
     * Obtiene el listado paginado de facturas
     * @param {Object} params - { periodo, fecha_inicio, fecha_fin, pagina, por_pagina }
     */
    getListadoFacturas: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (params.periodo && params.periodo !== 'personalizado') {
                queryParams.append('periodo', params.periodo);
            } else if (params.fecha_inicio && params.fecha_fin) {
                queryParams.append('fecha_inicio', params.fecha_inicio);
                queryParams.append('fecha_fin', params.fecha_fin);
            }

            if (params.pagina) queryParams.append('pagina', params.pagina);
            if (params.por_pagina) queryParams.append('por_pagina', params.por_pagina);

            const response = await axiosInstance.get(`${BASE_URL}/listado?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching listado facturas:', error);
            throw error;
        }
    },

    /**
     * Obtiene el detalle completo de una factura por su ID (fac_sec)
     * @param {string|number} facSec 
     */
    getDetalleFactura: async (facSec) => {
        try {
            const response = await axiosInstance.get(`${BASE_URL}/detalle/${facSec}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching detalle factura:', error);
            throw error;
        }
    },

    /**
     * Obtiene el resumen de facturas por estado de WooCommerce
     * @param {Object} params - { periodo, fecha_inicio, fecha_fin }
     */
    getResumenPorEstado: async (params = {}) => {
        try {
            const queryParams = new URLSearchParams();

            if (params.periodo && params.periodo !== 'personalizado') {
                queryParams.append('periodo', params.periodo);
            } else if (params.fecha_inicio && params.fecha_fin) {
                queryParams.append('fecha_inicio', params.fecha_inicio);
                queryParams.append('fecha_fin', params.fecha_fin);
            }

            const response = await axiosInstance.get(`${BASE_URL}/por-estado?${queryParams.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching resumen facturas por estado:', error);
            throw error;
        }
    }
};

export default auditoriaFacturasService;
