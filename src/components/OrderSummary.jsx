// src/components/OrderSummary.jsx
import React from 'react';
import { FaPlus, FaMinus, FaBox } from 'react-icons/fa';
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
            <li key={item.id} className="py-3">
              <div className="flex gap-3">
                {/* Imagen del producto */}
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.imgUrl ? (
                    <img
                      src={item.imgUrl}
                      alt={formatName(item.name)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900 break-words max-w-full md:max-w-[180px] text-sm leading-snug">
                        {formatName(item.name)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Cód: {item.codigo}
                      </p>
                    </div>
                    <span className="font-bold text-[#f58ea3]">
                      ${formatValue((selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price) * item.quantity)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="bg-[#f7b3c2] text-white p-1.5 rounded-full hover:bg-[#f58ea3] transition-colors cursor-pointer"
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium text-gray-700">
                        {item.quantity} x ${formatValue(selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price)}
                      </span>
                      <button
                        onClick={() => onAdd(item)}
                        disabled={item.quantity >= item.existencia}
                        className={`bg-[#f7b3c2] text-white p-1.5 rounded-full transition-colors cursor-pointer ${
                          item.quantity >= item.existencia 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-[#f58ea3]'
                        }`}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    </div>
                    {item.existencia <= 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                        Sin stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Totales */}
      <div className="mt-6 space-y-3 border-t pt-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-bold text-gray-900">${formatValue(totalValue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Descuento:</span>
          <span className="font-bold text-gray-900">${formatValue(discountValue)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-lg font-semibold text-gray-900">Total:</span>
          <span className="text-lg font-bold text-[#f58ea3]">${formatValue(finalTotal)}</span>
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
