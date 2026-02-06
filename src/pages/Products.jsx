import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEdit, FaSyncAlt, FaCheckCircle, FaTimesCircle, FaClock, FaHistory, FaFire, FaFilter, FaTimes } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import ArticleMovementModal from '../components/ArticleMovementModal';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [syncingProducts, setSyncingProducts] = useState({});
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);

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

    // Guardar filtros en localStorage cuando cambien
    useEffect(() => {
        const filters = {
            codigo: filterCodigo,
            nombre: filterNombre,
            existencia: selectedExistencia,
            categoria: filterCategoria,
            subcategoria: filterSubcategoria,
        };
        localStorage.setItem('products_filters', JSON.stringify(filters));
    }, [filterCodigo, filterNombre, selectedExistencia, filterCategoria, filterSubcategoria]);

    // Función para limpiar todos los filtros
    const clearAllFilters = () => {
        setFilterCodigo('');
        setFilterNombre('');
        setSelectedExistencia('todas');
        setFilterCategoria('');
        setFilterSubcategoria('');
        localStorage.removeItem('products_filters');
        toast.success('Filtros limpiados correctamente');
    };

    // Verificar si hay filtros activos
    const hasActiveFilters = filterCodigo || filterNombre || selectedExistencia !== 'todas' || filterCategoria || filterSubcategoria;

    // Cargar categorías al montar el componente
    useEffect(() => {
        setIsLoadingCategories(true);
        axios.get(`${API_URL}/categorias`)
            .then(response => {
                const data = response.data;
                if (data.success && data.result && data.result.data) {
                    setCategories(data.result.data);
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
            axios.get(`${API_URL}/subcategorias`, { params: { inv_gru_cod: filterCategoria } })
                .then(response => {
                    const data = response.data;
                    if (data.success && data.subcategorias) {
                        setSubcategories(data.subcategorias);
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

    const fetchProducts = useCallback(async (page, currentProducts = []) => {
        if (!hasMore && page > 1) return;
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

            // Limpiar completamente el estado si es la primera página
            if (page === 1) {
                console.log(`🧹 Clearing all previous products and setting new ones:`, newProducts.map(p => p.art_cod));
                setProducts(newProducts);
            } else {
                // Agregar a los productos existentes
                setProducts(prevProducts => {
                    const updatedProducts = [...prevProducts, ...newProducts];
                    console.log(`➕ Adding to existing products. Total: ${updatedProducts.length}`);
                    return updatedProducts;
                });
            }

            setHasMore(newProducts.length === limit);
            setPageNumber(page);

        } catch (error) {
            console.error("Error fetching products:", error);
            if (error.response && error.response.status === 404) {
                console.error("Endpoint no encontrado. Verifica la URL:", `${API_URL}/articulos`);
            }
            setProducts(currentProducts);
            setHasMore(false);
        } finally {
            setIsLoading(false);
        }
    }, [filterCodigo, filterNombre, selectedExistencia, filterCategoria, filterSubcategoria, limit]);

    // Crear un debounce estable que no se recree constantemente
    const debouncedFetch = useCallback(
        debounce(() => {
            console.log('🚀 Debounced fetch triggered');
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
        fetchProducts(1);
    }, []); // Solo se ejecuta al montar el componente

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchProducts(pageNumber + 1);
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

    const renderSyncStatus = (status, message) => {
        switch (status) {
            case 'success':
                return <FaCheckCircle className="text-green-500" title="Sincronizado con WooCommerce" />;
            case 'error':
                return <FaTimesCircle className="text-red-500" title={`Error Woo: ${message || 'Desconocido'}`} />;
            case 'pending':
                return <FaClock className="text-yellow-500 animate-pulse" title="Sincronización pendiente" />;
            default:
                return <span className="text-gray-400 text-xs" title="Estado no disponible">-</span>;
        }
    };

    const formatPrice = (price) => {
        if (!price) return '$0';
        return `$${parseInt(price).toLocaleString('es-CO')}`;
    };

    // Log para debugging del estado actual
    console.log(`🎯 Current products state: ${products.length} products`, products.map(p => p.art_cod));

    return (
        <div className="min-h-screen bg-[#f7f8fa] p-3 sm:p-4 md:p-6">
            {/* Card de Filtros + Header */}
            <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 p-3 sm:p-4 md:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-bold text-[#f58ea3]">Gestión de Productos</h1>
                        {hasActiveFilters && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                <FaFilter className="mr-1" />
                                Filtros activos
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {hasActiveFilters && (
                            <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center text-sm transition-colors shadow-sm whitespace-nowrap"
                                onClick={clearAllFilters}
                                title="Limpiar todos los filtros"
                            >
                                <FaTimes className="mr-2" /> Limpiar Filtros
                            </button>
                        )}
                        <button
                            className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center text-sm sm:text-base transition-colors shadow-sm whitespace-nowrap"
                            onClick={() => navigate('/products/create')}
                        >
                            <FaPlus className="mr-2" /> Crear Producto
                        </button>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3">
                    <input
                        type="text"
                        placeholder="Buscar por código..."
                        value={filterCodigo}
                        onChange={(e) => setFilterCodigo(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={filterNombre}
                        onChange={(e) => setFilterNombre(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none"
                    />
                    <select
                        value={selectedExistencia}
                        onChange={(e) => setSelectedExistencia(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none"
                    >
                        <option value="todas">Todas existencias</option>
                        <option value="con_existencia">Con existencia</option>
                        <option value="sin_existencia">Sin existencia</option>
                    </select>
                    <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={isLoadingCategories}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(cat => (
                            <option key={cat.inv_gru_cod} value={cat.inv_gru_cod}>
                                {cat.inv_gru_nom}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterSubcategoria}
                        onChange={(e) => setFilterSubcategoria(e.target.value)}
                        className="p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                        disabled={!filterCategoria || isLoadingSubcategories}
                    >
                        <option value="">Todas las subcategorías</option>
                        {subcategories.map(sub => (
                            <option key={sub.inv_sub_gru_cod} value={sub.inv_sub_gru_cod}>
                                {sub.inv_sub_gru_nom}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Vista Mobile - Tarjetas */}
            <div className="block md:hidden">
                {isLoading && pageNumber === 1 && (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner />
                    </div>
                )}
                {!isLoading && products.length === 0 && pageNumber === 1 && (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <p className="text-gray-500">No hay productos para mostrar.</p>
                    </div>
                )}
                <div className="space-y-3">
                    {products.map((product) => (
                        <div key={product.art_sec} className="bg-white rounded-xl shadow-md border border-gray-200 hover:border-[#f58ea3] hover:shadow-lg transition-all">
                            {/* Header de la tarjeta */}
                            <div className="p-3 border-b border-gray-100">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-bold text-sm text-gray-800">{product.art_cod}</span>
                                            {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                            {product.tiene_oferta === 'S' && (
                                                <FaFire className="text-orange-500 w-3.5 h-3.5" title="En oferta" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-2">{product.art_nom}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 hover:bg-pink-50 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleViewMovements(product.art_cod)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 hover:bg-pink-50 rounded-lg transition-colors"
                                            title="Ver Movimientos"
                                        >
                                            <FaHistory className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Categorías */}
                                {(product.categoria || product.sub_categoria) && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {product.categoria && (
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                                                {product.categoria}
                                            </span>
                                        )}
                                        {product.sub_categoria && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                                                {product.sub_categoria}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Info de precios */}
                            <div className="p-3 bg-gray-50">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Existencia</span>
                                        <span className="font-bold text-sm text-[#f58ea3]">{product.existencia} und</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Precio Detal</span>
                                        <span className="font-bold text-sm text-gray-800">{formatPrice(product.precio_detal_original)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Precio Mayor</span>
                                        <span className="font-bold text-sm text-gray-800">{formatPrice(product.precio_mayor_original)}</span>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block mb-1">Precio Promo</span>
                                        <span className={`font-bold text-sm ${product.tiene_oferta === 'S' ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {product.tiene_oferta === 'S' ? formatPrice(product.precio_oferta) : '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {isLoading && pageNumber > 1 && (
                    <div className="flex justify-center py-6">
                        <LoadingSpinner />
                    </div>
                )}
            </div>

            {/* Vista Desktop/Tablet - Tabla */}
            <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-[#fff5f7] to-[#fffbfc]">
                            <tr>
                                <th className="px-2 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Código</th>
                                <th className="px-2 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Nombre</th>
                                <th className="px-2 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Categoría</th>
                                <th className="px-2 py-2.5 text-left text-xs font-bold text-gray-700 uppercase">Subcategoría</th>
                                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 uppercase">Exist.</th>
                                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-700 uppercase">P. Detal</th>
                                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-700 uppercase">P. Mayor</th>
                                <th className="px-2 py-2.5 text-right text-xs font-bold text-gray-700 uppercase">P. Promo</th>
                                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 uppercase" title="Estado Sincronización WooCommerce">
                                    <FaSyncAlt className="inline-block text-[#f58ea3]" />
                                </th>
                                <th className="px-2 py-2.5 text-center text-xs font-bold text-gray-700 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && pageNumber === 1 && (
                                <tr><td colSpan="10" className="text-center py-8"><LoadingSpinner /></td></tr>
                            )}
                            {!isLoading && products.length === 0 && pageNumber === 1 && (
                                <tr><td colSpan="10" className="text-center py-8 text-gray-500 font-medium">No hay productos para mostrar.</td></tr>
                            )}
                            {products.map((product) => (
                                <tr key={product.art_sec} className="hover:bg-pink-50/50 transition-colors border-b border-gray-100">
                                    <td className="px-2 py-2 text-xs font-semibold text-gray-900 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <span>{product.art_cod}</span>
                                            {product.tiene_oferta === 'S' && (
                                                <FaFire className="text-orange-500 w-3 h-3 flex-shrink-0" title="En oferta" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-700 max-w-[250px]">
                                        <div className="truncate" title={product.art_nom}>
                                            {product.art_nom}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-xs whitespace-nowrap">
                                        {product.categoria ? (
                                            <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                {product.categoria}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-xs whitespace-nowrap">
                                        {product.sub_categoria ? (
                                            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-medium">
                                                {product.sub_categoria}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-2 py-2 text-xs text-gray-900 text-center font-semibold whitespace-nowrap">{product.existencia}</td>
                                    <td className="px-2 py-2 text-xs text-gray-900 text-right font-medium whitespace-nowrap">{formatPrice(product.precio_detal_original)}</td>
                                    <td className="px-2 py-2 text-xs text-gray-900 text-right font-medium whitespace-nowrap">{formatPrice(product.precio_mayor_original)}</td>
                                    <td className="px-2 py-2 text-xs text-right whitespace-nowrap">
                                        <span className={`font-semibold ${product.tiene_oferta === 'S' ? 'text-orange-600' : 'text-gray-400'}`}>
                                            {product.tiene_oferta === 'S' ? formatPrice(product.precio_oferta) : '-'}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2 text-center whitespace-nowrap">
                                        {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                    </td>
                                    <td className="px-2 py-2 text-center whitespace-nowrap">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                                className="p-1 text-[#f58ea3] hover:text-white hover:bg-[#f58ea3] rounded transition-all"
                                                title="Editar"
                                            >
                                                <FaEdit className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleViewMovements(product.art_cod)}
                                                className="p-1 text-[#f58ea3] hover:text-white hover:bg-[#f58ea3] rounded transition-all"
                                                title="Ver Movimientos"
                                            >
                                                <FaHistory className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleSyncProduct(product.art_sec, product.art_cod)}
                                                className="p-1 text-[#f58ea3] hover:text-white hover:bg-[#f58ea3] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Sincronizar"
                                                disabled={syncingProducts[product.art_sec]}
                                            >
                                                {syncingProducts[product.art_sec] ? (
                                                    <LoadingSpinner size="small" />
                                                ) : (
                                                    <FaSyncAlt className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {isLoading && pageNumber > 1 && (
                                <tr><td colSpan="10" className="text-center py-6"><LoadingSpinner /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Botón Cargar Más */}
            {hasMore && !isLoading && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleLoadMore}
                        className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] hover:from-[#f7b3c2] hover:to-[#f58ea3] text-white font-bold py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 w-full md:w-auto"
                    >
                        Cargar Más Productos
                    </button>
                </div>
            )}

            <ArticleMovementModal
                isOpen={isMovementModalOpen}
                onClose={() => setIsMovementModalOpen(false)}
                articleCode={selectedArticleCode}
            />
        </div>
    );
};

export default Products;
