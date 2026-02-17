import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import { API_URL } from '../config';

/**
 * Hook para obtener datos de rentabilidad actualizados de un producto
 * 
 * @param {string} artSec - ID del artículo (art_sec)
 * @param {boolean} enabled - Si debe hacer la petición (default: true)
 * @returns {Object} { rentabilidadData, isLoading, error, refetch }
 */
const useRentabilidad = (artSec, enabled = true) => {
  const [rentabilidadData, setRentabilidadData] = useState({
    rentabilidadDetal: null,
    margenGananciaDetal: null,
    utilidadBrutaDetal: null,
    clasificacionRentabilidad: null,
    rentabilidadMayor: null,
    costoPromedio: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRentabilidad = useCallback(async () => {
    if (!artSec || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axiosInstance.get(`/articulos/${artSec}`, {
        headers: { 'x-access-token': token }
      });

      if (response.data.success && response.data.articulo) {
        const articulo = response.data.articulo;
        
        // Obtener costo promedio también para poder calcular si falta rentabilidad
        const getCostoPromedio = (art) =>
          art.costo_promedio ??
          art.costo_promedio_ponderado ??
          art.costo_promedio_actual ??
          art.art_bod_cos_cat ??
          art.kar_cos_pro ??
          null;
        
        const costoPromedio = getCostoPromedio(articulo);
        
        setRentabilidadData({
          rentabilidadDetal: articulo.rentabilidad_detal ?? articulo.rentabilidad ?? null,
          margenGananciaDetal: articulo.margen_ganancia_detal ?? articulo.margen_ganancia ?? null,
          utilidadBrutaDetal: articulo.utilidad_bruta_detal ?? articulo.utilidad_bruta ?? null,
          clasificacionRentabilidad: articulo.clasificacion_rentabilidad ?? null,
          rentabilidadMayor: articulo.rentabilidad_mayor ?? null,
          costoPromedio: costoPromedio  // Incluir costo promedio también
        });
      }
    } catch (err) {
      console.error('Error obteniendo datos de rentabilidad:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [artSec, enabled]);

  useEffect(() => {
    fetchRentabilidad();
  }, [fetchRentabilidad]);

  return {
    rentabilidadData,
    isLoading,
    error,
    refetch: fetchRentabilidad
  };
};

export default useRentabilidad;
