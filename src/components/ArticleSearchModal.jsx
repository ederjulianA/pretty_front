import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaSearch, FaTimes, FaCheckCircle, FaBarcode, FaBox } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';
import useProducts from '../hooks/useProducts';
import debounce from 'lodash/debounce';

const ArticleSearchModal = ({ isOpen, onClose, onSelectArticle }) => {
  // Estados para los filtros
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [activeTab, setActiveTab] = useState('nombre'); // Cambiado a 'nombre' por defecto

  // Contenedor para el scroll infinito
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Efecto para limpiar filtros y enfocar el input cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFilterCodigo('');
      setFilterNombre('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen]);

  // Función para cambiar de tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterCodigo('');
    setFilterNombre('');
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-lg w-full h-full sm:h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-[#fff5f7]">
          <h2 className="text-lg font-bold text-gray-800">Buscar Artículo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs de búsqueda */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'codigo'
              ? 'text-[#f58ea3] border-b-2 border-[#f58ea3]'
              : 'text-gray-500'
              }`}
            onClick={() => handleTabChange('codigo')}
          >
            <FaBarcode className="w-4 h-4" />
            <span className="text-sm font-medium">Código</span>
          </button>
          <button
            className={`flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'nombre'
              ? 'text-[#f58ea3] border-b-2 border-[#f58ea3]'
              : 'text-gray-500'
              }`}
            onClick={() => handleTabChange('nombre')}
          >
            <FaBox className="w-4 h-4" />
            <span className="text-sm font-medium">Nombre</span>
          </button>
        </div>

        {/* Barra de búsqueda */}
        <div className="p-4 border-b bg-white">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={activeTab === 'codigo' ? filterCodigo : filterNombre}
              onChange={(e) => {
                if (activeTab === 'codigo') {
                  setFilterCodigo(e.target.value);
                } else {
                  setFilterNombre(e.target.value);
                }
              }}
              className="w-full p-3 pl-10 border rounded-lg text-base focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
              placeholder={activeTab === 'codigo' ? "Buscar por código..." : "Buscar por nombre..."}
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="flex-1 overflow-auto">
          {isLoading && pageNumber === 1 ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <FaBox className="w-12 h-12 mb-2 text-gray-400" />
              <p className="text-center">No se encontraron artículos</p>
              <p className="text-sm text-center mt-1">Intenta con otro término de búsqueda</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {products.map((product, index) => (
                <div
                  key={`${product.id}-${product.codigo}-${index}`}
                  className="p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => onSelectArticle(product)}
                >
                  <div className="flex gap-4">
                    {/* Imagen del producto */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.imgUrl ? (
                        <img
                          src={product.imgUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaBox className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{product.codigo}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectArticle(product);
                          }}
                          className="text-[#f58ea3] hover:text-[#f7b3c2] p-2"
                        >
                          <FaCheckCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Existencia</span>
                          <p className="font-medium text-gray-900">{product.existencia}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <span className="text-gray-500">Precio</span>
                          <p className="font-medium text-gray-900">${product.price_detal}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 col-span-2">
                          <span className="text-gray-500">Costo promedio</span>
                          <p className="font-medium text-gray-900">
                            {product.average_cost !== null && product.average_cost !== undefined
                              ? `$${product.average_cost}`
                              : 'Sin dato'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trigger para cargar más */}
          <div ref={containerRef} className="p-4">
            {isLoading && pageNumber > 1 && <LoadingSpinner />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleSearchModal; 