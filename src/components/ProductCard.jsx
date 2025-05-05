// src/components/ProductCard.js
import React from 'react';
import { formatValue, formatName } from '../utils';
import { FaShoppingCart, FaPlus, FaBox } from 'react-icons/fa';

const ProductCard = ({ product, onAdd, orderQuantity }) => (
  <div
    onClick={() => product.existencia > 0 && onAdd(product)}
    className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full border border-gray-100 cursor-pointer`}
  >
    {/* Header del card más delgado y elegante */}
    <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] px-3 py-2 rounded-t-xl flex flex-col gap-0.5 min-h-[2.2rem]">
      <h3 className="text-base font-bold text-white leading-tight break-words line-clamp-2">{product.name}</h3>
    </div>
    {/* Imagen */}
    <div className="flex-1 flex items-center justify-center p-2 bg-gray-50 rounded-b-xl">
      {product.imgUrl ? (
        <img src={product.imgUrl} alt={product.name} className="object-contain h-24 w-24 rounded-md" />
      ) : (
        <div className="h-24 w-24 flex items-center justify-center bg-gray-200 rounded-md">
          <FaBox className="w-8 h-8 text-gray-400" />
        </div>
      )}
    </div>
    {/* Info de precios y stock */}
    <div className="px-3 pb-2 pt-2 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#f58ea3]">${formatValue(product.price)}</span>
        {product.price_detal && (
          <span className="text-xs font-semibold text-[#a5762f]">${formatValue(product.price_detal)}</span>
        )}
        {product.existencia > 0 ? (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{product.existencia} en stock</span>
        ) : (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Sin stock</span>
        )}
      </div>
      {/* Sección de código y categoría */}
      <div className="flex flex-col mt-1 gap-0.5">
        <span className="text-xs text-gray-500 font-mono">Cód: {product.codigo}</span>
        <span className="text-xs text-gray-400 truncate">{product.category}</span>
      </div>
      <button
        onClick={() => onAdd(product)}
        disabled={product.existencia <= 0}
        className={`mt-2 w-full py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
          ${product.existencia <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#f58ea3] text-white hover:bg-[#f7b3c2]'}`}
      >
        <FaShoppingCart className="w-4 h-4" />
        Agregar
      </button>
    </div>
  </div>
);

export default ProductCard;
