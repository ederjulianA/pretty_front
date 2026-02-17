// src/hooks/useVentasData.js
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';

/**
 * Hook personalizado para manejar todos los datos del Dashboard de Ventas BI
 * Centraliza la lógica de fetching y state management
 */
const useVentasData = () => {
  // Estados principales
  const [dashboardCompleto, setDashboardCompleto] = useState(null);
  const [kpisPrincipales, setKpisPrincipales] = useState(null);
  const [crecimiento, setCrecimiento] = useState(null);
  const [topProductos, setTopProductos] = useState([]);
  const [ventasPorCategoria, setVentasPorCategoria] = useState([]);
  const [ventasPorRentabilidad, setVentasPorRentabilidad] = useState([]);
  const [topClientes, setTopClientes] = useState([]);
  const [ordenesPorEstado, setOrdenesPorEstado] = useState([]);
  const [ordenesPorCanal, setOrdenesPorCanal] = useState([]);
  const [tendenciaDiaria, setTendenciaDiaria] = useState([]);
  const [ventasPorHora, setVentasPorHora] = useState([]);

  // Estados de loading
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingKPIs, setIsLoadingKPIs] = useState(false);
  const [isLoadingCrecimiento, setIsLoadingCrecimiento] = useState(false);

  // Estados de error
  const [error, setError] = useState(null);

  // Período actual
  const [periodo, setPeriodo] = useState('ultimos_30_dias');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);

  /**
   * Construir query params para el período
   */
  const construirParams = useCallback(() => {
    const params = new URLSearchParams();
    if (periodo && periodo !== 'personalizado') {
      params.append('periodo', periodo);
    } else if (fechaInicio && fechaFin) {
      params.append('fecha_inicio', fechaInicio);
      params.append('fecha_fin', fechaFin);
    } else {
      // Default: últimos 30 días
      params.append('periodo', 'ultimos_30_dias');
    }
    return params.toString();
  }, [periodo, fechaInicio, fechaFin]);

  /**
   * Obtener dashboard completo (todos los KPIs en una sola llamada)
   */
  const fetchDashboardCompleto = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/completo?${params}`);

      if (response.data.success) {
        const data = response.data.data;
        setDashboardCompleto(data);
        setKpisPrincipales(data.kpis_principales);
        setTopProductos(data.top_productos || []);
        setVentasPorCategoria(data.ventas_por_categoria || []);
        setVentasPorRentabilidad(data.ventas_por_rentabilidad || []);
        setTopClientes(data.top_clientes || []);
        setOrdenesPorEstado(data.ordenes_por_estado || []);
        setOrdenesPorCanal(data.ordenes_por_canal || []);
        setTendenciaDiaria(data.tendencia_diaria || []);
        setVentasPorHora(data.ventas_por_hora || []);
      } else {
        throw new Error(response.data.message || 'Error obteniendo dashboard completo');
      }
    } catch (error) {
      console.error('Error fetchDashboardCompleto:', error);
      setError(error.response?.data?.message || error.message || 'Error cargando datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [construirParams]);

  /**
   * Obtener KPIs principales
   */
  const fetchKPIsPrincipales = useCallback(async () => {
    setIsLoadingKPIs(true);
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/kpis?${params}`);

      if (response.data.success) {
        setKpisPrincipales(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo KPIs principales');
      }
    } catch (error) {
      console.error('Error fetchKPIsPrincipales:', error);
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoadingKPIs(false);
    }
  }, [construirParams]);

  /**
   * Obtener tasa de crecimiento
   */
  const fetchCrecimiento = useCallback(async () => {
    setIsLoadingCrecimiento(true);
    try {
      let params;
      
      // Si es período personalizado, calcular período anterior automáticamente
      if (periodo === 'personalizado' && fechaInicio && fechaFin) {
        const fechaInicioDate = new Date(fechaInicio);
        const fechaFinDate = new Date(fechaFin);
        
        // Calcular duración del período
        const duracionMs = fechaFinDate.getTime() - fechaInicioDate.getTime();
        
        // Calcular período anterior (justo antes del período actual)
        const fechaFinAnterior = new Date(fechaInicioDate);
        fechaFinAnterior.setMilliseconds(-1);
        const fechaInicioAnterior = new Date(fechaFinAnterior.getTime() - duracionMs);
        
        // Formatear fechas para el query
        const paramsObj = new URLSearchParams();
        paramsObj.append('fecha_inicio_actual', fechaInicio);
        paramsObj.append('fecha_fin_actual', fechaFin);
        paramsObj.append('fecha_inicio_anterior', fechaInicioAnterior.toISOString().split('T')[0]);
        paramsObj.append('fecha_fin_anterior', fechaFinAnterior.toISOString().split('T')[0]);
        params = paramsObj.toString();
      } else {
        // Usar período predefinido
        params = construirParams();
      }
      
      const response = await axiosInstance.get(`/dashboard/ventas/crecimiento?${params}`);

      if (response.data.success) {
        setCrecimiento(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo tasa de crecimiento');
      }
    } catch (error) {
      console.error('Error fetchCrecimiento:', error);
      // No establecer error global para crecimiento, solo loguear
      // El dashboard puede funcionar sin datos de crecimiento
      setCrecimiento(null);
    } finally {
      setIsLoadingCrecimiento(false);
    }
  }, [periodo, fechaInicio, fechaFin, construirParams]);

  /**
   * Obtener top productos
   */
  const fetchTopProductos = useCallback(async (limite = 10, ordenarPor = 'unidades') => {
    try {
      const params = construirParams();
      params.append('limite', limite);
      params.append('ordenar_por', ordenarPor);
      
      const response = await axiosInstance.get(`/dashboard/ventas/top-productos?${params}`);

      if (response.data.success) {
        setTopProductos(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo top productos');
      }
    } catch (error) {
      console.error('Error fetchTopProductos:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener ventas por categoría
   */
  const fetchVentasPorCategoria = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/categorias?${params}`);

      if (response.data.success) {
        setVentasPorCategoria(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo ventas por categoría');
      }
    } catch (error) {
      console.error('Error fetchVentasPorCategoria:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener ventas por rentabilidad
   */
  const fetchVentasPorRentabilidad = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/rentabilidad?${params}`);

      if (response.data.success) {
        setVentasPorRentabilidad(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo ventas por rentabilidad');
      }
    } catch (error) {
      console.error('Error fetchVentasPorRentabilidad:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener top clientes
   */
  const fetchTopClientes = useCallback(async (limite = 10) => {
    try {
      const params = construirParams();
      params.append('limite', limite);
      
      const response = await axiosInstance.get(`/dashboard/ventas/top-clientes?${params}`);

      if (response.data.success) {
        setTopClientes(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo top clientes');
      }
    } catch (error) {
      console.error('Error fetchTopClientes:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener órdenes por estado
   */
  const fetchOrdenesPorEstado = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/ordenes-estado?${params}`);

      if (response.data.success) {
        setOrdenesPorEstado(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo órdenes por estado');
      }
    } catch (error) {
      console.error('Error fetchOrdenesPorEstado:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener órdenes por canal
   */
  const fetchOrdenesPorCanal = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/ordenes-canal?${params}`);

      if (response.data.success) {
        setOrdenesPorCanal(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo órdenes por canal');
      }
    } catch (error) {
      console.error('Error fetchOrdenesPorCanal:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener tendencia diaria
   */
  const fetchTendenciaDiaria = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/tendencia-diaria?${params}`);

      if (response.data.success) {
        setTendenciaDiaria(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo tendencia diaria');
      }
    } catch (error) {
      console.error('Error fetchTendenciaDiaria:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Obtener ventas por hora
   */
  const fetchVentasPorHora = useCallback(async () => {
    try {
      const params = construirParams();
      const response = await axiosInstance.get(`/dashboard/ventas/ventas-hora?${params}`);

      if (response.data.success) {
        setVentasPorHora(response.data.data);
      } else {
        throw new Error(response.data.message || 'Error obteniendo ventas por hora');
      }
    } catch (error) {
      console.error('Error fetchVentasPorHora:', error);
      setError(error.response?.data?.message || error.message);
    }
  }, [construirParams]);

  /**
   * Refrescar todos los datos
   */
  const refrescarDatos = useCallback(() => {
    fetchDashboardCompleto();
    fetchCrecimiento();
  }, [fetchDashboardCompleto, fetchCrecimiento]);

  /**
   * Actualizar período
   */
  const actualizarPeriodo = useCallback((nuevoPeriodo, fechaInicioCustom = null, fechaFinCustom = null) => {
    setPeriodo(nuevoPeriodo);
    if (nuevoPeriodo === 'personalizado' && fechaInicioCustom && fechaFinCustom) {
      setFechaInicio(fechaInicioCustom);
      setFechaFin(fechaFinCustom);
    } else {
      setFechaInicio(null);
      setFechaFin(null);
    }
  }, []);

  // Fetch inicial cuando cambia el período
  useEffect(() => {
    fetchDashboardCompleto();
    fetchCrecimiento();
  }, [fetchDashboardCompleto, fetchCrecimiento]);

  return {
    // Datos
    dashboardCompleto,
    kpisPrincipales,
    crecimiento,
    topProductos,
    ventasPorCategoria,
    ventasPorRentabilidad,
    topClientes,
    ordenesPorEstado,
    ordenesPorCanal,
    tendenciaDiaria,
    ventasPorHora,

    // Estados
    isLoading,
    isLoadingKPIs,
    isLoadingCrecimiento,
    error,

    // Período
    periodo,
    fechaInicio,
    fechaFin,
    actualizarPeriodo,

    // Acciones
    refrescarDatos,
    fetchDashboardCompleto,
    fetchKPIsPrincipales,
    fetchCrecimiento,
    fetchTopProductos,
    fetchVentasPorCategoria,
    fetchVentasPorRentabilidad,
    fetchTopClientes,
    fetchOrdenesPorEstado,
    fetchOrdenesPorCanal,
    fetchTendenciaDiaria,
    fetchVentasPorHora
  };
};

export default useVentasData;
