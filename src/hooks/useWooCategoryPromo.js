import { useState, useCallback } from 'react';
import axiosInstance from '../axiosConfig';

const useWooCategoryPromo = (pro_sec) => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const asignarCategoria = useCallback(async (woo_category_id, woo_category_name) => {
    setLoading(true);
    setResultado(null);
    try {
      const response = await axiosInstance.post(
        `/woo/promo/${pro_sec}/asignar-categoria`,
        { woo_category_id, woo_category_name },
        { timeout: 60000 }
      );
      if (response.data.success) {
        setResultado(response.data.data);
        return response.data.data;
      }
      throw new Error('Respuesta inesperada del servidor');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al asignar categoría en WooCommerce';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [pro_sec]);

  const quitarCategoria = useCallback(async (woo_category_id) => {
    setLoading(true);
    setResultado(null);
    try {
      const response = await axiosInstance.post(
        `/woo/promo/${pro_sec}/quitar-categoria`,
        { woo_category_id },
        { timeout: 60000 }
      );
      if (response.data.success) {
        setResultado(response.data.data);
        return response.data.data;
      }
      throw new Error('Respuesta inesperada del servidor');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al quitar categoría en WooCommerce';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [pro_sec]);

  return { asignarCategoria, quitarCategoria, loading, resultado };
};

export default useWooCategoryPromo;
