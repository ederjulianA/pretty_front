import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../axiosConfig';

const useWooCategories = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategorias = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/woo/categorias');
      if (response.data.success) {
        setCategorias(response.data.data);
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Error al cargar categorías de WooCommerce';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { categorias, loading, error, fetchCategorias };
};

export default useWooCategories;
