// src/pages/DashboardCostos.jsx
import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import axiosInstance from '../axiosConfig';
import useCostosData from '../hooks/useCostosData';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

/**
 * Dashboard de Control de Costos
 * Interfaz financiera para análisis de inventario y toma de decisiones estratégicas
 */
const DashboardCostos = () => {
  const {
    metricas,
    articulosValorados,
    articulosSinCosto,
    isLoading,
    hasError,
    filtros,
    actualizarFiltros,
    refrescarDatos
  } = useCostosData();

  const [mostrarSinCosto, setMostrarSinCosto] = useState(false);
  const [diasSinVenta, setDiasSinVenta] = useState(90); // Filtro dinámico
  const [mostrarTodosInventarioMuerto, setMostrarTodosInventarioMuerto] = useState(false);
  const [tipoParetoActivo, setTipoParetoActivo] = useState(null);
  const [mostrarTodosTipoPareto, setMostrarTodosTipoPareto] = useState(false);
  const [productosTipoPareto, setProductosTipoPareto] = useState([]);
  const [cargandoTipoPareto, setCargandoTipoPareto] = useState(false);
  const [errorTipoPareto, setErrorTipoPareto] = useState('');
  const [mostrarGuiaPareto, setMostrarGuiaPareto] = useState(true);
  const [arbolSoloConStock, setArbolSoloConStock] = useState(true);
  const [categoriasArbol, setCategoriasArbol] = useState([]);
  const [resumenArbol, setResumenArbol] = useState(null);
  const [cargandoCategoriasArbol, setCargandoCategoriasArbol] = useState(false);
  const [errorCategoriasArbol, setErrorCategoriasArbol] = useState('');
  const [categoriasExpandidas, setCategoriasExpandidas] = useState({});
  const [subcategoriasPorCategoria, setSubcategoriasPorCategoria] = useState({});
  const [subcategoriasExpandidas, setSubcategoriasExpandidas] = useState({});
  const [articulosPorSubcategoria, setArticulosPorSubcategoria] = useState({});
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);
  const [cargandoSubcategorias, setCargandoSubcategorias] = useState(false);
  const [filtroUI, setFiltroUI] = useState({
    categoria: '',
    subcategoria: filtros.inv_sub_gru_cod ? String(filtros.inv_sub_gru_cod) : '',
    fecha_desde: filtros.fecha_desde || '',
    fecha_hasta: filtros.fecha_hasta || '',
    solo_con_existencia: filtros.solo_con_existencia ?? true
  });

  // Formatear moneda colombiana
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formatear números
  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  // Formatear porcentaje
  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const extraerArray = (payload) => {
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.result?.data)) return payload.result.data;
    return [];
  };

  const cargarCategorias = async () => {
    setCargandoCategorias(true);
    try {
      const response = await axiosInstance.get('/categorias?limit=1000');
      const categoriasRaw = extraerArray(response.data);
      const categoriasFormateadas = categoriasRaw.map((cat) => ({
        id: String(cat.inv_gru_cod),
        nombre: cat.inv_gru_nom
      }));
      setCategorias(categoriasFormateadas);
    } catch (error) {
      console.error('Error cargando categorías del dashboard de costos:', error);
    } finally {
      setCargandoCategorias(false);
    }
  };

  const cargarSubcategorias = async (categoriaId) => {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    setCargandoSubcategorias(true);
    try {
      const response = await axiosInstance.get('/subcategorias', {
        params: {
          inv_gru_cod: categoriaId,
          limit: 1000
        }
      });
      const subcategoriasRaw = extraerArray(response.data);
      const subcategoriasFormateadas = subcategoriasRaw.map((sub) => ({
        id: String(sub.inv_sub_gru_cod),
        nombre: sub.inv_sub_gru_nom
      }));
      setSubcategorias(subcategoriasFormateadas);
    } catch (error) {
      console.error('Error cargando subcategorías del dashboard de costos:', error);
    } finally {
      setCargandoSubcategorias(false);
    }
  };

  const construirArbolParams = (extras = {}) => {
    const params = new URLSearchParams();

    if (filtros.fecha_desde) {
      params.append('fecha_compra_desde', filtros.fecha_desde);
    }
    if (filtros.fecha_hasta) {
      params.append('fecha_compra_hasta', filtros.fecha_hasta);
    }
    if (arbolSoloConStock) {
      params.append('solo_con_stock', 'true');
    }

    Object.entries(extras).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    return params;
  };

  const cargarCategoriasArbol = async () => {
    setCargandoCategoriasArbol(true);
    setErrorCategoriasArbol('');
    try {
      const params = construirArbolParams();
      const response = await axiosInstance.get(
        `/compras/reportes/valorizado-arbol/categorias?${params.toString()}`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No se pudo cargar el consolidado por categorías');
      }

      setCategoriasArbol(response.data.data || []);
      setResumenArbol(response.data.resumen_global || null);
      setCategoriasExpandidas({});
      setSubcategoriasExpandidas({});
      setSubcategoriasPorCategoria({});
      setArticulosPorSubcategoria({});
    } catch (error) {
      console.error('Error cargando árbol de valorizado por categorías:', error);
      setCategoriasArbol([]);
      setResumenArbol(null);
      setErrorCategoriasArbol(error.message || 'No se pudo cargar el consolidado por categorías');
    } finally {
      setCargandoCategoriasArbol(false);
    }
  };

  const cargarSubcategoriasCategoria = async (invGruCod) => {
    setSubcategoriasPorCategoria((prev) => ({
      ...prev,
      [invGruCod]: {
        loading: true,
        error: '',
        data: prev[invGruCod]?.data || []
      }
    }));

    try {
      const params = construirArbolParams();
      const response = await axiosInstance.get(
        `/compras/reportes/valorizado-arbol/categorias/${invGruCod}/subcategorias?${params.toString()}`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No se pudo cargar subcategorías');
      }

      setSubcategoriasPorCategoria((prev) => ({
        ...prev,
        [invGruCod]: {
          loading: false,
          error: '',
          data: response.data.data || []
        }
      }));
    } catch (error) {
      console.error(`Error cargando subcategorías de categoría ${invGruCod}:`, error);
      setSubcategoriasPorCategoria((prev) => ({
        ...prev,
        [invGruCod]: {
          loading: false,
          error: error.message || 'No se pudo cargar subcategorías',
          data: []
        }
      }));
    }
  };

  const cargarArticulosSubcategoria = async (invSubGruCod, append = false) => {
    const estadoActual = articulosPorSubcategoria[invSubGruCod];
    const offset = append ? estadoActual?.offset || 0 : 0;
    const limit = 50;

    setArticulosPorSubcategoria((prev) => ({
      ...prev,
      [invSubGruCod]: {
        loading: true,
        error: '',
        data: prev[invSubGruCod]?.data || [],
        offset,
        hasMore: prev[invSubGruCod]?.hasMore ?? false
      }
    }));

    try {
      const params = construirArbolParams({ limit, offset });
      const response = await axiosInstance.get(
        `/compras/reportes/valorizado-arbol/subcategorias/${invSubGruCod}/articulos?${params.toString()}`
      );

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'No se pudo cargar artículos');
      }

      const articulosNuevos = response.data?.data?.articulos || [];
      const totalRegistros = response.data?.data?.total_registros || 0;
      const siguienteOffset = offset + articulosNuevos.length;

      setArticulosPorSubcategoria((prev) => {
        const articulosPrevios = append ? (prev[invSubGruCod]?.data || []) : [];
        const acumulado = [...articulosPrevios, ...articulosNuevos];
        return {
          ...prev,
          [invSubGruCod]: {
            loading: false,
            error: '',
            data: acumulado,
            offset: siguienteOffset,
            hasMore: siguienteOffset < totalRegistros,
            totalRegistros
          }
        };
      });
    } catch (error) {
      console.error(`Error cargando artículos de subcategoría ${invSubGruCod}:`, error);
      setArticulosPorSubcategoria((prev) => ({
        ...prev,
        [invSubGruCod]: {
          loading: false,
          error: error.message || 'No se pudo cargar artículos',
          data: prev[invSubGruCod]?.data || [],
          offset: prev[invSubGruCod]?.offset || 0,
          hasMore: prev[invSubGruCod]?.hasMore || false,
          totalRegistros: prev[invSubGruCod]?.totalRegistros || 0
        }
      }));
    }
  };

  const toggleCategoriaArbol = (invGruCod) => {
    setCategoriasExpandidas((prev) => {
      const abierta = !!prev[invGruCod];
      const siguiente = { ...prev, [invGruCod]: !abierta };

      if (!abierta && !subcategoriasPorCategoria[invGruCod]) {
        cargarSubcategoriasCategoria(invGruCod);
      }

      return siguiente;
    });
  };

  const toggleSubcategoriaArbol = (invSubGruCod) => {
    setSubcategoriasExpandidas((prev) => {
      const abierta = !!prev[invSubGruCod];
      const siguiente = { ...prev, [invSubGruCod]: !abierta };

      if (!abierta && !articulosPorSubcategoria[invSubGruCod]) {
        cargarArticulosSubcategoria(invSubGruCod, false);
      }

      return siguiente;
    });
  };

  const handleFiltroInputChange = (campo, valor) => {
    setFiltroUI((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSeleccionCategoria = (categoriaId) => {
    setFiltroUI((prev) => ({
      ...prev,
      categoria: categoriaId,
      subcategoria: ''
    }));
  };

  const handleAplicarFiltros = () => {
    actualizarFiltros({
      fecha_desde: filtroUI.fecha_desde || null,
      fecha_hasta: filtroUI.fecha_hasta || null,
      inv_sub_gru_cod: filtroUI.subcategoria ? Number(filtroUI.subcategoria) : null,
      solo_con_existencia: filtroUI.solo_con_existencia
    });
    setMostrarTodosInventarioMuerto(false);
    setMostrarTodosTipoPareto(false);
    setTipoParetoActivo(null);
    setProductosTipoPareto([]);
    setErrorTipoPareto('');
  };

  const handleLimpiarFiltros = () => {
    setFiltroUI({
      categoria: '',
      subcategoria: '',
      fecha_desde: '',
      fecha_hasta: '',
      solo_con_existencia: true
    });
    setSubcategorias([]);
    actualizarFiltros({
      fecha_desde: null,
      fecha_hasta: null,
      inv_sub_gru_cod: null,
      solo_con_existencia: true
    });
    setMostrarTodosInventarioMuerto(false);
    setMostrarTodosTipoPareto(false);
    setTipoParetoActivo(null);
    setProductosTipoPareto([]);
    setErrorTipoPareto('');
  };

  const abrirListadoPareto = async (tipo) => {
    setTipoParetoActivo(tipo);
    setMostrarTodosTipoPareto(false);
    setCargandoTipoPareto(true);
    setErrorTipoPareto('');

    try {
      const params = new URLSearchParams();
      params.append('limit', '1000');
      params.append('clasificacion_abc', tipo);

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

      if (response.data?.success) {
        setProductosTipoPareto(response.data.data.articulos || []);
      } else {
        throw new Error(response.data?.message || 'No se pudo cargar el listado Pareto');
      }
    } catch (error) {
      console.error('Error cargando listado por clasificación Pareto:', error);
      setProductosTipoPareto([]);
      setErrorTipoPareto(error.message || 'No se pudo cargar el listado Pareto');
    } finally {
      setCargandoTipoPareto(false);
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  useEffect(() => {
    cargarSubcategorias(filtroUI.categoria);
  }, [filtroUI.categoria]);

  useEffect(() => {
    cargarCategoriasArbol();
  }, [filtros.fecha_desde, filtros.fecha_hasta, arbolSoloConStock]);

  const inventarioMuertoFiltrado = articulosValorados.filter(
    (articulo) =>
      articulo.dias_sin_venta &&
      articulo.dias_sin_venta > diasSinVenta &&
      articulo.tiene_stock &&
      articulo.valor_total > 0
  );
  const valorInventarioMuerto = inventarioMuertoFiltrado.reduce(
    (sum, articulo) => sum + articulo.valor_total,
    0
  );
  const valorTotalInventario = metricas?.valorTotal || 0;
  const porcentajeInventarioMuerto = valorTotalInventario > 0
    ? (valorInventarioMuerto / valorTotalInventario) * 100
    : 0;
  const articulosSinCostoGlobal = metricas?.articulosSinCostoCount || 0;
  const articulosSinCostoEnVista = articulosSinCosto.length;
  const mostrandoSubsetSinCosto = articulosSinCostoGlobal !== articulosSinCostoEnVista;
  const hayFiltrosContextuales =
    Boolean(filtros.inv_sub_gru_cod) || Boolean(filtros.fecha_desde) || Boolean(filtros.fecha_hasta);
  const tipoA = metricas?.clasificacionABC?.tipo_a || { articulos: 0, valor: 0, porcentaje: 0 };
  const tipoB = metricas?.clasificacionABC?.tipo_b || { articulos: 0, valor: 0, porcentaje: 0 };
  const tipoC = metricas?.clasificacionABC?.tipo_c || { articulos: 0, valor: 0, porcentaje: 0 };
  const totalArticulosABC = tipoA.articulos + tipoB.articulos + tipoC.articulos;
  const porcentajeArticulosTipoA = totalArticulosABC > 0 ? (tipoA.articulos / totalArticulosABC) * 100 : 0;

  const lecturaConcentracion = porcentajeArticulosTipoA <= 25
    ? 'Alta concentración saludable: pocos productos explican la mayor parte del valor.'
    : 'Concentración más distribuida: conviene revisar si hay productos de alto valor fuera del grupo A.';

  const lecturaInventarioMuerto = porcentajeInventarioMuerto >= 15
    ? 'Alerta alta: el capital inmovilizado está afectando caja y rotación.'
    : porcentajeInventarioMuerto >= 8
      ? 'Alerta moderada: hay espacio para mejorar la rotación del inventario.'
      : 'Nivel controlado: el capital inmovilizado está en un rango manejable.';

  const accionPrioritaria = tipoA.articulos > 0
    ? `Prioridad operativa: proteger disponibilidad y costo de los ${formatNumber(tipoA.articulos)} productos Tipo A.`
    : 'No hay productos clasificados como Tipo A con los filtros actuales.';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#f58ea3] border-t-transparent"></div>
          <p className="mt-4 text-[#64748b] font-medium">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl border border-[#fee2e2] shadow-sm">
          <div className="text-[#ef4444] text-5xl mb-4">⚠</div>
          <h2 className="text-xl font-bold text-[#0f172a] mb-2">Error al cargar datos</h2>
          <p className="text-[#64748b] mb-4">No se pudieron obtener los datos del sistema de costos</p>
          <button
            onClick={refrescarDatos}
            className="px-4 py-2 bg-[#f58ea3] text-white rounded-lg hover:bg-[#e25872] transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metricas) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
                Control de Costos e Inventario
              </h1>
              <p className="text-[#64748b] mt-1">
                Análisis financiero y clasificación ABC (Pareto)
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Filtro de días sin venta */}
              <div className="flex items-center gap-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg px-3 py-2">
                <label className="text-sm text-[#64748b] font-medium whitespace-nowrap">
                  Días sin venta:
                </label>
                <select
                  value={diasSinVenta}
                  onChange={(e) => setDiasSinVenta(Number(e.target.value))}
                  className="text-sm text-[#0f172a] font-medium bg-transparent border-none outline-none cursor-pointer"
                >
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                  <option value={120}>120 días</option>
                  <option value={180}>180 días</option>
                  <option value={365}>1 año</option>
                </select>
              </div>

              <button
                onClick={refrescarDatos}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-all shadow-sm hover:shadow"
              >
                <svg className="w-5 h-5 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-[#475569] font-medium">Actualizar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros Globales */}
        <div className="mb-6 bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="xl:col-span-1">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Categoría
              </label>
              <select
                value={filtroUI.categoria}
                onChange={(e) => handleSeleccionCategoria(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)] bg-white text-sm text-[#0f172a]"
              >
                <option value="">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              {cargandoCategorias && (
                <p className="text-xs text-[#94a3b8] mt-1">Cargando categorías...</p>
              )}
            </div>

            <div className="xl:col-span-1">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Subcategoría
              </label>
              <select
                value={filtroUI.subcategoria}
                onChange={(e) => handleFiltroInputChange('subcategoria', e.target.value)}
                disabled={!filtroUI.categoria || cargandoSubcategorias}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)] bg-white text-sm text-[#0f172a] disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
              >
                <option value="">Todas</option>
                {subcategorias.map((subcategoria) => (
                  <option key={subcategoria.id} value={subcategoria.id}>
                    {subcategoria.nombre}
                  </option>
                ))}
              </select>
              {cargandoSubcategorias && (
                <p className="text-xs text-[#94a3b8] mt-1">Cargando subcategorías...</p>
              )}
            </div>

            <div className="xl:col-span-1">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Compra desde
              </label>
              <input
                type="date"
                value={filtroUI.fecha_desde}
                onChange={(e) => handleFiltroInputChange('fecha_desde', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)] bg-white text-sm text-[#0f172a]"
              />
            </div>

            <div className="xl:col-span-1">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                Compra hasta
              </label>
              <input
                type="date"
                value={filtroUI.fecha_hasta}
                onChange={(e) => handleFiltroInputChange('fecha_hasta', e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)] bg-white text-sm text-[#0f172a]"
              />
            </div>

            <div className="xl:col-span-1 flex items-center mt-6">
              <label className="inline-flex items-center gap-2 text-sm text-[#475569] font-medium">
                <input
                  type="checkbox"
                  checked={filtroUI.solo_con_existencia}
                  onChange={(e) => handleFiltroInputChange('solo_con_existencia', e.target.checked)}
                  className="w-4 h-4 accent-[#f58ea3]"
                />
                Solo sin costo con stock
              </label>
            </div>

            <div className="xl:col-span-1 flex items-center gap-2 mt-6">
              <button
                onClick={handleAplicarFiltros}
                className="px-4 py-2 bg-[#f58ea3] text-white rounded-lg hover:bg-[#e25872] transition-colors text-sm font-medium"
              >
                Aplicar
              </button>
              <button
                onClick={handleLimpiarFiltros}
                className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
              >
                Limpiar
              </button>
            </div>
          </div>

          <p className="text-xs text-[#94a3b8] mt-3">
            El backend filtra por subcategoría y fechas; categoría se usa para facilitar la selección.
          </p>
        </div>

        {/* Guia inteligente Pareto */}
        <div className="mb-6 bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Guía inteligente: cómo leer Pareto</h3>
              <p className="text-xs text-[#64748b] mt-1">
                Explicación rápida y accionable basada en tus números actuales.
              </p>
            </div>
            <button
              onClick={() => setMostrarGuiaPareto((prev) => !prev)}
              className="px-3 py-1.5 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-xs font-medium text-[#475569]"
            >
              {mostrarGuiaPareto ? 'Ocultar guía' : 'Ver guía'}
            </button>
          </div>

          {mostrarGuiaPareto && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-[#fafafa] p-3">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Cómo funciona</p>
                <p className="text-sm text-[#0f172a]">
                  Tipo A concentra la mayor parte del valor, Tipo B representa impacto medio y Tipo C bajo impacto.
                  El objetivo es enfocar gestión en A, optimizar B y racionalizar C.
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-[#fafafa] p-3">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Lectura de tu negocio</p>
                <p className="text-sm text-[#0f172a]">{lecturaConcentracion}</p>
                <p className="text-xs text-[#64748b] mt-2">
                  Tipo A: {formatNumber(tipoA.articulos)} productos ({formatPercent(porcentajeArticulosTipoA)} del total)
                  y {formatCurrency(tipoA.valor)} del valor.
                </p>
              </div>

              <div className="rounded-lg border border-[rgba(15,23,42,0.08)] bg-[#fafafa] p-3">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Impacto y acción</p>
                <p className="text-sm text-[#0f172a]">{lecturaInventarioMuerto}</p>
                <p className="text-xs text-[#64748b] mt-2">{accionPrioritaria}</p>
                <p className="text-xs text-[#64748b] mt-1">
                  Tipo C: {formatNumber(tipoC.articulos)} productos con {formatCurrency(tipoC.valor)} de valor total.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Árbol dinámico de valorizado */}
        <div className="mb-6 bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">Consolidado valorizado por categoría</h3>
              <p className="text-xs text-[#64748b] mt-1">
                Árbol dinámico para desglosar categoría → subcategoría → artículos.
              </p>
              {resumenArbol && (
                <p className="text-xs text-[#94a3b8] mt-1">
                  Total global: {formatCurrency(resumenArbol.valor_total_inventario || 0)} ·
                  {` ${formatNumber(resumenArbol.total_articulos || 0)} artículos`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 text-xs text-[#475569] font-medium">
                <input
                  type="checkbox"
                  checked={arbolSoloConStock}
                  onChange={(e) => setArbolSoloConStock(e.target.checked)}
                  className="w-4 h-4 accent-[#f58ea3]"
                />
                Solo con stock
              </label>
              <button
                onClick={cargarCategoriasArbol}
                className="px-3 py-1.5 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-xs font-medium text-[#475569]"
              >
                Actualizar árbol
              </button>
            </div>
          </div>

          {cargandoCategoriasArbol ? (
            <div className="rounded-lg border border-dashed border-[rgba(15,23,42,0.18)] bg-[#fafafa] px-4 py-5 text-sm text-[#64748b]">
              Cargando consolidado por categoría...
            </div>
          ) : errorCategoriasArbol ? (
            <div className="rounded-lg border border-dashed border-[#ef4444]/40 bg-[#fff5f5] px-4 py-5 text-sm text-[#b91c1c]">
              {errorCategoriasArbol}
            </div>
          ) : categoriasArbol.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[rgba(15,23,42,0.18)] bg-[#fafafa] px-4 py-5 text-sm text-[#64748b]">
              No hay categorías valorizadas con los filtros actuales.
            </div>
          ) : (
            <div className="space-y-2">
              {categoriasArbol.map((categoria) => {
                const categoriaCod = String(categoria.inv_gru_cod);
                const categoriaAbierta = !!categoriasExpandidas[categoriaCod];
                const estadoSubcategorias = subcategoriasPorCategoria[categoriaCod];
                const subcategorias = estadoSubcategorias?.data || [];

                return (
                  <div key={categoriaCod} className="border border-[rgba(15,23,42,0.08)] rounded-lg bg-white">
                    <button
                      onClick={() => toggleCategoriaArbol(categoriaCod)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#fafafa] transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-[#64748b]">
                          {categoriaAbierta ? '▼' : '▶'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0f172a] truncate">{categoria.categoria_nombre}</p>
                          <p className="text-xs text-[#64748b]">
                            {formatNumber(categoria.total_articulos)} artículos · {formatCurrency(categoria.valor_total)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-[#475569] tabular-nums">
                        {formatPercent(categoria.porcentaje_sobre_total || 0)}
                      </p>
                    </button>

                    {categoriaAbierta && (
                      <div className="px-4 pb-4 border-t border-[rgba(15,23,42,0.08)]">
                        {estadoSubcategorias?.loading ? (
                          <p className="text-sm text-[#64748b] py-3">Cargando subcategorías...</p>
                        ) : estadoSubcategorias?.error ? (
                          <p className="text-sm text-[#b91c1c] py-3">{estadoSubcategorias.error}</p>
                        ) : subcategorias.length === 0 ? (
                          <p className="text-sm text-[#64748b] py-3">Sin subcategorías valorizadas.</p>
                        ) : (
                          <div className="space-y-2 mt-3">
                            {subcategorias.map((subcategoria) => {
                              const subCod = String(subcategoria.inv_sub_gru_cod);
                              const subAbierta = !!subcategoriasExpandidas[subCod];
                              const estadoArticulos = articulosPorSubcategoria[subCod];
                              const articulos = estadoArticulos?.data || [];

                              return (
                                <div key={subCod} className="border border-[rgba(15,23,42,0.08)] rounded-lg bg-[#fafafa]">
                                  <button
                                    onClick={() => toggleSubcategoriaArbol(subCod)}
                                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white transition-colors rounded-lg"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="text-xs text-[#64748b]">
                                        {subAbierta ? '▼' : '▶'}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-[#0f172a] truncate">
                                          {subcategoria.subcategoria_nombre}
                                        </p>
                                        <p className="text-xs text-[#64748b]">
                                          {formatNumber(subcategoria.total_articulos)} artículos · {formatCurrency(subcategoria.valor_total)}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-semibold text-[#475569] tabular-nums">
                                        {formatPercent(subcategoria.porcentaje_sobre_categoria || 0)} categoría
                                      </p>
                                      <p className="text-[11px] text-[#94a3b8] tabular-nums">
                                        {formatPercent(subcategoria.porcentaje_sobre_total || 0)} total
                                      </p>
                                    </div>
                                  </button>

                                  {subAbierta && (
                                    <div className="px-3 pb-3 border-t border-[rgba(15,23,42,0.08)]">
                                      {estadoArticulos?.loading ? (
                                        <p className="text-sm text-[#64748b] py-3">Cargando artículos...</p>
                                      ) : estadoArticulos?.error ? (
                                        <p className="text-sm text-[#b91c1c] py-3">{estadoArticulos.error}</p>
                                      ) : articulos.length === 0 ? (
                                        <p className="text-sm text-[#64748b] py-3">Sin artículos para esta subcategoría.</p>
                                      ) : (
                                        <>
                                          <div className="overflow-x-auto mt-3">
                                            <table className="w-full text-sm">
                                              <thead>
                                                <tr className="border-b border-[rgba(15,23,42,0.08)]">
                                                  <th className="text-left py-2 px-2 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                                    Producto
                                                  </th>
                                                  <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                                    Existencia
                                                  </th>
                                                  <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                                    Costo
                                                  </th>
                                                  <th className="text-right py-2 px-2 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                                    Valor
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                                                {articulos.map((articulo) => (
                                                  <tr key={articulo.art_sec} className="hover:bg-white transition-colors">
                                                    <td className="py-2 px-2">
                                                      <p className="text-sm font-medium text-[#0f172a]">{articulo.art_nom}</p>
                                                      <p className="text-xs text-[#64748b]">{articulo.art_cod}</p>
                                                    </td>
                                                    <td className="py-2 px-2 text-right tabular-nums text-[#475569]">
                                                      {formatNumber(articulo.existencia)}
                                                    </td>
                                                    <td className="py-2 px-2 text-right tabular-nums text-[#475569]">
                                                      {formatCurrency(articulo.costo_unitario)}
                                                    </td>
                                                    <td className="py-2 px-2 text-right tabular-nums font-semibold text-[#0f172a]">
                                                      {formatCurrency(articulo.valor_total)}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                          {estadoArticulos?.hasMore && (
                                            <div className="mt-3 flex justify-end">
                                              <button
                                                onClick={() => cargarArticulosSubcategoria(subCod, true)}
                                                className="px-3 py-1.5 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-xs font-medium text-[#475569]"
                                              >
                                                Cargar más
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alert Bar - Artículos sin costo */}
        {metricas.articulosSinCostoCount > 0 && (
          <div className="mb-6">
            <div className="bg-[#fef3c7] border border-[#f59e0b] rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#f59e0b] rounded-full flex items-center justify-center text-white text-sm font-bold">
                !
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#92400e] mb-1">
                  {formatNumber(articulosSinCostoGlobal)} artículos sin costo asignado (global)
                </h3>
                {mostrandoSubsetSinCosto ? (
                  <p className="text-sm text-[#92400e]/80">
                    En esta vista hay {formatNumber(articulosSinCostoEnVista)} artículos con los filtros actuales
                    {filtros.solo_con_existencia ? ' y solo con stock' : ''}. El total global incluye artículos
                    con y sin existencia.
                  </p>
                ) : (
                  <p className="text-sm text-[#92400e]/80">
                    Estos productos no se incluyen en el valorizado del inventario. El total global incluye
                    artículos con y sin existencia.
                  </p>
                )}
              </div>
              <button
                onClick={() => setMostrarSinCosto(!mostrarSinCosto)}
                className="flex-shrink-0 px-4 py-2 bg-white border border-[#f59e0b] rounded-lg hover:bg-[#fef3c7] transition-colors text-sm font-medium text-[#92400e]"
              >
                {mostrarSinCosto ? 'Ocultar' : 'Ver detalles'}
              </button>
            </div>

            {/* Tabla de Artículos Sin Costo - Justo debajo de la alerta */}
            {mostrarSinCosto && (
              <div className="mt-4 bg-white/80 backdrop-blur-md border border-[#f59e0b] rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">
                      Artículos Sin Costo Asignado
                    </h3>
                    <p className="text-sm text-[#64748b] mt-1">
                      Mostrando {articulosSinCostoEnVista} productos
                      {filtros.solo_con_existencia ? ' con existencia ' : ' '}
                      en esta vista
                      {mostrandoSubsetSinCosto ? ` (total global: ${formatNumber(articulosSinCostoGlobal)})` : ''}
                      {hayFiltrosContextuales ? ' con filtros aplicados' : ''}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-[#fef3c7] border border-[#f59e0b] rounded-lg hover:bg-[#fde68a] transition-colors text-sm font-medium text-[#92400e]">
                    Exportar
                  </button>
                </div>
                {articulosSinCosto.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[rgba(15,23,42,0.08)]">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Producto
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Existencia
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Precio Mayor
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Costo Sugerido
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                        {articulosSinCosto.slice(0, 20).map((producto) => (
                          <tr key={producto.art_sec} className="hover:bg-[#fafafa] transition-colors">
                            <td className="py-3 px-4">
                              <p className="font-medium text-[#0f172a]">{producto.art_nom}</p>
                              <p className="text-xs text-[#64748b]">{producto.art_cod}</p>
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-[#475569]">
                              {formatNumber(producto.existencia)}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums text-[#475569]">
                              {formatCurrency(producto.precio_mayor)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold tabular-nums text-[#f59e0b]">
                              {formatCurrency(producto.costo_sugerido)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-[rgba(15,23,42,0.18)] bg-[#fafafa] px-4 py-5 text-sm text-[#64748b]">
                    No hay artículos para mostrar con los filtros actuales.
                    {filtros.solo_con_existencia
                      ? ' Prueba desactivar "Solo sin costo con stock" y aplicar filtros.'
                      : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hero Metrics - ABC Financial Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Valor Total del Inventario */}
          <div className="lg:col-span-2 bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-1">
                  Valor Total del Inventario
                </h3>
                <p className="text-4xl font-bold text-[#0f172a] tracking-tight tabular-nums">
                  {formatCurrency(metricas.valorTotal)}
                </p>
                <p className="text-sm text-[#64748b] mt-2">
                  {formatNumber(metricas.totalArticulos)} artículos con costo asignado
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-[#fce7f3] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#f58ea3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Mini Pareto Chart */}
            <div className="border-t border-[rgba(15,23,42,0.08)] pt-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#ff6384]"></div>
                  <span className="text-[#64748b] font-medium">Tipo A (80%)</span>
                  <span className="text-[#0f172a] font-bold tabular-nums">
                    {formatCurrency(metricas.clasificacionABC.tipo_a.valor)}
                  </span>
                </div>
                <span className="text-[#94a3b8]">
                  {metricas.clasificacionABC.tipo_a.articulos} productos
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#36a2eb]"></div>
                  <span className="text-[#64748b] font-medium">Tipo B (15%)</span>
                  <span className="text-[#0f172a] font-bold tabular-nums">
                    {formatCurrency(metricas.clasificacionABC.tipo_b.valor)}
                  </span>
                </div>
                <span className="text-[#94a3b8]">
                  {metricas.clasificacionABC.tipo_b.articulos} productos
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#ffce56]"></div>
                  <span className="text-[#64748b] font-medium">Tipo C (5%)</span>
                  <span className="text-[#0f172a] font-bold tabular-nums">
                    {formatCurrency(metricas.clasificacionABC.tipo_c.valor)}
                  </span>
                </div>
                <span className="text-[#94a3b8]">
                  {metricas.clasificacionABC.tipo_c.articulos} productos
                </span>
              </div>
            </div>
          </div>

          {/* Inventario Muerto */}
          <div className="bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-[#64748b] uppercase tracking-wide mb-1">
                  Capital Inmovilizado
                </h3>
                <p className="text-2xl font-bold text-[#ef4444] tracking-tight tabular-nums">
                  {formatCurrency(valorInventarioMuerto)}
                </p>
                <p className="text-sm text-[#64748b] mt-2">
                  {inventarioMuertoFiltrado.length} productos sin venta {'>'} {diasSinVenta} días
                </p>
              </div>
              <div className="flex-shrink-0 w-12 h-12 bg-[#fee2e2] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#ef4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>

            {/* Indicador de impacto */}
            <div className="border-t border-[rgba(15,23,42,0.08)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#64748b]">% del inventario</span>
                <span className="text-xs font-bold text-[#ef4444] tabular-nums">
                  {formatPercent(porcentajeInventarioMuerto)}
                </span>
              </div>
              <div className="mt-2 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ef4444] rounded-full transition-all"
                  style={{
                    width: `${porcentajeInventarioMuerto}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Clasificación ABC Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ABCCard
            tipo="A"
            label="Productos Críticos"
            descripcion="Concentran el 80% del valor"
            cantidad={metricas.clasificacionABC.tipo_a.articulos}
            valor={metricas.clasificacionABC.tipo_a.valor}
            porcentaje={metricas.clasificacionABC.tipo_a.porcentaje}
            color="#ff6384"
            colorBg="#ffe4e6"
            activo={tipoParetoActivo === 'A'}
            onVerProductos={() => abrirListadoPareto('A')}
          />
          <ABCCard
            tipo="B"
            label="Productos Importantes"
            descripcion="Representan el 15% del valor"
            cantidad={metricas.clasificacionABC.tipo_b.articulos}
            valor={metricas.clasificacionABC.tipo_b.valor}
            porcentaje={metricas.clasificacionABC.tipo_b.porcentaje}
            color="#36a2eb"
            colorBg="#dbeafe"
            activo={tipoParetoActivo === 'B'}
            onVerProductos={() => abrirListadoPareto('B')}
          />
          <ABCCard
            tipo="C"
            label="Bajo Impacto"
            descripcion="Representan el 5% del valor"
            cantidad={metricas.clasificacionABC.tipo_c.articulos}
            valor={metricas.clasificacionABC.tipo_c.valor}
            porcentaje={metricas.clasificacionABC.tipo_c.porcentaje}
            color="#ffce56"
            colorBg="#fef3c7"
            activo={tipoParetoActivo === 'C'}
            onVerProductos={() => abrirListadoPareto('C')}
          />
        </div>

        {/* Listado por clasificación Pareto */}
        {tipoParetoActivo && (
          <div className="bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm mb-6">
            {(() => {
              const productosTipo = [...productosTipoPareto].sort((a, b) => b.valor_total - a.valor_total);
              const totalValorTipo = productosTipo.reduce((sum, articulo) => sum + articulo.valor_total, 0);
              const totalTipoResumen = tipoParetoActivo === 'A'
                ? metricas.clasificacionABC.tipo_a.articulos
                : tipoParetoActivo === 'B'
                  ? metricas.clasificacionABC.tipo_b.articulos
                  : metricas.clasificacionABC.tipo_c.articulos;
              const tituloTipo = tipoParetoActivo === 'A'
                ? 'Productos Tipo A (Críticos)'
                : tipoParetoActivo === 'B'
                  ? 'Productos Tipo B (Importantes)'
                  : 'Productos Tipo C (Bajo impacto)';

              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#0f172a]">{tituloTipo}</h3>
                      <p className="text-sm text-[#64748b] mt-1">
                        Mostrando {formatNumber(productosTipo.length)} de {formatNumber(totalTipoResumen)} productos · {formatCurrency(totalValorTipo)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!mostrarTodosTipoPareto && productosTipo.length > 20 && (
                        <button
                          onClick={() => setMostrarTodosTipoPareto(true)}
                          className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
                        >
                          Ver todos ({productosTipo.length})
                        </button>
                      )}
                      {mostrarTodosTipoPareto && (
                        <button
                          onClick={() => setMostrarTodosTipoPareto(false)}
                          className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
                        >
                          Ver menos
                        </button>
                      )}
                      <button
                        onClick={() => setTipoParetoActivo(null)}
                        className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>

                  {cargandoTipoPareto ? (
                    <div className="rounded-lg border border-dashed border-[rgba(15,23,42,0.18)] bg-[#fafafa] px-4 py-5 text-sm text-[#64748b]">
                      Cargando productos Tipo {tipoParetoActivo}...
                    </div>
                  ) : errorTipoPareto ? (
                    <div className="rounded-lg border border-dashed border-[#ef4444]/40 bg-[#fff5f5] px-4 py-5 text-sm text-[#b91c1c]">
                      {errorTipoPareto}
                    </div>
                  ) : productosTipo.length > 0 ? (
                    <div className="overflow-x-auto" style={{ maxHeight: mostrarTodosTipoPareto ? '600px' : 'auto', overflowY: mostrarTodosTipoPareto ? 'auto' : 'visible' }}>
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-[rgba(15,23,42,0.08)]">
                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                              Producto
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                              Existencia
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                              Costo Unitario
                            </th>
                            <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                              Valor Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                          {productosTipo
                            .slice(0, mostrarTodosTipoPareto ? productosTipo.length : 20)
                            .map((producto) => (
                              <tr key={producto.art_sec} className="hover:bg-[#fafafa] transition-colors">
                                <td className="py-3 px-4">
                                  <p className="font-medium text-[#0f172a]">{producto.art_nom}</p>
                                  <p className="text-xs text-[#64748b]">{producto.art_cod}</p>
                                </td>
                                <td className="py-3 px-4 text-right tabular-nums text-[#475569]">
                                  {formatNumber(producto.existencia)}
                                </td>
                                <td className="py-3 px-4 text-right tabular-nums text-[#475569]">
                                  {formatCurrency(producto.costo_unitario)}
                                </td>
                                <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0f172a]">
                                  {formatCurrency(producto.valor_total)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-[rgba(15,23,42,0.18)] bg-[#fafafa] px-4 py-5 text-sm text-[#64748b]">
                      No hay artículos de clasificación Tipo {tipoParetoActivo} con los filtros actuales.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Gráfico de Pareto */}
          <div className="bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">
              Distribución de Valor (Pareto 80-15-5)
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <Pie
                data={{
                  labels: [
                    `Tipo A - Críticos (${metricas.clasificacionABC.tipo_a.articulos})`,
                    `Tipo B - Importantes (${metricas.clasificacionABC.tipo_b.articulos})`,
                    `Tipo C - Bajo Impacto (${metricas.clasificacionABC.tipo_c.articulos})`
                  ],
                  datasets: [{
                    data: [
                      metricas.clasificacionABC.tipo_a.valor,
                      metricas.clasificacionABC.tipo_b.valor,
                      metricas.clasificacionABC.tipo_c.valor
                    ],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56'],
                    borderWidth: 0
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 15,
                        font: { size: 11 }
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const value = context.parsed;
                          const total = context.dataset.data.reduce((a, b) => a + b, 0);
                          const pct = ((value / total) * 100).toFixed(1);
                          return `Valor: ${formatCurrency(value)} (${pct}%)`;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Top 10 Productos por Valor */}
          <div className="bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">
              Top 10 Productos por Valor
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {metricas.top10Productos.map((producto, index) => (
                <div
                  key={producto.art_sec}
                  className="flex items-center gap-3 p-3 bg-[#fafafa] rounded-lg border border-[rgba(15,23,42,0.08)] hover:border-[rgba(15,23,42,0.12)] transition-all"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[rgba(15,23,42,0.08)]">
                    <span className="text-sm font-bold text-[#64748b]">{index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">
                      {producto.art_nom}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {producto.art_cod} · {producto.existencia} unidades
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-[#0f172a] tabular-nums">
                      {formatCurrency(producto.valor_total)}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-1"
                        style={{
                          backgroundColor:
                            producto.clasificacion_abc === 'A'
                              ? '#ff6384'
                              : producto.clasificacion_abc === 'B'
                              ? '#36a2eb'
                              : '#ffce56'
                        }}
                      ></span>
                      Tipo {producto.clasificacion_abc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventario Muerto Table */}
        {(() => {
          return inventarioMuertoFiltrado.length > 0 && (
            <div className="bg-white/80 backdrop-blur-md border border-[rgba(15,23,42,0.12)] rounded-xl p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#0f172a]">
                    Inventario Muerto (Sin ventas {'>'} {diasSinVenta} días)
                  </h3>
                  <p className="text-sm text-[#64748b] mt-1">
                    {inventarioMuertoFiltrado.length} productos · {formatCurrency(valorInventarioMuerto)} inmovilizados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!mostrarTodosInventarioMuerto && inventarioMuertoFiltrado.length > 10 && (
                    <button
                      onClick={() => setMostrarTodosInventarioMuerto(true)}
                      className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
                    >
                      Ver todos ({inventarioMuertoFiltrado.length})
                    </button>
                  )}
                  {mostrarTodosInventarioMuerto && (
                    <button
                      onClick={() => setMostrarTodosInventarioMuerto(false)}
                      className="px-4 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-sm font-medium text-[#475569]"
                    >
                      Ver menos
                    </button>
                  )}
                  <button className="px-4 py-2 bg-[#fef3c7] border border-[#f59e0b] rounded-lg hover:bg-[#fde68a] transition-colors text-sm font-medium text-[#92400e]">
                    Exportar
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto" style={{ maxHeight: mostrarTodosInventarioMuerto ? '600px' : 'auto', overflowY: mostrarTodosInventarioMuerto ? 'auto' : 'visible' }}>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-[rgba(15,23,42,0.08)]">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                        Producto
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                        Existencia
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                        Valor Total
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                        Días sin Venta
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide bg-white">
                        Clasificación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                    {inventarioMuertoFiltrado
                      .sort((a, b) => b.valor_total - a.valor_total)
                      .slice(0, mostrarTodosInventarioMuerto ? inventarioMuertoFiltrado.length : 10)
                      .map((producto) => (
                        <tr key={producto.art_sec} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-medium text-[#0f172a]">{producto.art_nom}</p>
                            <p className="text-xs text-[#64748b]">{producto.art_cod}</p>
                          </td>
                          <td className="py-3 px-4 text-right tabular-nums text-[#475569]">
                            {formatNumber(producto.existencia)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold tabular-nums text-[#0f172a]">
                            {formatCurrency(producto.valor_total)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fee2e2] text-[#ef4444]">
                              {producto.dias_sin_venta} días
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white"
                              style={{
                                backgroundColor:
                                  producto.clasificacion_abc === 'A'
                                    ? '#ff6384'
                                    : producto.clasificacion_abc === 'B'
                                    ? '#36a2eb'
                                    : '#ffce56'
                              }}
                            >
                              {producto.clasificacion_abc}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

/**
 * ABC Card Component
 * Signature component que combina métrica financiera con clasificación
 */
const ABCCard = ({ tipo, label, descripcion, cantidad, valor, porcentaje, color, colorBg, activo = false, onVerProductos }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className={`bg-white/80 backdrop-blur-md border rounded-xl p-6 shadow-sm hover:shadow-md transition-all ${activo ? 'border-[rgba(245,142,163,0.7)]' : 'border-[rgba(15,23,42,0.12)]'}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {tipo}
            </span>
            <h3 className="text-sm font-bold text-[#0f172a]">{label}</h3>
          </div>
          <p className="text-xs text-[#64748b]">{descripcion}</p>
        </div>
        <div
          className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: colorBg, color: color }}
        >
          {porcentaje}%
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs text-[#64748b] mb-1">Valor Total</p>
          <p className="text-2xl font-bold text-[#0f172a] tabular-nums">{formatCurrency(valor)}</p>
        </div>
        <div>
          <p className="text-xs text-[#64748b]">
            {cantidad.toLocaleString('es-CO')} productos
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[rgba(15,23,42,0.08)]">
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${porcentaje}%`, backgroundColor: color }}
          ></div>
        </div>
        <button
          onClick={onVerProductos}
          className="mt-3 w-full px-3 py-2 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.18)] transition-colors text-xs font-medium text-[#475569]"
        >
          Ver productos Tipo {tipo}
        </button>
      </div>
    </div>
  );
};

export default DashboardCostos;
