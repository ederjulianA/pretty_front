import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaTimes, FaSave, FaSearch, FaTrash, FaCheckCircle, FaEdit } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate, getCurrentDate } from '../utils/dateUtils';
import ArticleSearchModal from '../components/ArticleSearchModal';
import Swal from 'sweetalert2';
import { debounce } from 'lodash';

const ConteoCreate = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const today = getCurrentDate();

    // Estados para el encabezado
    const [fecha, setFecha] = useState(today);
    const [conteoId, setConteoId] = useState(id || null);
    const [bodega, setBodega] = useState('');
    const [estado, setEstado] = useState('PENDIENTE');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el detalle
    const [detalles, setDetalles] = useState([]);
    const [codigoArticulo, setCodigoArticulo] = useState('');
    const [cantidadFisica, setCantidadFisica] = useState('');
    const [editingCantidad, setEditingCantidad] = useState(null);
    const [tempCantidad, setTempCantidad] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchPageNumber, setSearchPageNumber] = useState(1);
    const [hasMoreSearch, setHasMoreSearch] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    // Estado para el modal de búsqueda
    const [showArticleModal, setShowArticleModal] = useState(false);

    // Crear nuevo conteo solo si no hay ID en la URL
    useEffect(() => {
        const crearConteo = async () => {
            if (id) return; // Si hay ID, no crear nuevo conteo

            setIsLoading(true);
            try {
                const response = await axios.post(`${API_URL}/inventario-conteo`, {
                    fecha: new Date(fecha).toISOString(),
                    usuario: localStorage.getItem('user_pretty') || 'admin',
                    bodega: bodega || 'BOD001'
                }, {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });

                if (response.data.success) {
                    const newId = response.data.data.id;
                    setConteoId(newId);
                    // Redirigir a la URL con el ID
                    navigate(`/conteos/nuevo/${newId}`, { replace: true });
                }
            } catch (error) {
                setError('Error al crear el conteo');
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        crearConteo();
    }, []);

    // Cargar datos del conteo si hay ID
    useEffect(() => {
        const cargarConteo = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const response = await axios.get(`${API_URL}/inventario-conteo/${id}`, {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });

                if (response.data.success && response.data.data.length > 0) {
                    const conteo = response.data.data[0];
                    // Convertir la fecha al formato YYYY-MM-DD para el input type="date"
                    const fechaConteo = new Date(conteo.fecha);
                    const fechaFormateada = fechaConteo.toISOString().split('T')[0];
                    setFecha(fechaFormateada);
                    setBodega(conteo.bodega);
                    setEstado(conteo.estado);
                    setDetalles(response.data.data);
                }
            } catch (error) {
                setError('Error al cargar el conteo');
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
        };

        cargarConteo();
    }, [id]);

    // Función para buscar artículos
    const searchDetalles = useCallback(async (page = 1) => {
        if (!conteoId) return;

        setIsSearching(true);
        try {
            const response = await axios.get(`${API_URL}/inventario-conteo/${conteoId}/detalle/buscar`, {
                params: {
                    nombre: searchTerm.trim(),
                    PageNumber: page,
                    PageSize: 10
                },
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                const newDetalles = response.data.data;
                if (page === 1) {
                    setDetalles(newDetalles);
                } else {
                    setDetalles(prev => [...prev, ...newDetalles]);
                }
                setHasMoreSearch(newDetalles.length >= 10);
                setSearchPageNumber(page);
            }
        } catch (error) {
            console.error('Error al buscar detalles:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al buscar artículos',
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsSearching(false);
        }
    }, [conteoId, searchTerm]);

    // Función para cargar detalles
    const cargarDetalles = useCallback(async () => {
        if (!conteoId) return;

        setIsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/inventario-conteo/${conteoId}`, {
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                setDetalles(response.data.data);
                setHasMoreSearch(false);
                setSearchPageNumber(1);
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los detalles del conteo',
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsLoading(false);
        }
    }, [conteoId]);

    // Debounce para la búsqueda
    const debouncedSearch = useCallback(
        debounce((term) => {
            if (term.trim()) {
                searchDetalles(1);
            } else {
                cargarDetalles();
            }
        }, 300),
        [searchDetalles, cargarDetalles]
    );

    // Efecto para la búsqueda
    useEffect(() => {
        const searchTimeout = setTimeout(() => {
            if (searchTerm.trim()) {
                searchDetalles(1);
            } else {
                cargarDetalles();
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [searchTerm, searchDetalles, cargarDetalles]);

    // Función para cargar más resultados
    const loadMoreSearch = useCallback(() => {
        if (!isSearching && hasMoreSearch) {
            searchDetalles(searchPageNumber + 1);
        }
    }, [isSearching, hasMoreSearch, searchPageNumber, searchDetalles]);

    // Función para agregar detalle
    const handleAgregarDetalle = async () => {
        // Validaciones
        if (!codigoArticulo.trim()) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'Debe ingresar un código de artículo',
                confirmButtonColor: '#f58ea3'
            });
            return;
        }

        const cantidad = parseInt(cantidadFisica);
        if (isNaN(cantidad) || cantidad <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'La cantidad física debe ser mayor a 0',
                confirmButtonColor: '#f58ea3'
            });
            return;
        }

        if (!conteoId) {
            Swal.fire({
                icon: 'error',
                title: 'Error de validación',
                text: 'No se ha creado el conteo',
                confirmButtonColor: '#f58ea3'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/inventario-conteo/detalle`, {
                conteo_id: conteoId,
                articulo_codigo: codigoArticulo.trim(),
                cantidad_fisica: cantidad
            }, {
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                // Limpiar campos
                setCodigoArticulo('');
                setCantidadFisica('');
                // Recargar detalles
                await cargarDetalles();
                Swal.fire({
                    icon: 'success',
                    title: 'Artículo agregado',
                    text: 'El artículo ha sido agregado correctamente al conteo',
                    confirmButtonColor: '#f58ea3'
                });
            } else {
                // Mostrar el mensaje de error específico del API
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.data.error || 'Error al agregar el artículo',
                    confirmButtonColor: '#f58ea3'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            // Mostrar el mensaje de error específico del API si está disponible
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Error al agregar el artículo';

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Función para confirmar conteo
    const handleConfirmar = async () => {
        if (!conteoId) return;

        setIsLoading(true);
        try {
            const response = await axios.patch(`${API_URL}/inventario-conteo/${conteoId}/estado`, {
                estado: estado,
                fecha: new Date(fecha).toISOString()
            }, {
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Conteo actualizado',
                    text: 'El conteo ha sido actualizado exitosamente',
                    confirmButtonColor: '#f58ea3'
                }).then(() => {
                    navigate('/conteos');
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.data.error || 'Error al actualizar el conteo',
                    confirmButtonColor: '#f58ea3'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Error al actualizar el conteo';

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Función para cancelar conteo
    const handleCancelar = async () => {
        if (!conteoId) return;

        setIsLoading(true);
        try {
            const response = await axios.put(`${API_URL}/inventario-conteo/${conteoId}/estado`, {
                estado: 'CANCELADO'
            }, {
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            if (response.data.success) {
                navigate('/conteos');
            }
        } catch (error) {
            setError('Error al cancelar el conteo');
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para manejar la selección de artículo
    const handleSelectArticle = (article) => {
        setCodigoArticulo(article.codigo);
        setShowArticleModal(false);
    };

    // Función para eliminar detalle
    const handleEliminarDetalle = async (articuloCodigo) => {
        const result = await Swal.fire({
            title: '¿Está seguro?',
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f58ea3',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar'
        });

        if (result.isConfirmed) {
            setIsLoading(true);
            try {
                const response = await axios.delete(`${API_URL}/inventario-conteo/${conteoId}/detalle/${articuloCodigo}`, {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });

                if (response.data.success) {
                    // Recargar detalles
                    await cargarDetalles();
                    Swal.fire({
                        icon: 'success',
                        title: 'Artículo eliminado',
                        text: 'El artículo ha sido eliminado correctamente del conteo',
                        confirmButtonColor: '#f58ea3'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.data.error || 'Error al eliminar el artículo',
                        confirmButtonColor: '#f58ea3'
                    });
                }
            } catch (error) {
                console.error('Error:', error);
                const errorMessage = error.response?.data?.error ||
                    error.response?.data?.message ||
                    'Error al eliminar el artículo';

                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: errorMessage,
                    confirmButtonColor: '#f58ea3'
                });
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Función para actualizar cantidad
    const handleUpdateCantidad = async (articuloCodigo, nuevaCantidad) => {
        if (!conteoId) return;

        setIsLoading(true);
        try {
            const response = await axios.patch(
                `${API_URL}/inventario-conteo/${conteoId}/detalle/${articuloCodigo}/cantidad`,
                {
                    cantidad_fisica: parseInt(nuevaCantidad)
                },
                {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                }
            );

            if (response.data.success) {
                // Recargar detalles
                await cargarDetalles();
                setEditingCantidad(null);
                Swal.fire({
                    icon: 'success',
                    title: 'Cantidad actualizada',
                    text: 'La cantidad ha sido actualizada exitosamente',
                    confirmButtonColor: '#f58ea3'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: response.data.error || 'Error al actualizar la cantidad',
                    confirmButtonColor: '#f58ea3'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Error al actualizar la cantidad';

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Función para iniciar edición de cantidad
    const startEditingCantidad = (detalle) => {
        setEditingCantidad(detalle.art_cod);
        setTempCantidad(detalle.cantidad_fisica.toString());
    };

    // Función para cancelar edición
    const cancelEditing = () => {
        setEditingCantidad(null);
        setTempCantidad('');
    };

    return (
        <div className="p-2 sm:p-4 max-w-full sm:max-w-4xl mx-auto bg-gray-50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">
                    {id ? 'Editar Conteo' : 'Nuevo Conteo'}
                </h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleCancelar}
                        className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded flex items-center justify-center text-sm sm:text-base border border-[#f58ea3] transition-colors w-full sm:w-auto"
                    >
                        <FaTimes className="mr-2" /> Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded flex items-center justify-center text-sm sm:text-base transition-colors w-full sm:w-auto"
                    >
                        <FaSave className="mr-2" /> Confirmar
                    </button>
                </div>
            </div>

            {/* Información del Conteo */}
            <div className="bg-white p-2 sm:p-4 rounded shadow mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Información del Conteo</h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Número de Conteo</label>
                        <input
                            type="text"
                            value={conteoId || ''}
                            disabled
                            className="mt-1 block w-full p-2 border rounded text-sm bg-gray-50"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bodega</label>
                        <input
                            type="text"
                            value={bodega}
                            onChange={(e) => setBodega(e.target.value)}
                            placeholder="Ingrese bodega"
                            className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        >
                            <option value="PENDIENTE">PENDIENTE - Estado inicial cuando se crea un conteo</option>
                            <option value="EN_PROGRESO">EN_PROGRESO - Cuando se está realizando el conteo</option>
                            <option value="COMPLETADO">COMPLETADO - Cuando se ha finalizado el conteo</option>
                            <option value="CANCELADO">CANCELADO - Cuando se cancela el conteo</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Agregar Detalle */}
            <div className="bg-white p-2 sm:p-4 rounded shadow mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Agregar Artículo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Código Artículo</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={codigoArticulo}
                                onChange={(e) => setCodigoArticulo(e.target.value)}
                                placeholder="Ingrese código"
                                className="mt-1 block w-full p-2 pl-10 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                            />
                            <button
                                onClick={() => setShowArticleModal(true)}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#f58ea3] transition-colors"
                            >
                                <FaSearch className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cantidad Física</label>
                        <input
                            type="number"
                            value={cantidadFisica}
                            onChange={(e) => setCantidadFisica(e.target.value)}
                            placeholder="Ingrese cantidad"
                            min="1"
                            className="mt-1 block w-full p-2 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleAgregarDetalle}
                            disabled={isLoading}
                            className="w-full bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded flex items-center justify-center text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <LoadingSpinner size="small" />
                            ) : (
                                <>
                                    <FaPlus className="mr-2" /> Agregar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Detalles */}
            <div className="bg-white p-2 sm:p-4 rounded shadow mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-gray-800">Detalle del Conteo</h3>

                {/* Barra de búsqueda */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar artículo por nombre..."
                            className="w-full p-2 pl-10 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Vista móvil */}
                <div className="block sm:hidden">
                    <div className="space-y-4">
                        {isSearching && searchPageNumber === 1 ? (
                            <div className="text-center py-4">
                                <LoadingSpinner />
                            </div>
                        ) : detalles.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">
                                {searchTerm ? 'No se encontraron artículos' : 'No hay artículos agregados'}
                            </p>
                        ) : (
                            <>
                                {detalles.map((detalle) => (
                                    <div key={detalle.art_sec} className="border rounded-lg p-3 bg-gray-50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="grid grid-cols-2 gap-2 flex-1">
                                                <div>
                                                    <span className="text-xs text-gray-500">Código</span>
                                                    <p className="text-sm font-medium">{detalle.art_cod}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Cant. Sistema</span>
                                                    <p className="text-sm font-medium text-right">{detalle.cantidad_sistema}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleEliminarDetalle(detalle.art_cod)}
                                                className="p-2 text-red-500 hover:text-red-700 transition-colors"
                                                disabled={isLoading}
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-xs text-gray-500">Artículo</span>
                                            <p className="text-sm">{detalle.art_nom}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <span className="text-xs text-gray-500">Cant. Física</span>
                                                {editingCantidad === detalle.art_cod ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={tempCantidad}
                                                            onChange={(e) => setTempCantidad(e.target.value)}
                                                            className="w-20 p-1 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                                                            min="0"
                                                        />
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleUpdateCantidad(detalle.art_cod, tempCantidad)}
                                                                className="text-green-600 hover:text-green-800 transition-colors"
                                                                disabled={isLoading}
                                                            >
                                                                <FaCheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                            >
                                                                <FaTimes className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium">{detalle.cantidad_fisica}</p>
                                                        <button
                                                            onClick={() => startEditingCantidad(detalle)}
                                                            className="text-[#f58ea3] hover:text-[#f7b3c2] transition-colors"
                                                        >
                                                            <FaEdit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500">Diferencia</span>
                                                <p className={`text-sm font-medium text-right ${detalle.diferencia > 0 ? 'text-green-600' :
                                                    detalle.diferencia < 0 ? 'text-red-600' :
                                                        'text-gray-600'
                                                    }`}>
                                                    {detalle.diferencia}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {hasMoreSearch && !isSearching && (
                                    <div className="text-center">
                                        <button
                                            onClick={loadMoreSearch}
                                            className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded text-sm border border-[#f58ea3] transition-colors"
                                        >
                                            Cargar más artículos
                                        </button>
                                    </div>
                                )}
                                {isSearching && searchPageNumber > 1 && (
                                    <div className="text-center py-4">
                                        <LoadingSpinner />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Vista desktop */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#fff5f7]">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Artículo</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cant. Sistema</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cant. Física</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Diferencia</th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isSearching && searchPageNumber === 1 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        <LoadingSpinner />
                                    </td>
                                </tr>
                            ) : detalles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4 text-gray-500">
                                        {searchTerm ? 'No se encontraron artículos' : 'No hay artículos agregados'}
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {detalles.map((detalle) => (
                                        <tr key={detalle.art_sec} className="hover:bg-[#fff5f7] transition-colors">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{detalle.art_cod}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{detalle.art_nom}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{detalle.cantidad_sistema}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">
                                                {editingCantidad === detalle.art_cod ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={tempCantidad}
                                                            onChange={(e) => setTempCantidad(e.target.value)}
                                                            className="w-20 p-1 border rounded text-sm focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                                                            min="0"
                                                        />
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => handleUpdateCantidad(detalle.art_cod, tempCantidad)}
                                                                className="text-green-600 hover:text-green-800 transition-colors"
                                                                disabled={isLoading}
                                                            >
                                                                <FaCheckCircle className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                            >
                                                                <FaTimes className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span>{detalle.cantidad_fisica}</span>
                                                        <button
                                                            onClick={() => startEditingCantidad(detalle)}
                                                            className="text-[#f58ea3] hover:text-[#f7b3c2] transition-colors"
                                                        >
                                                            <FaEdit className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-right">
                                                <span className={`font-medium ${detalle.diferencia > 0 ? 'text-green-600' : detalle.diferencia < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {detalle.diferencia}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-center">
                                                <button
                                                    onClick={() => handleEliminarDetalle(detalle.art_cod)}
                                                    className="text-red-500 hover:text-red-700 transition-colors"
                                                    disabled={isLoading}
                                                >
                                                    <FaTrash className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {hasMoreSearch && !isSearching && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4">
                                                <button
                                                    onClick={loadMoreSearch}
                                                    className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded text-sm border border-[#f58ea3] transition-colors"
                                                >
                                                    Cargar más artículos
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                    {isSearching && searchPageNumber > 1 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-4">
                                                <LoadingSpinner />
                                            </td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mensaje de error */}
            {error && (
                <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Modal de búsqueda de artículos */}
            <ArticleSearchModal
                isOpen={showArticleModal}
                onClose={() => setShowArticleModal(false)}
                onSelectArticle={handleSelectArticle}
            />

            {/* Estilos globales */}
            <style>{`
                .focus-within\\:ring-2:focus-within {
                    --tw-ring-color: #f58ea3;
                }
                input:focus, select:focus, textarea:focus {
                    --tw-ring-color: #f58ea3;
                    --tw-border-opacity: 1;
                    border-color: rgba(245, 142, 163, var(--tw-border-opacity));
                }
                .hover\\:bg-brand:hover {
                    background-color: #f7b3c2;
                }
            `}</style>
        </div>
    );
};

export default ConteoCreate; 