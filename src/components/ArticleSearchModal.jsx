import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaCheckCircle } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import useProducts from '../hooks/useProducts';
import debounce from 'lodash/debounce'; // Asegúrate de tener lodash instalado

const ArticleSearchModal = ({ isOpen, onClose, onSelectArticle }) => {
  // Estados para los filtros
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  
  // Contenedor para el scroll infinito
  const containerRef = useRef(null);

  // Usar el hook useProducts
  const { products, fetchProducts, pageNumber, hasMore, isLoading } = useProducts(
    {
      filterCodigo,
      filterNombre,
      filterExistencia: ''
    },
    "todas"
  );

  // Implementar debounce para las búsquedas
  const debouncedFetchProducts = useCallback(
    debounce(() => {
      fetchProducts(1);
    }, 300),
    [fetchProducts]
  );

  // Efecto para manejar cambios en los filtros
  useEffect(() => {
    debouncedFetchProducts();
    return () => {
      debouncedFetchProducts.cancel();
    };
  }, [filterCodigo, filterNombre, debouncedFetchProducts]);

  // Manejar el scroll infinito
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchProducts(pageNumber + 1);
        }
      },
      { threshold: 1.0 }
    );

    const loadMoreTrigger = containerRef.current;
    observer.observe(loadMoreTrigger);

    return () => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
    };
  }, [hasMore, isLoading, pageNumber, fetchProducts]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-2 sm:p-4 border-b flex justify-between items-center">
          <h2 className="text-base sm:text-xl font-bold">Búsqueda de Artículos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-2 sm:p-4 border-b bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterCodigo}
                  onChange={(e) => setFilterCodigo(e.target.value)}
                  className="w-full p-1 sm:p-2 border rounded pr-8 sm:pr-10 text-sm"
                  placeholder="Buscar por código..."
                />
                <FaSearch className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filterNombre}
                  onChange={(e) => setFilterNombre(e.target.value)}
                  className="w-full p-1 sm:p-2 border rounded pr-8 sm:pr-10 text-sm"
                  placeholder="Buscar por nombre..."
                />
                <FaSearch className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Responsive */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Vista móvil: Lista de tarjetas */}
          <div className="block sm:hidden flex-1 overflow-auto">
            <div className="divide-y divide-gray-200">
              {products.map((product, index) => (
                <div 
                  key={`${product.id}-${product.codigo}-${index}`}
                  className="p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">{product.codigo}</div>
                      <div className="text-sm text-gray-600">{product.name}</div>
                    </div>
                    <button
                      onClick={() => onSelectArticle(product)}
                      className="text-green-600 hover:text-green-800 p-2"
                      title="Seleccionar artículo"
                    >
                      <FaCheckCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Existencia: {product.existencia}</div>
                    <div>Detal: {product.price_detal}</div>
                    <div>Mayor: {product.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vista desktop: Tabla tradicional */}
          <div className="hidden sm:flex flex-col flex-1">
            <div className="bg-gray-50 border-b">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seleccionar
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Existencia
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P. Detal
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P. Mayor
                    </th>
                  </tr>
                </thead>
              </table>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="min-w-full">
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr 
                      key={`${product.id}-${product.codigo}-${index}`}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => onSelectArticle(product)}
                          className="text-green-600 hover:text-green-800"
                          title="Seleccionar artículo"
                        >
                          <FaCheckCircle className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {product.codigo}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {product.existencia}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {product.price_detal}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {product.price}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Estado de carga */}
          <div ref={containerRef} className="p-2 sm:p-4 flex justify-center">
            {isLoading && <LoadingSpinner />}
            {!isLoading && products.length === 0 && (
              <p className="text-sm text-gray-500">No se encontraron resultados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleSearchModal; 