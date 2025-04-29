import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEdit, FaTrash, FaSyncAlt, FaCheckCircle, FaTimesCircle, FaClock, FaHistory } from 'react-icons/fa';
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
    const [filterCodigo, setFilterCodigo] = useState('');
    const [filterNombre, setFilterNombre] = useState('');
    const [filterExistencia, setFilterExistencia] = useState('');
    const [selectedExistencia, setSelectedExistencia] = useState("todas");
    const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
    const [selectedArticleCode, setSelectedArticleCode] = useState(null);

    const limit = 15;

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

            const response = await axios.get(`${API_URL}/articulos`, {
                params: {
                    PageNumber: page,
                    PageSize: limit,
                    codigo: filterCodigo || '',
                    nombre: filterNombre || '',
                    tieneExistencia: tieneExistenciaValue,
                },
                headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
            });

            const newProducts = response.data.articulos || response.data.products || [];

            setProducts(page === 1 ? newProducts : [...currentProducts, ...newProducts]);

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
    }, [filterCodigo, filterNombre, selectedExistencia, hasMore, limit]);

    const debouncedFetch = useCallback(debounce(() => fetchProducts(1), 500), [fetchProducts]);

    useEffect(() => {
        debouncedFetch();
        return () => debouncedFetch.cancel();
    }, [debouncedFetch]);

    useEffect(() => {
        fetchProducts(1);
    }, []);

    const handleLoadMore = () => {
        if (!isLoading && hasMore) {
            fetchProducts(pageNumber + 1, products);
        }
    };

    const handleDelete = async (id) => {
        console.log("Borrar producto:", id);
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

    return (
        <div className="p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 text-center sm:text-left">Gestión de Productos</h1>
                <button
                    className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded flex items-center w-full sm:w-auto justify-center text-sm sm:text-base transition-colors"
                    onClick={() => navigate('/products/create')}
                >
                    <FaPlus className="mr-2 text-white" /> Crear Producto
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 p-2 sm:p-4 bg-white rounded shadow">
                <input
                    type="text"
                    placeholder="Código..."
                    value={filterCodigo}
                    onChange={(e) => setFilterCodigo(e.target.value)}
                    className="p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                />
                <input
                    type="text"
                    placeholder="Nombre..."
                    value={filterNombre}
                    onChange={(e) => setFilterNombre(e.target.value)}
                    className="p-2 border rounded text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                />
                <select
                    value={selectedExistencia}
                    onChange={(e) => setSelectedExistencia(e.target.value)}
                    className="p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                >
                    <option value="todas">Todas existencias</option>
                    <option value="con_existencia">Con existencia</option>
                    <option value="sin_existencia">Sin existencia</option>
                </select>
            </div>

            <div>
                <div className="block sm:hidden space-y-3">
                    {isLoading && pageNumber === 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
                    {!isLoading && products.length === 0 && pageNumber === 1 && (
                        <p className="text-center py-4 text-gray-500">No hay productos para mostrar.</p>
                    )}
                    {products.map((product) => (
                        <div key={product.art_sec} className="bg-white p-3 rounded shadow border border-gray-200 hover:border-[#f58ea3] transition-colors">
                            <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-sm">{product.art_cod}</span>
                                        <span className="flex-shrink-0">
                                            {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 break-words mb-2">{product.art_nom}</p>
                                </div>
                                <div className="flex flex-col space-y-1 flex-shrink-0">
                                    <button onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Editar">
                                        <FaEdit className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(product.art_sec)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Eliminar">
                                        <FaTrash className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleViewMovements(product.art_cod)}
                                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                                        title="Ver Movimientos">
                                        <FaHistory className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 border-t pt-2 mt-2 text-xs">
                                <div className="text-center">
                                    <span className="text-gray-500 block">Exist.</span>
                                    <span className="font-medium text-[#f58ea3]">{product.existencia}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-500 block">P. Detal</span>
                                    <span className="font-medium text-[#f58ea3]">{formatPrice(product.precio_detal)}</span>
                                </div>
                                <div className="text-center">
                                    <span className="text-gray-500 block">P. Mayor</span>
                                    <span className="font-medium text-[#f58ea3]">{formatPrice(product.precio_mayor)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && pageNumber > 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
                </div>

                <div className="hidden sm:block overflow-x-auto bg-white rounded shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#fff5f7]">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Exist.</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">P. Detal</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">P. Mayor</th>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider" title="Estado Sincronización WooCommerce">
                                    <FaSyncAlt className="inline-block text-[#f58ea3]" />
                                </th>
                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading && pageNumber === 1 && (
                                <tr><td colSpan="7" className="text-center py-4"><LoadingSpinner /></td></tr>
                            )}
                            {!isLoading && products.length === 0 && pageNumber === 1 && (
                                <tr><td colSpan="7" className="text-center py-4 text-gray-500">No hay productos para mostrar.</td></tr>
                            )}
                            {products.map((product) => (
                                <tr key={product.art_sec} className="hover:bg-[#fff5f7] transition-colors">
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{product.art_cod}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{product.art_nom}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{product.existencia}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{formatPrice(product.precio_detal)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">{formatPrice(product.precio_mayor)}</td>
                                    <td className="px-2 py-2 whitespace-nowrap text-center">
                                        {renderSyncStatus(product.art_woo_sync_status, product.art_woo_sync_message)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => navigate(`/products/edit/${product.art_sec}`)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => handleDelete(product.art_sec)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Eliminar">
                                            <FaTrash />
                                        </button>
                                        <button onClick={() => handleViewMovements(product.art_cod)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                                            title="Ver Movimientos">
                                            <FaHistory />
                                        </button>
                                        <button onClick={() => handleSyncProduct(product.art_sec, product.art_cod)}
                                            className="text-[#f58ea3] hover:text-[#f7b3c2] transition-colors"
                                            title="Sincronizar con WooCommerce"
                                            disabled={syncingProducts[product.art_sec]}>
                                            {syncingProducts[product.art_sec] ? (
                                                <LoadingSpinner size="small" />
                                            ) : (
                                                <FaSyncAlt />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {isLoading && pageNumber > 1 && (
                                <tr><td colSpan="7" className="text-center py-4"><LoadingSpinner /></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {hasMore && !isLoading && (
                <div className="mt-4 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded w-full sm:w-auto text-sm sm:text-base border border-[#f58ea3] transition-colors"
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
