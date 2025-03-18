// src/components/ProductAdminCard.jsx
import React from 'react';
import { formatValue, formatName } from '../utils';
import PropTypes from 'prop-types';
import { FaEdit } from 'react-icons/fa';

const ProductAdminCard = ({ product, onEdit }) => {
  return (
    <div className="custom-product-card bg-white rounded-lg shadow overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer">
      {/* Header con degradado y menor padding */}
      <div className="px-3 py-2 bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2]">
        <h3 className="text-lg font-bold text-white">{formatName(product.name)}</h3>
        <div className="flex items-center text-xs text-white mt-1">
          <span className="mr-2">Código: {product.id}</span>
          <span>| Woo: {product.art_woo_id}</span>
        </div>
      </div>
      {/* Cuerpo del card */}
      <div className="p-3">
        <div className="mb-2">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Categoría:</span> {product.category}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Existencias:</span> {product.existencia}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Precio Detal:</span>
            <span className="font-bold text-green-600 ml-1">${formatValue(product.price_detal)}</span>
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Precio Mayor:</span>
            <span className="font-bold text-blue-600 ml-1">${formatValue(product.price)}</span>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1 bg-[#f58ea3] text-white px-3 py-1 rounded hover:bg-[#a5762f] transition cursor-pointer"
          >
            <FaEdit />
            <span className="text-sm">Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

ProductAdminCard.propTypes = {
  product: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ProductAdminCard;
