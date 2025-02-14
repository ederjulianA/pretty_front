// src/components/ProductCard.js
import React from 'react';
import { formatValue, formatName } from '../utils';
import { FaShoppingCart } from 'react-icons/fa';

const ProductCard = ({ product, onAdd, orderQuantity }) => (
  <div
    onClick={() => product.existencia > 0 && onAdd(product)}
    className={`bg-white rounded-lg shadow p-4 transition flex flex-col relative cursor-pointer ${
      product.existencia <= 0 ? "opacity-50 cursor-not-allowed" : "hover:shadow-xl"
    }`}
  >
    {/* Badge de existencias */}
    <span
      className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full cursor-pointer ${
        product.existencia > 0 ? "bg-[#f58ea3] text-white" : "bg-[#f7b3c2] text-white"
      }`}
    >
      Existencias: {product.existencia > 0 ? product.existencia : "Sin stock"}
    </span>
    <div className="h-24 bg-gray-200 rounded-md flex items-center justify-center mb-2 cursor-pointer">
      {product.imgUrl ? (
        <img
          src={product.imgUrl}
          alt={formatName(product.name)}
          className="h-full w-full object-cover rounded-md"
        />
      ) : (
        <span className="text-gray-500 text-sm">Imagen</span>
      )}
    </div>
    <h2 className="text-lg font-semibold text-gray-800 cursor-pointer">
      {formatName(product.name)}
    </h2>
    <p className="text-gray-500 text-sm cursor-pointer">{product.category}</p>
    <p className="text-[#f58ea3] font-bold mt-auto cursor-pointer">
      ${formatValue(product.price)}
    </p>
    {/* Icono de carrito cuando el producto ya está agregado */}
    {orderQuantity > 0 && (
      <div className="absolute bottom-2 right-2 flex items-center bg-[#f58ea3] rounded-full p-1 shadow cursor-pointer">
        <FaShoppingCart className="text-white" />
        <span className="text-xs font-semibold text-white ml-1">{orderQuantity}</span>
      </div>
    )}
  </div>
);

export default ProductCard;
