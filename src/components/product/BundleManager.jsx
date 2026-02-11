import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../config';
import { FaSearch, FaPlus, FaTrash, FaBoxOpen, FaMinus } from 'react-icons/fa';
import debounce from 'lodash/debounce';

const BundleManager = ({ components, onComponentsChange, disabled = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Búsqueda de productos con debounce
  const searchProducts = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem('pedidos_pretty_token');
        const response = await axios.get(`${API_URL}/articulos`, {
          params: {
            nombre: query,
            PageSize: 20,
            PageNumber: 1
          },
          headers: { 'x-access-token': token }
        });

        const products = response.data.articulos || response.data.products || [];

        // Filtrar productos que no sean bundles (evitar bundles dentro de bundles)
        const filteredProducts = products.filter(p => p.art_bundle !== 'S');

        setSearchResults(filteredProducts);
        setShowResults(true);
      } catch (error) {
        console.error('Error buscando productos:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    searchProducts(searchQuery);
  }, [searchQuery, searchProducts]);

  const handleAddComponent = (product) => {
    // Verificar si el componente ya existe
    const existingIndex = components.findIndex(c => c.art_sec === product.art_sec);

    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      const updated = [...components];
      updated[existingIndex].cantidad += 1;
      onComponentsChange(updated);
    } else {
      // Agregar nuevo componente
      onComponentsChange([
        ...components,
        {
          art_sec: product.art_sec,
          art_cod: product.art_cod,
          art_nom: product.art_nom,
          cantidad: 1,
          stock: product.existencia || 0
        }
      ]);
    }

    // Limpiar búsqueda
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleRemoveComponent = (index) => {
    onComponentsChange(components.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseInt(newQuantity, 10);
    if (isNaN(quantity) || quantity < 1) return;

    const updated = [...components];
    updated[index].cantidad = quantity;
    onComponentsChange(updated);
  };

  const incrementQuantity = (index) => {
    const updated = [...components];
    updated[index].cantidad += 1;
    onComponentsChange(updated);
  };

  const decrementQuantity = (index) => {
    const updated = [...components];
    if (updated[index].cantidad > 1) {
      updated[index].cantidad -= 1;
      onComponentsChange(updated);
    }
  };

  const getStockStatus = (stock, quantity) => {
    if (stock >= quantity * 10) return { color: 'text-green-600', bg: 'bg-green-50', icon: '✅', label: 'Excelente' };
    if (stock >= quantity * 5) return { color: 'text-green-500', bg: 'bg-green-50', icon: '✅', label: 'Bueno' };
    if (stock >= quantity) return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: '⚠️', label: 'Justo' };
    return { color: 'text-red-600', bg: 'bg-red-50', icon: '❌', label: 'Insuficiente' };
  };

  return (
    <div className="space-y-4 p-5 bg-[#fffef9] border border-[#f5cad4] rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <FaBoxOpen className="text-[#f58ea3] text-xl" />
        <h3 className="text-gray-700 font-semibold text-lg">
          Componentes del Bundle
          {components.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({components.length} {components.length === 1 ? 'producto' : 'productos'})
            </span>
          )}
        </h3>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowResults(true)}
              placeholder="Buscar productos para agregar..."
              className="w-full pl-10 pr-4 py-3 border border-[#f5cad4] rounded-xl bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition text-sm"
              disabled={disabled}
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#f58ea3] border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-[#f5cad4] rounded-xl shadow-xl max-h-80 overflow-y-auto">
            {searchResults.map((product) => {
              const isAdded = components.some(c => c.art_sec === product.art_sec);
              return (
                <button
                  key={product.art_sec}
                  type="button"
                  onClick={() => handleAddComponent(product)}
                  disabled={disabled}
                  className={`w-full px-4 py-3 text-left hover:bg-pink-50 transition-colors border-b border-gray-100 last:border-0 flex items-center justify-between group ${
                    isAdded ? 'bg-pink-50/50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{product.art_nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{product.art_cod}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-xs font-medium ${
                        product.existencia > 0 ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {product.existencia || 0} en stock
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {isAdded ? (
                      <span className="text-[#f58ea3] text-xs font-medium">Agregado ✓</span>
                    ) : (
                      <FaPlus className="text-[#f58ea3] group-hover:scale-110 transition-transform" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showResults && searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-[#f5cad4] rounded-xl shadow-xl p-4 text-center">
            <p className="text-gray-500 text-sm">No se encontraron productos</p>
          </div>
        )}
      </div>

      {/* Lista de componentes seleccionados */}
      {components.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {components.map((component, index) => {
            const status = getStockStatus(component.stock, component.cantidad);

            return (
              <div
                key={index}
                className="bg-white border border-[#f5cad4] rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative group"
              >
                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => handleRemoveComponent(index)}
                  disabled={disabled}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Eliminar componente"
                >
                  <FaTrash className="w-3 h-3" />
                </button>

                {/* Información del producto */}
                <div className="pr-8">
                  <h4 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">
                    {component.art_nom}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">{component.art_cod}</p>

                  {/* Indicador de stock */}
                  <div className={`${status.bg} ${status.color} px-2 py-1 rounded-lg text-xs font-medium mb-3 flex items-center gap-1.5`}>
                    <span>{status.icon}</span>
                    <span>{component.stock} disponibles</span>
                    {component.stock < component.cantidad && (
                      <span className="ml-auto font-bold">
                        (Faltan {component.cantidad - component.stock})
                      </span>
                    )}
                  </div>

                  {/* Control de cantidad */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Cantidad:</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => decrementQuantity(index)}
                        disabled={disabled || component.cantidad <= 1}
                        className="p-1 rounded bg-[#f7b3c2]/40 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FaMinus className="w-2.5 h-2.5" />
                      </button>
                      <input
                        type="number"
                        value={component.cantidad}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        min="1"
                        disabled={disabled}
                        className="w-12 px-2 py-1 text-center border border-[#f5cad4] rounded-lg text-sm font-semibold focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => incrementQuantity(index)}
                        disabled={disabled}
                        className="p-1 rounded bg-[#f7b3c2]/40 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FaPlus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 px-4 bg-white/50 rounded-xl border border-dashed border-[#f5cad4]">
          <FaBoxOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm font-medium">No hay componentes agregados</p>
          <p className="text-gray-400 text-xs mt-1">
            Busca y agrega productos para armar tu bundle/combo
          </p>
        </div>
      )}

      {/* Información adicional */}
      {components.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            <strong>💡 Nota:</strong> El precio del bundle es independiente. Los componentes se descontarán del inventario al vender el bundle.
          </p>
        </div>
      )}
    </div>
  );
};

export default BundleManager;
