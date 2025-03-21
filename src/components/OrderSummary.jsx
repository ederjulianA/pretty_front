// src/components/OrderSummary.jsx
import React from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { formatValue, formatName } from '../utils';
import PropTypes from 'prop-types';

const OrderSummary = ({ order, onRemove, onAdd, totalValue, selectedPriceType, discountValue, finalTotal }) => {
  return (
    <div>
      {order.length === 0 ? (
        <p className="text-gray-500">No se han seleccionado artículos.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {order.map((item) => (
            <li key={item.id} className="py-2 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-700">{formatName(item.name)}</p>
                <p className="text-sm text-gray-500">
                  Cant: {item.quantity} x ${formatValue(
                    selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price
                  )}
                  {item.existencia <= 0 && (
                    <span className="ml-2 inline-block bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                      Sin stock
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRemove(item.id)}
                  className="bg-[#f7b3c2] text-white p-2 rounded-full hover:bg-[#a5762f] cursor-pointer"
                >
                  <FaMinus />
                </button>
                <span className="font-bold text-gray-800">
                  ${formatValue((selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price) * item.quantity)}
                </span>
                <button
                  onClick={() => onAdd(item)}
                  disabled={item.quantity >= item.existencia}
                  className={`bg-[#f7b3c2] text-white p-2 rounded-full transition cursor-pointer ${
                    item.quantity >= item.existencia ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#a5762f]'
                  }`}
                >
                  <FaPlus />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-6 border-t pt-4">
        <div className="flex justify-between">
          <span className="font-semibold text-gray-700">Subtotal:</span>
          <span className="font-bold text-gray-800">${formatValue(totalValue)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-semibold text-gray-700">Descuento:</span>
          <span className="font-bold text-gray-800">${formatValue(discountValue)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-semibold text-gray-700">Total Compra:</span>
          <span className="font-bold text-gray-800">${formatValue(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
};

OrderSummary.propTypes = {
  order: PropTypes.array.isRequired,
  onRemove: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  totalValue: PropTypes.number.isRequired,
  selectedPriceType: PropTypes.string.isRequired,
  discountValue: PropTypes.number.isRequired,
  finalTotal: PropTypes.number.isRequired,
};

export default OrderSummary;
