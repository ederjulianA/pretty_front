// src/hooks/useCostosData.js
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';

/**
 * Hook personalizado para manejar todos los datos del Dashboard de Costos
 * Centraliza la lógica de fetching y state management
 */
const useCostosData = () => {
  // Estados principales
  const [resumenValorizado, setResumenValorizado] = useState(null);
  const [articulosValorados, setArticulosValorados] = useState([]);
  const [articulosSinCosto, setArticulosSinCosto] = useState([]);
  const [variacionCostos, setVariacionCostos] = useState([]);

  // Estados de loading
  const [loadingValorizado, setLoadingValorizado] = useState(true);
  const [loadingSinCosto, setLoadingSinCosto] = useState(true);
  const [loadingVariacion, setLoadingVariacion] = useState(true);

  // Estados de error
  const [errorValorizado, setErrorValorizado] = useState(null);
  const [errorSinCosto, setErrorSinCosto] = useState(null);
  const [errorVariacion, setErrorVariacion] = useState(null);

  // Filtros
  const [filtros, setFiltros] = useState({
    fecha_desde: null,
    fecha_hasta: null,
    inv_sub_gru_cod: null,
    solo_con_existencia: true
  });

  /**
   * Fetch valorizado de inventario con clasificación ABC
   */
  const fetchValorizado = useCallback(async () => {
    setLoadingValorizado(true);
    setErrorValorizado(null);

    try {
      // Construir query params
      const params = new URLSearchParams();
      params.append('limit', '100'); // Top 100 productos

      if (filtros.inv_sub_gru_cod) {
        params.append('inv_sub_gru_cod', filtros.inv_sub_gru_cod);
      }
      if (filtros.fecha_desde) {
        params.append('fecha_compra_desde', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params.append('fecha_compra_hasta', filtros.fecha_hasta);
      }

      const response = await axiosInstance.get(
        `/compras/reportes/valorizado-inventario?${params.toString()}`
      );

      if (response.data.success) {
        setResumenValorizado(response.data.data.resumen);
        setArticulosValorados(response.data.data.articulos);
      } else {
        throw new Error(response.data.message || 'Error obteniendo valorizado');
      }
    } catch (error) {
      console.error('Error fetchValorizado:', error);
      setErrorValorizado(error.message);
    } finally {
      setLoadingValorizado(false);
    }
  }, [filtros]);

  /**
   * Fetch artículos sin costo asignado
   */
  const fetchArticulosSinCosto = useCallback(async () => {
    setLoadingSinCosto(true);
    setErrorSinCosto(null);

    try {
      const params = new URLSearchParams();
      params.append('solo_con_existencia', filtros.solo_con_existencia ? 'true' : 'false');
      params.append('limit', '1000'); // Traer completo para evitar confusión de conteo en la vista

      if (filtros.inv_sub_gru_cod) {
        params.append('inv_sub_gru_cod', filtros.inv_sub_gru_cod);
      }

      const response = await axiosInstance.get(
        `/compras/reportes/articulos-sin-costo?${params.toString()}`
      );

      if (response.data.success) {
        setArticulosSinCosto(response.data.data.articulos);
      } else {
        throw new Error(response.data.message || 'Error obteniendo artículos sin costo');
      }
    } catch (error) {
      console.error('Error fetchArticulosSinCosto:', error);
      setErrorSinCosto(error.message);
    } finally {
      setLoadingSinCosto(false);
    }
  }, [filtros]);

  /**
   * Fetch variación de costos
   */
  const fetchVariacionCostos = useCallback(async () => {
    setLoadingVariacion(true);
    setErrorVariacion(null);

    try {
      const params = new URLSearchParams();
      params.append('limit', '20'); // Top 20 con mayor variación

      if (filtros.fecha_desde) {
        params.append('fecha_desde', filtros.fecha_desde);
      }
      if (filtros.fecha_hasta) {
        params.append('fecha_hasta', filtros.fecha_hasta);
      }

      const response = await axiosInstance.get(
        `/compras/reportes/variacion-costos?${params.toString()}`
      );

      if (response.data.success) {
        setVariacionCostos(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo variación de costos');
      }
    } catch (error) {
      console.error('Error fetchVariacionCostos:', error);
      setErrorVariacion(error.message);
    } finally {
      setLoadingVariacion(false);
    }
  }, [filtros]);

  /**
   * Refrescar todos los datos
   */
  const refrescarDatos = useCallback(() => {
    fetchValorizado();
    fetchArticulosSinCosto();
    fetchVariacionCostos();
  }, [fetchValorizado, fetchArticulosSinCosto, fetchVariacionCostos]);

  /**
   * Actualizar filtros
   */
  const actualizarFiltros = useCallback((nuevosFiltros) => {
    setFiltros(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // Fetch inicial y cuando cambian los filtros
  useEffect(() => {
    fetchValorizado();
    fetchArticulosSinCosto();
    fetchVariacionCostos();
  }, [fetchValorizado, fetchArticulosSinCosto, fetchVariacionCostos]);

  // Computed values
  const isLoading = loadingValorizado || loadingSinCosto || loadingVariacion;
  const hasError = errorValorizado || errorSinCosto || errorVariacion;

  // Métricas derivadas
  const metricas = resumenValorizado ? {
    valorTotal: resumenValorizado.valor_total_inventario,
    totalArticulos: resumenValorizado.total_articulos,
    articulosSinCostoCount: resumenValorizado.articulos_sin_costo,
    clasificacionABC: resumenValorizado.clasificacion_abc,

    // Productos críticos (Tipo A)
    productosA: articulosValorados.filter(a => a.clasificacion_abc === 'A'),
    productosB: articulosValorados.filter(a => a.clasificacion_abc === 'B'),
    productosC: articulosValorados.filter(a => a.clasificacion_abc === 'C'),

    // Inventario muerto (sin rotación > 90 días)
    inventarioMuerto: articulosValorados.filter(a => a.requiere_reorden),
    valorInmovilizado: articulosValorados
      .filter(a => a.requiere_reorden)
      .reduce((sum, a) => sum + a.valor_total, 0),

    // Productos sin rotación reciente (30 días)
    sinRotacion: articulosValorados.filter(a => !a.rotacion_activa),

    // Top 10 productos por valor
    top10Productos: [...articulosValorados]
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10)
  } : null;

  return {
    // Estados
    resumenValorizado,
    articulosValorados,
    articulosSinCosto,
    variacionCostos,
    metricas,

    // Loading/Error
    isLoading,
    hasError,
    loadingValorizado,
    loadingSinCosto,
    loadingVariacion,
    errorValorizado,
    errorSinCosto,
    errorVariacion,

    // Filtros
    filtros,
    actualizarFiltros,

    // Actions
    refrescarDatos,
    fetchValorizado,
    fetchArticulosSinCosto,
    fetchVariacionCostos
  };
};

export default useCostosData;
