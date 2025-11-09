// src/components/OrderSummary.jsx
import React from 'react';
import { FaPlus, FaMinus, FaBox, FaFire } from 'react-icons/fa';
import { formatValue, formatName } from '../utils';
import PropTypes from 'prop-types';

const OrderSummary = ({ order, onRemove, onAdd, totalValue, selectedPriceType, discountValue, facDescuentoGeneral, porcentajeDescuentoEvento, finalTotal, montoMayorista }) => {
  return (
    <div>
      {order.length === 0 ? (
        <p className="text-gray-500">No se han seleccionado artículos.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {order.map((item) => {
            const tieneOferta = item.tiene_oferta === 'S';
            const precioAMostrar = selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price;
            
            return (
              <li key={item.id} className={`py-3 ${tieneOferta ? 'bg-orange-50 rounded-lg p-2 -mx-2' : ''}`}>
                <div className="flex gap-3">
                  {/* Imagen del producto */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
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
                    {/* Badge de oferta en la imagen */}
                    {tieneOferta && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        <FaFire className="w-2 h-2" />
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={`font-semibold break-words max-w-full md:max-w-[180px] text-sm leading-snug ${
                          tieneOferta ? 'text-orange-800' : 'text-gray-900'
                        }`}>
                          {formatName(item.name)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Cód: {item.codigo}
                        </p>
                        {tieneOferta && item.descripcion_promocion && (
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            {item.descripcion_promocion}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${tieneOferta ? 'text-orange-600' : 'text-[#f58ea3]'}`}>
                          ${formatValue(precioAMostrar * item.quantity)}
                        </span>
                        {tieneOferta && (
                          <div className="flex flex-col gap-0.5">
                            {item.precio_mayor_original && (
                              <div className="text-xs text-gray-500 line-through">
                                ${formatValue(item.precio_mayor_original)}
                              </div>
                            )}
                            {item.precio_detal_original && (
                              <div className="text-xs text-gray-500 line-through">
                                ${formatValue(item.precio_detal_original)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRemove(item.id)}
                          className={`text-white p-1.5 rounded-full transition-colors cursor-pointer ${
                            tieneOferta 
                              ? 'bg-orange-500 hover:bg-orange-600' 
                              : 'bg-[#f7b3c2] hover:bg-[#f58ea3]'
                          }`}
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className={`text-sm font-medium ${
                          tieneOferta ? 'text-orange-700' : 'text-gray-700'
                        }`}>
                          {item.quantity} x ${formatValue(precioAMostrar)}
                        </span>
                        <button
                          onClick={() => onAdd(item)}
                          disabled={item.quantity >= item.existencia}
                          className={`text-white p-1.5 rounded-full transition-colors cursor-pointer ${
                            item.quantity >= item.existencia 
                              ? 'opacity-50 cursor-not-allowed bg-gray-400' 
                              : tieneOferta 
                                ? 'bg-orange-500 hover:bg-orange-600' 
                                : 'bg-[#f7b3c2] hover:bg-[#f58ea3]'
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
            );
          })}
        </ul>
      )}

      {/* Totales */}
      <div className="mt-6 space-y-3 border-t pt-4">
        {montoMayorista && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-semibold text-sm">Monto Mayorista:</span>
              <span className="font-bold text-blue-900 text-base">${formatValue(Number(montoMayorista))}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-bold text-gray-900">${formatValue(totalValue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Descuento:</span>
          <span className="font-bold text-gray-900">${formatValue(discountValue)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            Descuento Evento{porcentajeDescuentoEvento > 0 ? ` (${porcentajeDescuentoEvento}%)` : ''}:
          </span>
          <span className="font-bold text-gray-900">${formatValue(facDescuentoGeneral || 0)}</span>
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
  facDescuentoGeneral: PropTypes.number,
  porcentajeDescuentoEvento: PropTypes.number,
  finalTotal: PropTypes.number.isRequired,
  montoMayorista: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default OrderSummary;
