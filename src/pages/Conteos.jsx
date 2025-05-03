import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEye, FaEdit, FaTrash, FaBroom, FaBalanceScale } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import debounce from 'lodash/debounce';
import { formatDate, getCurrentDate } from '../utils/dateUtils';
import Swal from 'sweetalert2';

const Conteos = () => {
    const navigate = useNavigate();
    const today = getCurrentDate();

    // Función para obtener los filtros guardados
    const getInitialFilters = () => {
        const savedFilters = localStorage.getItem('conteosFilters');
        if (savedFilters) {
            return JSON.parse(savedFilters);
        }
        return {
            fechaDesde: today,
            fechaHasta: today,
            estado: 'TODOS',
            bodega: ''
        };
    };

    // Inicializar estados con los filtros guardados
    const [fechaDesde, setFechaDesde] = useState(getInitialFilters().fechaDesde);
    const [fechaHasta, setFechaHasta] = useState(getInitialFilters().fechaHasta);
    const [estado, setEstado] = useState(getInitialFilters().estado);
    const [bodega, setBodega] = useState(getInitialFilters().bodega);

    // Estados para datos y paginación
    const [conteos, setConteos] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const pageSize = 10;
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const fetchConteos = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/inventario-conteo`, {
                params: {
                    fechaDesde,
                    fechaHasta,
                    estado: estado === 'TODOS' ? '' : estado,
                    bodega,
                    PageNumber: page,
                    PageSize: pageSize,
                },
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                const newConteos = response.data.data;
                if (page === 1) {
                    setConteos(newConteos);
                } else {
                    setConteos(prev => [...prev, ...newConteos]);
                }
                setHasMore(newConteos.length >= pageSize);
                setPageNumber(page);
            }
        } catch (error) {
            console.error("Error al obtener conteos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para guardar filtros
    const saveFilters = useCallback(() => {
        const filters = {
            fechaDesde,
            fechaHasta,
            estado,
            bodega
        };
        localStorage.setItem('conteosFilters', JSON.stringify(filters));
    }, [fechaDesde, fechaHasta, estado, bodega]);

    // Guardar filtros cuando cambien
    useEffect(() => {
        saveFilters();
    }, [saveFilters]);

    // Debounce para la búsqueda al cambiar filtros
    const debouncedFetch = useCallback(debounce(() => {
        fetchConteos(1);
    }, 500), [fechaDesde, fechaHasta, estado, bodega]);

    // Efecto para re-buscar cuando cambian los filtros (debounced)
    useEffect(() => {
        setPageNumber(1);
        setHasMore(true);
        setConteos([]);
        debouncedFetch();
        return () => {
            debouncedFetch.cancel();
        };
    }, [fechaDesde, fechaHasta, estado, bodega]);

    // Función para limpiar filtros
    const handleClearFilters = () => {
        setFechaDesde(today);
        setFechaHasta(today);
        setEstado('TODOS');
        setBodega('');
        localStorage.removeItem('conteosFilters');
    };

    const handleViewDetail = (conteo) => {
        navigate(`/conteos/${conteo.id}`);
    };

    const handleEdit = (conteo) => {
        navigate(`/conteos/nuevo/${conteo.id}`);
    };

    const handleDelete = (conteo) => {
        // Implementar lógica de eliminación
        console.log("Eliminar conteo:", conteo.id);
    };

    const handleCuadrarInventario = async (conteo) => {
        try {
            // Mostrar confirmación
            const result = await Swal.fire({
                title: '¿Está seguro?',
                text: "Esta acción creará un ajuste de inventario dejando en 0 todos los artículos que no están en el conteo. ¿Desea continuar?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#f58ea3',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, cuadrar inventario',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;

            // Mostrar progreso
            Swal.fire({
                title: 'Cuadrando inventario...',
                html: 'Por favor espere mientras se procesa la información.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Obtener todos los artículos
            let page = 1;
            let hasMore = true;
            const detallesAjuste = [];

            while (hasMore) {
                const response = await axios.get(`${API_URL}/articulos`, {
                    params: {
                        PageNumber: page,
                        PageSize: 100
                    },
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });

                if (response.data.success) {
                    const articulos = response.data.data;

                    // Verificar cada artículo
                    for (const articulo of articulos) {
                        // Verificar si el artículo está en el detalle del conteo
                        const existeEnConteo = await axios.get(
                            `${API_URL}/inventario-conteo/${conteo.id}/detalle/verificar/${articulo.codigo}`,
                            {
                                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                            }
                        );

                        if (!existeEnConteo.data) {
                            // Obtener existencia actual
                            const existencia = await axios.get(
                                `${API_URL}/articulos/${articulo.codigo}/existencia`,
                                {
                                    params: { bodega: conteo.bodega },
                                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                                }
                            );

                            if (existencia.data.existencia > 0) {
                                detallesAjuste.push({
                                    articulo_codigo: articulo.codigo,
                                    cantidad_anterior: existencia.data.existencia,
                                    cantidad_nueva: 0,
                                    observacion: `Ajuste por cuadre de inventario - Conteo #${conteo.id}`
                                });
                            }
                        }
                    }

                    hasMore = articulos.length >= 100;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            // Crear el ajuste de inventario
            if (detallesAjuste.length > 0) {
                await axios.post(`${API_URL}/inventario-ajuste`, {
                    fecha: new Date().toISOString(),
                    bodega: conteo.bodega,
                    usuario: localStorage.getItem('user_pretty') || 'admin',
                    tipo: 'CUADRE_INVENTARIO',
                    detalles: detallesAjuste
                }, {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });

                Swal.fire({
                    icon: 'success',
                    title: 'Inventario Cuadrado',
                    text: `Se ha creado un ajuste de inventario con ${detallesAjuste.length} artículos.`,
                    confirmButtonColor: '#f58ea3'
                });
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No se requieren ajustes',
                    text: 'No se encontraron artículos que requieran ajuste.',
                    confirmButtonColor: '#f58ea3'
                });
            }
        } catch (error) {
            console.error('Error al cuadrar inventario:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Ocurrió un error al cuadrar el inventario.',
                confirmButtonColor: '#f58ea3'
            });
        }
    };

    const getEstadoColor = (estado) => {
        switch (estado.toUpperCase()) {
            case 'PENDIENTE':
                return 'bg-yellow-100 text-yellow-800';
            case 'COMPLETADO':
                return 'bg-green-100 text-green-800';
            case 'CANCELADO':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
            {/* Card de Header + Filtros */}
            <div className="bg-white rounded-xl shadow-lg mb-6 p-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                    <h1 className="text-2xl font-bold text-[#f58ea3] text-center sm:text-left">Gestión de Conteos</h1>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            onClick={handleClearFilters}
                            className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-3 rounded-lg flex items-center justify-center text-sm sm:text-base border border-[#f58ea3] transition-colors shadow-sm"
                            title="Limpiar Filtros"
                        >
                            <FaBroom className="text-[#f58ea3]" />
                        </button>
                        <button
                            className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm sm:text-base flex-grow transition-colors shadow-sm"
                            onClick={() => navigate('/conteos/nuevo')}
                        >
                            <FaPlus className="mr-2 text-white" /> Nuevo Conteo
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 bg-white rounded-xl">
                    <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Desde</label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                            className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                            className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                            value={estado}
                            onChange={e => setEstado(e.target.value)}
                            className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        >
                            <option value="TODOS">Todos</option>
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="COMPLETADO">Completado</option>
                            <option value="CANCELADO">Cancelado</option>
                        </select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Bodega</label>
                        <input
                            type="text"
                            value={bodega}
                            onChange={e => setBodega(e.target.value)}
                            placeholder="Ingrese bodega"
                            className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Vista de Lista/Tabla */}
            <div>
                {/* Vista Móvil (Tarjetas) */}
                <div className="block sm:hidden space-y-3">
                    {isLoading && pageNumber === 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
                    {!isLoading && conteos.length === 0 && pageNumber === 1 && (
                        <p className="text-center py-4 text-gray-500">No hay conteos para mostrar.</p>
                    )}
                    {conteos.map((conteo) => (
                        <div key={conteo.id} className="bg-white p-3 rounded-xl shadow border border-gray-200 hover:border-[#f58ea3] transition-colors">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm">#{conteo.id}</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEstadoColor(conteo.estado)}`}>
                                            {conteo.estado}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-1">Fecha: {formatDate(conteo.fecha)}</p>
                                    <p className="text-xs text-gray-600 mb-1">Bodega: {conteo.bodega}</p>
                                    <p className="text-xs text-gray-600 mb-1">Usuario: {conteo.usuario}</p>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                        <div>
                                            <span className="text-gray-500 block">Total Artículos</span>
                                            <span className="font-medium text-[#f58ea3]">{conteo.total_articulos}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 block">Diferencia Total</span>
                                            <span className="font-medium text-[#f58ea3]">{conteo.diferencia_total}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-1 flex-shrink-0">
                                    <button onClick={() => handleViewDetail(conteo)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Ver Detalle">
                                        <FaEye className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleEdit(conteo)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Editar">
                                        <FaEdit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleCuadrarInventario(conteo)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Cuadrar Inventario">
                                        <FaBalanceScale className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(conteo)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Eliminar">
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && pageNumber > 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
                </div>

                {/* Vista Desktop (Tabla) */}
                <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#fff5f7]">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Bodega</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Artículos</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Diferencia Total</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && pageNumber === 1 && (
                                <tr><td colSpan="8" className="text-center py-4"><LoadingSpinner /></td></tr>
                            )}
                            {!isLoading && conteos.length === 0 && pageNumber === 1 && (
                                <tr><td colSpan="8" className="text-center py-4 text-gray-500">No hay conteos para mostrar.</td></tr>
                            )}
                            {conteos.map((conteo) => (
                                <tr key={conteo.id} className="hover:bg-[#fff5f7] transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">#{conteo.id}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{formatDate(conteo.fecha)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{conteo.bodega}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{conteo.usuario}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getEstadoColor(conteo.estado)}`}>
                                            {conteo.estado}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{conteo.total_articulos}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{conteo.diferencia_total}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => handleViewDetail(conteo)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Ver Detalle">
                                            <FaEye />
                                        </button>
                                        <button onClick={() => handleEdit(conteo)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleCuadrarInventario(conteo)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Cuadrar Inventario">
                                            <FaBalanceScale />
                                        </button>
                                        <button onClick={() => handleDelete(conteo)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] transition-colors"
                                            title="Eliminar">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {isLoading && pageNumber > 1 && (
                                <tr><td colSpan="8" className="text-center py-4"><LoadingSpinner /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Botón Cargar Más */}
            {hasMore && !isLoading && (
                <div className="mt-4 text-center">
                    <button
                        onClick={() => fetchConteos(pageNumber + 1)}
                        className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded-lg w-full sm:w-auto text-sm sm:text-base border border-[#f58ea3] transition-colors shadow-sm"
                    >
                        Cargar Más Conteos
                    </button>
                </div>
            )}
        </div>
    );
};

export default Conteos; 