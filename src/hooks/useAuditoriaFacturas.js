import { useState, useCallback, useEffect } from 'react';
import auditoriaFacturasService from '../services/auditoriaFacturasService';

const useAuditoriaFacturas = (initialParams = {}) => {
    // Estado para el listado de facturas
    const [facturas, setFacturas] = useState([]);
    const [paginacion, setPaginacion] = useState({
        pagina_actual: 1,
        por_pagina: 50,
        total_registros: 0,
        total_paginas: 0,
        tiene_pagina_anterior: false,
        tiene_pagina_siguiente: false
    });

    // Estado para detalles y resumen por estado
    const [detalleFactura, setDetalleFactura] = useState(null);
    const [resumenEstados, setResumenEstados] = useState([]);

    // Parámetros de búsqueda activos (fecha/periodo)
    const [params, setParams] = useState({
        periodo: initialParams.periodo || 'ultimos_30_dias',
        fecha_inicio: initialParams.fecha_inicio || null,
        fecha_fin: initialParams.fecha_fin || null,
        pagina: initialParams.pagina || 1,
        por_pagina: initialParams.por_pagina || 50
    });

    // Estados de carga
    const [isLoadingListado, setIsLoadingListado] = useState(false);
    const [isLoadingDetalle, setIsLoadingDetalle] = useState(false);
    const [isLoadingResumen, setIsLoadingResumen] = useState(false);

    // Estados de error
    const [errorListado, setErrorListado] = useState(null);
    const [errorDetalle, setErrorDetalle] = useState(null);
    const [errorResumen, setErrorResumen] = useState(null);

    /**
     * Cargar listado de facturas basado en params actuales
     */
    const fetchListado = useCallback(async (customParams = null) => {
        setIsLoadingListado(true);
        setErrorListado(null);

        // Usar params provistos o los del estado
        const currentParams = customParams || params;

        try {
            const response = await auditoriaFacturasService.getListadoFacturas(currentParams);
            if (response.success) {
                setFacturas(response.data || []);
                setPaginacion(response.paginacion || {});
                // Update params state if customParams were provided to keep in sync
                if (customParams) {
                    setParams(prev => ({ ...prev, ...customParams }));
                }
            } else {
                throw new Error(response.message || 'Error cargando listado');
            }
        } catch (err) {
            setErrorListado(err.message || 'Error de conexión');
            setFacturas([]);
        } finally {
            setIsLoadingListado(false);
        }
    }, [params]);

    /**
     * Cambiar de página
     */
    const cambiarPagina = useCallback((nuevaPagina) => {
        if (nuevaPagina >= 1 && nuevaPagina <= paginacion.total_paginas) {
            setParams(prev => ({ ...prev, pagina: nuevaPagina }));
            fetchListado({ ...params, pagina: nuevaPagina });
        }
    }, [paginacion.total_paginas, params, fetchListado]);

    /**
     * Cargar detalle de una factura
     */
    const fetchDetalle = useCallback(async (facSec) => {
        setIsLoadingDetalle(true);
        setErrorDetalle(null);
        setDetalleFactura(null);
        try {
            const response = await auditoriaFacturasService.getDetalleFactura(facSec);
            if (response.success) {
                setDetalleFactura(response.data);
            } else {
                throw new Error(response.message || 'Error cargando detalle');
            }
            return response.data;
        } catch (err) {
            setErrorDetalle(err.message || 'Error de conexión');
            return null;
        } finally {
            setIsLoadingDetalle(false);
        }
    }, []);

    /**
     * Cargar resumen por estado WooCommerce
     */
    const fetchResumenEstados = useCallback(async (customParams = null) => {
        setIsLoadingResumen(true);
        setErrorResumen(null);
        const currentParams = customParams || params;
        try {
            const response = await auditoriaFacturasService.getResumenPorEstado(currentParams);
            if (response.success) {
                setResumenEstados(response.data || []);
            } else {
                throw new Error(response.message || 'Error cargando resumen de estados');
            }
        } catch (err) {
            setErrorResumen(err.message || 'Error de conexión');
            setResumenEstados([]);
        } finally {
            setIsLoadingResumen(false);
        }
    }, [params]);

    /**
     * Actualizar filtros de fecha y recargar datos afectados
     */
    const actualizarFiltrosFecha = useCallback((periodo, fecha_inicio = null, fecha_fin = null) => {
        const nuevosParams = {
            ...params,
            periodo,
            fecha_inicio,
            fecha_fin,
            pagina: 1 // Reiniciar a página 1 cuando se cambia la fecha
        };
        setParams(nuevosParams);

        // Opcional: Auto-fetch cuando cambian filtros
        fetchListado(nuevosParams);
        fetchResumenEstados(nuevosParams);
    }, [params, fetchListado, fetchResumenEstados]);

    return {
        // Listado
        facturas,
        paginacion,
        isLoadingListado,
        errorListado,
        fetchListado,
        cambiarPagina,

        // Detalle
        detalleFactura,
        isLoadingDetalle,
        errorDetalle,
        fetchDetalle,

        // Resumen
        resumenEstados,
        isLoadingResumen,
        errorResumen,
        fetchResumenEstados,

        // Config global
        params,
        actualizarFiltrosFecha
    };
};

export default useAuditoriaFacturas;
