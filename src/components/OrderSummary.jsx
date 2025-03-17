// src/components/OrderSummary.js
import React from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { formatValue, formatName } from '../utils';

const OrderSummary = ({
  order,
  onRemove,
  onAdd,
  totalValue,
  selectedPriceType,
  discountValue,
  finalTotal,
}) => (
  <div>
 
    {order.length === 0 ? (
      <p className="text-gray-500 cursor-pointer">No se han seleccionado artículos.</p>
    ) : (
      <ul className="divide-y divide-gray-200 cursor-pointer">
        {order.map((item) => {
          // Calcula el precio efectivo según el tipo seleccionado
          const effectivePrice =
            selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price;
          const subtotal = effectivePrice * item.quantity;
          return (
            <li key={item.id} className="py-2 flex justify-between items-center cursor-pointer">
              <div className="cursor-pointer">
                <p className="font-semibold text-gray-700 cursor-pointer">{formatName(item.name)}</p>
                <p className="text-sm text-gray-500 cursor-pointer">
                  Cant: {item.quantity} x ${formatValue(effectivePrice)}
                </p>
              </div>
              <div className="flex items-center gap-2 cursor-pointer">
                <button
                  onClick={() => onRemove(item.id)}
                  className="bg-[#f7b3c2] text-white p-2 rounded-full hover:bg-[#a5762f] cursor-pointer"
                >
                  <FaMinus />
                </button>
                <span className="font-bold text-gray-800 cursor-pointer">
                  ${formatValue(subtotal)}
                </span>
                <button
                  onClick={() => onAdd(item)}
                  disabled={item.quantity >= item.existencia}
                  className={`bg-[#f7b3c2] text-white p-2 rounded-full transition cursor-pointer ${
                    item.quantity >= item.existencia
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-[#a5762f]"
                  }`}
                >
                  <FaPlus />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    )}
    {/* Sección de totales */}
    <div className="mt-6 border-t pt-4">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-gray-700">Subtotal:</span>
        <span className="font-bold text-gray-800">${formatValue(totalValue)}</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="font-semibold text-gray-700">Valor Descuento:</span>
        <span className="font-bold text-gray-800">${formatValue(discountValue)}</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="font-semibold text-gray-700">Total Compra:</span>
        <span className="font-bold text-gray-800">${formatValue(finalTotal)}</span>
      </div>
    </div>
  </div>
);

export default OrderSummary;
