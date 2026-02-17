// src/pages/Products.jsx - REDISEÑO UX/UI v2
// Catálogo Operativo: Denso, escaneable, profesional
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEdit, FaSyncAlt, FaCheckCircle, FaTimesCircle, FaClock, FaHistory, FaFire, FaFilter, FaTimes, FaLayerGroup, FaSpinner, FaSearch } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleMovementModal from '../components/ArticleMovementModal';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState({});
    const [syncingAttributes, setSyncingAttributes] = useState({});
    
    // Paginación tradicional
    const getStoredPage = () => {
        try {
            const stored = localStorage.getItem('products_page');
            return stored ? parseInt(stored, 10) : 1;
        } catch (error) {
            return 1;
        }
    };
    
    const [pageNumber, setPageNumber] = useState(getStoredPage());
    const [pageInfo, setPageInfo] = useState({
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
    });

    // Cargar filtros desde localStorage al iniciar
    const getStoredFilters = () => {
        try {
            const stored = localStorage.getItem('products_filters');
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading filters from localStorage:', error);
            return {};
        }
    };

    const storedFilters = getStoredFilters();

    const [filterCodigo, setFilterCodigo] = useState(storedFilters.codigo || '');
    const [filterNombre, setFilterNombre] = useState(storedFilters.nombre || '');
    const [filterExistencia, setFilterExistencia] = useState('');
    const [selectedExistencia, setSelectedExistencia] = useState(storedFilters.existencia || "todas");
    const [filterCategoria, setFilterCategoria] = useState(storedFilters.categoria || '');
    const [filterSubcategoria, setFilterSubcategoria] = useState(storedFilters.subcategoria || '');
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedArticleCode, setSelectedArticleCode] = useState(null);

    const limit = 15;

    // Guardar filtros y página en localStorage cuando cambien
    useEffect(() => {
        const filters = {
            codigo: filterCodigo,
            nombre: filterNombre,
            existencia: selectedExistencia,
            categoria: filterCategoria,
            subcategoria: filterSubcategoria,
        };
        localStorage.setItem('products_filters', JSON.stringify(filters));
        localStorage.setItem('products_page', pageNumber.toString());
    }, [filterCodigo, filterNombre, selectedExistencia, filterCategoria, filterSubcategoria, pageNumber]);

    // Función para limpiar todos los filtros
    const clearAllFilters = () => {
        setFilterCodigo('');
        setFilterNombre('');
        setSelectedExistencia('todas');
        setFilterCategoria('');
        setFilterSubcategoria('');
        setPageNumber(1); // Resetear paginación al limpiar filtros
        localStorage.removeItem('products_filters');
        localStorage.removeItem('products_page');
        toast.success('Filtros limpiados correctamente');
    };

    // Verificar si hay filtros activos
    const hasActiveFilters = filterCodigo || filterNombre || selectedExistencia !== 'todas' || filterCategoria || filterSubcategoria;

    // Cargar categorías al montar el componente
    useEffect(() => {
        setIsLoadingCategories(true);
        const token = localStorage.getItem('pedidos_pretty_token');
        axios.get(`${API_URL}/categorias?limit=1000`, {
            headers: { 'x-access-token': token }
        })
            .then(response => {
                const data = response.data;
                if (data.success && data.data) {
                    setCategories(data.data);
                }
            })
            .catch(error => {
                console.error("Error al obtener categorías:", error);
            })
            .finally(() => setIsLoadingCategories(false));
    }, []);

    // Cargar subcategorías cuando cambia la categoría seleccionada
    useEffect(() => {
        if (filterCategoria) {
            setIsLoadingSubcategories(true);
            const token = localStorage.getItem('pedidos_pretty_token');
            axios.get(`${API_URL}/subcategorias`, {
                params: { inv_gru_cod: filterCategoria, limit: 1000 },
                headers: { 'x-access-token': token }
            })
                .then(response => {
                    const data = response.data;
                    if (data.success && data.data) {
                        setSubcategories(data.data);
                    }
                })
                .catch(error => {
                    console.error("Error al obtener subcategorías:", error);
                })
                .finally(() => setIsLoadingSubcategories(false));
        } else {
            setSubcategories([]);
            setFilterSubcategoria('');
        }
    }, [filterCategoria]);

    const fetchProducts = useCallback(async (page) => {
        setIsLoading(true);
        try {
            let tieneExistenciaValue;
            if (selectedExistencia === "con_existencia") {
                tieneExistenciaValue = true;
            } else if (selectedExistencia === "sin_existencia") {
                tieneExistenciaValue = false;
            } else {
                tieneExistenciaValue = '';
            }

            console.log(`🔍 Fetching products - Page: ${page}, Code: "${filterCodigo}", Name: "${filterNombre}", Existence: "${selectedExistencia}", Categoria: "${filterCategoria}", Subcategoria: "${filterSubcategoria}"`);

            const params = {
                PageNumber: page,
                PageSize: limit,
                codigo: filterCodigo || '',
                nombre: filterNombre || '',
                tieneExistencia: tieneExistenciaValue,
            };

            // Solo agregar categoría si tiene valor
            if (filterCategoria) {
                params.inv_gru_cod = filterCategoria;
            }

            // Solo agregar subcategoría si tiene valor
            if (filterSubcategoria) {
                params.inv_sub_gru_cod = filterSubcategoria;
            }

            const response = await axios.get(`${API_URL}/articulos`, {
                params,
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            const newProducts = response.data.articulos || response.data.products || [];
            console.log(`📦 Received ${newProducts.length} products from API:`, newProducts.map(p => p.art_cod));

            // Paginación tradicional: reemplazar productos en lugar de acumular
            setProducts(newProducts);
            setPageNumber(page);

            // Intentar obtener información de paginación del backend
            // Si el backend la devuelve, usarla; si no, calcularla basándose en los resultados
            if (response.data.pageInfo) {
                // Backend devuelve información completa de paginación
                setPageInfo({
                    totalElements: response.data.pageInfo.totalElements || 0,
                    totalPages: response.data.pageInfo.totalPages || 0,
                    hasNext: response.data.pageInfo.hasNext || false,
                    hasPrevious: response.data.pageInfo.hasPrevious || false,
                });
            } else if (response.data.totalElements !== undefined) {
                // Backend devuelve campos directos (formato alternativo)
                const totalElements = response.data.totalElements || 0;
                const totalPages = response.data.totalPages || Math.ceil(totalElements / limit);
                setPageInfo({
                    totalElements,
                    totalPages,
                    hasNext: response.data.hasNext !== undefined ? response.data.hasNext : (page < totalPages),
                    hasPrevious: response.data.hasPrevious !== undefined ? response.data.hasPrevious : (page > 1),
                });
            } else {
                // Fallback: calcular basándose en si hay más productos
                // Si recibimos menos productos que el límite, es la última página
                const hasMore = newProducts.length === limit;
                setPageInfo(prev => ({
                    totalElements: prev.totalElements, // Mantener si ya estaba calculado
                    totalPages: hasMore ? page + 1 : page, // Estimar total de páginas
                    hasNext: hasMore,
                    hasPrevious: page > 1,
                }));
            }

        } catch (error) {
            console.error("Error fetching products:", error);
            if (error.response && error.response.status === 404) {
                console.error("Endpoint no encontrado. Verifica la URL:", `${API_URL}/articulos`);
            }
            setProducts([]);
            setPageInfo({
                totalElements: 0,
                totalPages: 0,
                hasNext: false,
                hasPrevious: false,
            });
        } finally {
            setIsLoading(false);
        }
    }, [filterCodigo, filterNombre, selectedExistencia, filterCategoria, filterSubcategoria, limit]);

    // Crear un debounce estable que no se recree constantemente
    const debouncedFetch = useCallback(
        debounce(() => {
            console.log('🚀 Debounced fetch triggered - resetting to page 1');
            setPageNumber(1); // Resetear a página 1 cuando cambian los filtros
            localStorage.setItem('products_page', '1'); // Actualizar localStorage también
            fetchProducts(1);
        }, 500),
        [fetchProducts]
    );

    // useEffect para manejar los cambios de filtros
    useEffect(() => {
        console.log('🔄 Filter changed - triggering debounced fetch');
        debouncedFetch();
        return () => debouncedFetch.cancel();
    }, [filterCodigo, filterNombre, selectedExistencia, filterCategoria, filterSubcategoria, debouncedFetch]);

    // useEffect inicial para cargar productos al montar el componente
    useEffect(() => {
        console.log('🚀 Initial load - fetching products');
        const initialPage = getStoredPage();
        fetchProducts(initialPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo se ejecuta al montar el componente

    // Función para cambiar de página
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pageInfo.totalPages && !isLoading) {
            fetchProducts(newPage);
        }
    };

    const handleViewMovements = (articleCode) => {
        setSelectedArticleCode(articleCode);
        setIsMovementModalOpen(true);
    };

    const handleSyncProduct = async (productId, productCode) => {
        try {
            setSyncingProducts(prev => ({ ...prev, [productId]: true }));
            const response = await axios.put(`${API_URL}/updateWooStock/${productCode}`,
                {},
                { headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') } }
            );

            if (response.data.success) {
                toast.success('Producto sincronizado exitosamente');
                // Refresh the products list
                fetchProducts(1);
            } else {
                toast.error(response.data.message || 'Error al sincronizar el producto');
            }
        } catch (error) {
            console.error('Error syncing product:', error);
            toast.error('Error al sincronizar el producto');
        } finally {
            setSyncingProducts(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handleSyncAttributes = async (productId) => {
        try {
            setSyncingAttributes(prev => ({ ...prev, [productId]: true }));
            const response = await axios.put(
                `${API_URL}/articulos/variable/${productId}/sync-attributes`,
                {},
                { headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') } }
            );

            if (response.data.success) {
                toast.success(response.data.message || 'Atributos sincronizados con WooCommerce');
            } else {
                toast.error(response.data.message || 'Error al sincronizar atributos');
            }
        } catch (error) {
            console.error('Error syncing attributes:', error);
            toast.error(error.response?.data?.message || 'Error al sincronizar atributos');
        } finally {
            setSyncingAttributes(prev => ({ ...prev, [productId]: false }));
        }
    };

    const renderSyncStatus = (status, message) => {
        switch (status) {
            case 'success':
                return <FaCheckCircle className="text-emerald-500 w-3.5 h-3.5" title="Sincronizado con WooCommerce" />;
            case 'error':
                return <FaTimesCircle className="text-red-500 w-3.5 h-3.5" title={`Error Woo: ${message || 'Desconocido'}`} />;
            case 'pending':
                return <FaClock className="text-amber-500 w-3.5 h-3.5 animate-pulse" title="Sincronización pendiente" />;
            default:
                return <span className="text-[#b0b0b0] text-xs" title="Estado no disponible">-</span>;
        }
    };

    const formatPrice = (price) => {
        if (!price) return '$0';
        return `$${parseInt(price).toLocaleString('es-CO')}`;
    };

    const getAverageCost = (product) =>
        product?.costo_promedio ??
        product?.costo_promedio_ponderado ??
        product?.costo_promedio_actual ??
        product?.kar_cos_pro ??
        null;

    // Determinar color de existencia (signature element)
    const getStockColor = (stock) => {
        const qty = parseInt(stock);
        if (qty === 0) return 'text-red-600';
        if (qty < 5) return 'text-amber-600';
        if (qty < 20) return 'text-[#2c2c2c]';
        return 'text-emerald-600';
    };

    console.log(`🎯 Current products state: ${products.length} products`, products.map(p => p.art_cod));

    return (
        <div className="h-full flex flex-col bg-[#fafbfc]">
            {/* TOOLBAR - Filtros + Acciones */}
            <div className="flex-shrink-0 bg-white border-b border-[#e8eaed]">
                {/* Acciones superiores - Mobile/Desktop */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed]">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-semibold text-[#2c2c2c]">Productos</h1>
                        {hasActiveFilters && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-pink-50 text-[#f58ea3] border border-pink-200">
                                <FaFilter className="w-2.5 h-2.5" />
                                {Object.values({ filterCodigo, filterNombre, selectedExistencia: selectedExistencia !== 'todas' ? selectedExistencia : null, filterCategoria, filterSubcategoria }).filter(Boolean).length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearAllFilters}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5a5a5a] bg-[#f5f6f7] hover:bg-[#e8eaed] rounded-md transition-colors duration-150"
                                title="Limpiar filtros"
                            >
                                <FaTimes className="w-3 h-3" />
                                <span className="hidden sm:inline">Limpiar</span>
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/products/create')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#f58ea3] hover:bg-[#f7b3c2] rounded-md transition-colors duration-150"
                        >
                            <FaPlus className="w-3 h-3" />
                            <span className="hidden sm:inline">Crear</span>
                        </button>
                    </div>
                </div>

                {/* Filtros - Barra compacta */}
                <div className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-2">
                        {/* Búsqueda por código */}
                        <div className="relative flex-1 min-w-[140px]">
                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7a7a7a]" />
                            <input
                                type="text"
                                placeholder="Código..."
                                value={filterCodigo}
                                onChange={(e) => setFilterCodigo(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-[#e8eaed] rounded-md bg-white text-[#2c2c2c] placeholder-[#b0b0b0] focus:outline-none focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                            />
                        </div>

                        {/* Búsqueda por nombre */}
                        <div className="relative flex-1 min-w-[180px]">
                            <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7a7a7a]" />
                            <input
                                type="text"
                                placeholder="Nombre del producto..."
                                value={filterNombre}
                                onChange={(e) => setFilterNombre(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-[#e8eaed] rounded-md bg-white text-[#2c2c2c] placeholder-[#b0b0b0] focus:outline-none focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                            />
                        </div>

                        {/* Existencia */}
                        <select
                            value={selectedExistencia}
                            onChange={(e) => setSelectedExistencia(e.target.value)}
                            className="px-2.5 py-1.5 text-xs border border-[#e8eaed] rounded-md bg-white text-[#2c2c2c] focus:outline-none focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors min-w-[120px]"
                        >
                            <option value="todas">Todas</option>
                            <option value="con_existencia">Con stock</option>
                            <option value="sin_existencia">Sin stock</option>
                        </select>

                        {/* Categoría */}
                        <select
                            value={filterCategoria}
                            onChange={(e) => setFilterCategoria(e.target.value)}
                            disabled={isLoadingCategories}
                            className="px-2.5 py-1.5 text-xs border border-[#e8eaed] rounded-md bg-white text-[#2c2c2c] focus:outline-none focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors disabled:bg-[#f5f6f7] disabled:cursor-not-allowed min-w-[120px]"
                        >
                            <option value="">Categoría</option>
                            {categories.map(cat => (
                                <option key={cat.inv_gru_cod} value={cat.inv_gru_cod}>
                                    {cat.inv_gru_nom}
                                </option>
                            ))}
                        </select>

                        {/* Subcategoría */}
                        <select
                            value={filterSubcategoria}
                            onChange={(e) => setFilterSubcategoria(e.target.value)}
                            disabled={!filterCategoria || isLoadingSubcategories}
                            className="px-2.5 py-1.5 text-xs border border-[#e8eaed] rounded-md bg-white text-[#2c2c2c] focus:outline-none focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors disabled:bg-[#f5f6f7] disabled:cursor-not-allowed min-w-[120px]"
                        >
                            <option value="">Subcategoría</option>
                            {subcategories.map(sub => (
                                <option key={sub.inv_sub_gru_cod} value={sub.inv_sub_gru_cod}>
                                    {sub.inv_sub_gru_nom}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* CONTENIDO - Cards (Mobile) / Tabla (Desktop) */}
            <div className="flex-1 overflow-auto">
                <div className="p-4">
                    {/* Vista Mobile - Cards */}
                    <div className="block lg:hidden space-y-2.5">
                        {isLoading && (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        )}
                        {!isLoading && products.length === 0 && (
                            <div className="bg-white border border-[#e8eaed] rounded-lg p-8 text-center">
                                <p className="text-sm text-[#7a7a7a]">No hay productos para mostrar.</p>
                            </div>
                        )}
                        {products.map((product) => (
                            <div
                                key={product.art_sec}
                                className="bg-white border border-[#e8eaed] rounded-lg hover:border-[#f58ea3] transition-colors duration-150"
                            >
                                {/* Header */}
                                <div className="px-3 py-2.5 border-b border-[#e8eaed]">
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span className="font-semibold text-xs text-[#2c2c2c]">{product.art_cod}</span>
                                                {product.art_woo_type === 'variable' && (
                                                    <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded text-[9px] font-medium border border-purple-200">
                                                        <FaLayerGroup className="w-2 h-2" />VAR
                                                    </span>
                                                )}
                                                {product.art_woo_type === 'variation' && (
                                                    <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[9px] font-medium border border-indigo-200">
                                                        <FaLayerGroup className="w-2 h-2" />VRN
                                                    </span>
                                                )}
                                                {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                                {product.tiene_oferta === 'S' && (
                                                    <FaFire className="text-orange-500 w-3 h-3" title="En oferta" />
                                                )}
                                            </div>
                                            <p className="text-xs text-[#5a5a5a] line-clamp-2 leading-snug">{product.art_nom}</p>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                                className="p-1.5 text-[#7a7a7a] hover:text-[#f58ea3] hover:bg-pink-50 rounded transition-colors duration-150"
                                                title="Editar"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleViewMovements(product.art_cod)}
                                                className="p-1.5 text-[#7a7a7a] hover:text-[#f58ea3] hover:bg-pink-50 rounded transition-colors duration-150"
                                                title="Movimientos"
                                            >
                                                <FaHistory className="w-3.5 h-3.5" />
                                            </button>
                                            {product.art_woo_type === 'variable' && (
                                                <button
                                                    onClick={() => handleSyncAttributes(product.art_sec)}
                                                    disabled={syncingAttributes[product.art_sec]}
                                                    className="p-1.5 text-purple-500 hover:text-white hover:bg-purple-500 rounded transition-colors duration-150 disabled:opacity-50"
                                                    title="Sync Atributos"
                                                >
                                                    {syncingAttributes[product.art_sec] ? (
                                                        <FaSpinner className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <FaSyncAlt className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Categorías */}
                                    {(product.categoria || product.sub_categoria) && (
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {product.categoria && (
                                                <span className="text-[9px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-medium border border-purple-200">
                                                    {product.categoria}
                                                </span>
                                            )}
                                            {product.sub_categoria && (
                                                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                                                    {product.sub_categoria}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Datos numéricos */}
                                <div className="px-3 py-2.5 bg-[#fafbfc]">
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                                        <div>
                                            <span className="block text-[10px] text-[#7a7a7a] mb-0.5">Stock</span>
                                            <span className={`font-semibold text-xs ${getStockColor(product.existencia)}`}>
                                                {product.existencia} und
                                            </span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-[#7a7a7a] mb-0.5">P. Detal</span>
                                            <span className="font-medium text-xs text-[#2c2c2c]">{formatPrice(product.precio_detal_original)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-[#7a7a7a] mb-0.5">P. Mayor</span>
                                            <span className="font-medium text-xs text-[#2c2c2c]">{formatPrice(product.precio_mayor_original)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[10px] text-[#7a7a7a] mb-0.5">P. Promo</span>
                                            <span className={`font-medium text-xs ${product.tiene_oferta === 'S' ? 'text-orange-600' : 'text-[#b0b0b0]'}`}>
                                                {product.tiene_oferta === 'S' ? formatPrice(product.precio_oferta) : '-'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="block text-[10px] text-[#7a7a7a] mb-0.5">Costo Promedio</span>
                                            <span className="font-medium text-xs text-[#2c2c2c]">
                                                {getAverageCost(product) !== null ? formatPrice(getAverageCost(product)) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Vista Desktop - Tabla */}
                    <div className="hidden lg:block bg-white border border-[#e8eaed] rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#fafbfc] border-b border-[#e8eaed]">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Código</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Nombre</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Categoría</th>
                                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Subcategoría</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Stock</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Detal</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Mayor</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Promo</th>
                                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Costo</th>
                                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider" title="Sincronización WooCommerce">
                                            <FaSyncAlt className="inline-block w-3 h-3" />
                                        </th>
                                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-[#5a5a5a] uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8eaed]">
                                    {isLoading && (
                                        <tr><td colSpan="11" className="text-center py-12"><LoadingSpinner /></td></tr>
                                    )}
                                    {!isLoading && products.length === 0 && (
                                        <tr><td colSpan="11" className="text-center py-12 text-sm text-[#7a7a7a]">No hay productos para mostrar.</td></tr>
                                    )}
                                    {products.map((product) => (
                                        <tr key={product.art_sec} className="hover:bg-[#fafbfc] transition-colors duration-150">
                                            <td className="px-3 py-2.5 text-xs font-semibold text-[#2c2c2c] whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <span>{product.art_cod}</span>
                                                    {product.art_woo_type === 'variable' && (
                                                        <span className="inline-flex items-center gap-0.5 bg-purple-50 text-purple-600 px-1 py-0.5 rounded text-[8px] font-medium border border-purple-200" title="Variable">
                                                            <FaLayerGroup className="w-2 h-2" />VAR
                                                        </span>
                                                    )}
                                                    {product.art_woo_type === 'variation' && (
                                                        <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded text-[8px] font-medium border border-indigo-200" title="Variación">
                                                            <FaLayerGroup className="w-2 h-2" />VRN
                                                        </span>
                                                    )}
                                                    {product.tiene_oferta === 'S' && (
                                                        <FaFire className="text-orange-500 w-2.5 h-2.5" title="En oferta" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-[#2c2c2c] max-w-[300px]">
                                                <div className="truncate" title={product.art_nom}>{product.art_nom}</div>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                                                {product.categoria ? (
                                                    <span className="inline-block bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full text-[9px] font-medium border border-purple-200">
                                                        {product.categoria}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#b0b0b0]">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                                                {product.sub_categoria ? (
                                                    <span className="inline-block bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-medium border border-blue-200">
                                                        {product.sub_categoria}
                                                    </span>
                                                ) : (
                                                    <span className="text-[#b0b0b0]">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-center font-semibold whitespace-nowrap">
                                                <span className={getStockColor(product.existencia)}>{product.existencia}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-right font-medium text-[#2c2c2c] whitespace-nowrap">{formatPrice(product.precio_detal_original)}</td>
                                            <td className="px-3 py-2.5 text-xs text-right font-medium text-[#2c2c2c] whitespace-nowrap">{formatPrice(product.precio_mayor_original)}</td>
                                            <td className="px-3 py-2.5 text-xs text-right whitespace-nowrap">
                                                <span className={`font-medium ${product.tiene_oferta === 'S' ? 'text-orange-600' : 'text-[#b0b0b0]'}`}>
                                                    {product.tiene_oferta === 'S' ? formatPrice(product.precio_oferta) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-right font-medium text-[#2c2c2c] whitespace-nowrap">
                                                {getAverageCost(product) !== null ? formatPrice(getAverageCost(product)) : '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                            </td>
                                            <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                                        className="p-1 text-[#7a7a7a] hover:text-white hover:bg-[#f58ea3] rounded transition-all duration-150"
                                                        title="Editar"
                                                    >
                                                        <FaEdit className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewMovements(product.art_cod)}
                                                        className="p-1 text-[#7a7a7a] hover:text-white hover:bg-[#f58ea3] rounded transition-all duration-150"
                                                        title="Ver Movimientos"
                                                    >
                                                        <FaHistory className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleSyncProduct(product.art_sec, product.art_cod)}
                                                        disabled={syncingProducts[product.art_sec]}
                                                        className="p-1 text-[#7a7a7a] hover:text-white hover:bg-[#f58ea3] rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Sincronizar"
                                                    >
                                                        {syncingProducts[product.art_sec] ? (
                                                            <LoadingSpinner size="small" />
                                                        ) : (
                                                            <FaSyncAlt className="w-3 h-3" />
                                                        )}
                                                    </button>
                                                    {product.art_woo_type === 'variable' && (
                                                        <button
                                                            onClick={() => handleSyncAttributes(product.art_sec)}
                                                            disabled={syncingAttributes[product.art_sec]}
                                                            className="p-1 text-purple-500 hover:text-white hover:bg-purple-500 rounded transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Sync Atributos WooCommerce"
                                                        >
                                                            {syncingAttributes[product.art_sec] ? (
                                                                <FaSpinner className="w-3 h-3 animate-spin" />
                                                            ) : (
                                                                <FaLayerGroup className="w-3 h-3" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación Tradicional */}
                    {pageInfo.totalPages > 0 && products.length > 0 && (
                        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl shadow-lg p-4 border border-[#e8eaed]">
                            <div className="text-xs text-[#5a5a5a]">
                                Mostrando{' '}
                                <span className="font-medium text-[#2c2c2c]">
                                    {products.length > 0 ? (pageNumber - 1) * limit + 1 : 0}
                                </span>{' '}
                                a{' '}
                                <span className="font-medium text-[#2c2c2c]">
                                    {Math.min(pageNumber * limit, pageInfo.totalElements)}
                                </span>{' '}
                                de <span className="font-medium text-[#2c2c2c]">{pageInfo.totalElements}</span> productos
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handlePageChange(pageNumber - 1)}
                                    disabled={!pageInfo.hasPrevious || isLoading}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        !pageInfo.hasPrevious || isLoading
                                            ? 'bg-[#f5f6f7] text-[#b0b0b0] cursor-not-allowed'
                                            : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
                                    }`}
                                >
                                    Anterior
                                </button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (pageInfo.totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (pageNumber <= 3) {
                                            pageNum = i + 1;
                                        } else if (pageNumber >= pageInfo.totalPages - 2) {
                                            pageNum = pageInfo.totalPages - 4 + i;
                                        } else {
                                            pageNum = pageNumber - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={isLoading}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                                    pageNum === pageNumber
                                                        ? 'bg-[#f58ea3] text-white'
                                                        : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
                                                } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={() => handlePageChange(pageNumber + 1)}
                                    disabled={!pageInfo.hasNext || isLoading}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        !pageInfo.hasNext || isLoading
                                            ? 'bg-[#f5f6f7] text-[#b0b0b0] cursor-not-allowed'
                                            : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
                                    }`}
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <ArticleMovementModal
                isOpen={isMovementModalOpen}
                onClose={() => setIsMovementModalOpen(false)}
                articleCode={selectedArticleCode}
            />
        </div>
    );
};

export default Products;
