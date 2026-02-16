import axiosInstance from '../axiosConfig';

export const compraService = {
  async listarCompras(filtros = {}) {
    const response = await axiosInstance.get('/compras', { params: filtros });
    return response.data;
  },

  async obtenerCompra(facNro) {
    const response = await axiosInstance.get(`/compras/${facNro}`);
    return response.data;
  },

  async crearCompra(payload) {
    const response = await axiosInstance.post('/compras', payload);
    return response.data;
  },

  async actualizarCompra(facNro, payload) {
    const response = await axiosInstance.put(`/compras/${facNro}`, payload);
    return response.data;
  }
};
