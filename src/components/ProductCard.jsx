// src/components/ProductCard.js
import React, { useState } from 'react';
import { formatValue, formatName } from '../utils';
import { FaShoppingCart, FaPlus, FaBox, FaSync, FaFire } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import { toast } from 'react-toastify';

const ProductCard = ({ product, onAdd, orderQuantity, onImageUpdate }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentImage, setCurrentImage] = useState(product.imgUrl);

  const handleSyncImage = async (e) => {
    e.preventDefault(); // Prevenir comportamiento por defecto
    e.stopPropagation(); // Evitar que se propague el click al card
    
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      // Construir y verificar la URL
      const url = `${API_URL}/woo/sync-article-image/${product.codigo}`;
      console.log('URL del endpoint:', url);
      console.log('Código del producto:', product.codigo);
      
      const response = await axios.post(url);
      console.log('Respuesta del servidor:', response.data);
      
      // Verificar si la respuesta es exitosa según la estructura del servidor
      if (response.data && response.data.success) {
        // Actualizar la imagen localmente
        const newImageUrl = response.data.data.image_url;
        setCurrentImage(newImageUrl);
        
        // Notificar al componente padre
        if (onImageUpdate) {
          onImageUpdate(product.id, newImageUrl);
        }
        
        toast.success(response.data.message || 'Imagen actualizada exitosamente');
      } else {
        toast.error(response.data.message || 'Error al actualizar la imagen');
      }
    } catch (error) {
      console.error('Error al sincronizar imagen:', error);
      console.error('Detalles del error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Error al actualizar la imagen');
    } finally {
      setIsSyncing(false);
    }
  };

  // Verificar si el producto tiene oferta
  const tieneOferta = product.tiene_oferta === 'S';

  return (
    <div
      onClick={() => product.existencia > 0 && onAdd(product)}
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full border border-gray-100 cursor-pointer relative overflow-hidden ${
        tieneOferta ? 'ring-2 ring-orange-200 shadow-orange-100' : ''
      }`}
    >
      {/* Header del card con badge de oferta integrado */}
      <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] px-3 py-2 rounded-t-xl flex flex-col gap-0.5 min-h-[2.2rem] relative">
        {/* Badge de oferta en la esquina superior derecha */}
        {tieneOferta && (
          <div className="absolute top-1 right-1 z-10">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
              <FaFire className="w-2.5 h-2.5" />
              {product.descuento_porcentaje ? `${Math.round(product.descuento_porcentaje)}%` : 'OFERTA'}
            </div>
          </div>
        )}
        
        {/* Título con padding ajustado para evitar superposición */}
        <h3 className={`text-base font-bold text-white leading-tight break-words line-clamp-2 ${
          tieneOferta ? 'pr-16' : ''
        }`}>
          {product.name}
        </h3>
      </div>

      {/* Imagen con botón de sincronización */}
      <div className="flex-1 flex items-center justify-center p-2 bg-gray-50 rounded-b-xl relative group">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt={product.name} 
            className="object-contain h-24 w-24 rounded-md"
            onError={() => setCurrentImage(null)} // Si la imagen falla, mostrar el placeholder
          />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded-md">
            <FaBox className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Botón de sincronización que aparece al hacer hover */}
        <button
          onClick={handleSyncImage}
          disabled={isSyncing}
          className={`absolute top-2 right-2 p-2 rounded-full bg-white shadow-md transition-all duration-200 
            ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover:opacity-100 hover:bg-gray-100'}`}
          title="Sincronizar imagen desde WooCommerce"
        >
          <FaSync className={`w-4 h-4 text-[#f58ea3] ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Info de precios y stock */}
      <div className="px-3 pb-2 pt-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`text-sm font-bold ${tieneOferta ? 'text-orange-600' : 'text-[#f58ea3]'}`}>
              ${formatValue(tieneOferta ? product.precio_oferta : product.price)}
            </span>
            {tieneOferta && (
              <div className="flex flex-col gap-0.5">
                {product.precio_mayor_original && (
                  <span className="text-xs text-gray-500 line-through">
                    Mayor: ${formatValue(product.precio_mayor_original)}
                  </span>
                )}
                {product.precio_detal_original && (
                  <span className="text-xs text-gray-500 line-through">
                    Detal: ${formatValue(product.precio_detal_original)}
                  </span>
                )}
              </div>
            )}
          </div>
          {product.price_detal && !tieneOferta && (
            <span className="text-xs font-semibold text-[#a5762f]">${formatValue(product.price_detal)}</span>
          )}
          {product.existencia > 0 ? (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{product.existencia} en stock</span>
          ) : (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Sin stock</span>
          )}
        </div>

        {/* Información adicional de la promoción */}
        {tieneOferta && product.descripcion_promocion && (
          <div className="mt-1 p-1.5 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-xs text-orange-700 font-medium truncate" title={product.descripcion_promocion}>
              {product.descripcion_promocion}
            </p>
          </div>
        )}

        {/* Sección de código y categoría */}
        <div className="flex flex-col mt-1 gap-0.5">
          <span className="text-xs text-gray-500 font-mono">Cód: {product.codigo}</span>
          <span className="text-xs text-gray-400 truncate">{product.category}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
          disabled={product.existencia <= 0}
          className={`mt-2 w-full py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
            product.existencia <= 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : tieneOferta 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600' 
                : 'bg-[#f58ea3] text-white hover:bg-[#f7b3c2]'
          }`}
        >
          <FaShoppingCart className="w-4 h-4" />
          {tieneOferta ? '¡Agregar Oferta!' : 'Agregar'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
