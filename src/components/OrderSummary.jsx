// src/components/OrderSummary.jsx
import React, { useState } from 'react';
import { FaPlus, FaMinus, FaBox, FaFire, FaEdit, FaCheck, FaTimes, FaCubes } from 'react-icons/fa';
import { formatValue, formatName } from '../utils';
import PropTypes from 'prop-types';

const OrderSummary = ({ order, onRemove, onAdd, totalValue, selectedPriceType, discountValue, facDescuentoGeneral, porcentajeDescuentoEvento, finalTotal, montoMayorista, eventoPromocional, hayEventoActivo, cumpleUmbralMayorista, onUpdateMontoMayorista, onShowBundleDetails }) => {
  const [isEditingMonto, setIsEditingMonto] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleEditClick = () => {
    setIsEditingMonto(true);
    setNuevoMonto(montoMayorista || '');
    setError('');
  };

  const handleCancel = () => {
    setIsEditingMonto(false);
    setNuevoMonto('');
    setError('');
  };

  const handleUpdate = async () => {
    setError('');
    
    // Validar que el monto sea mayor a 0
    const montoNum = Number(nuevoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    // Validar que no sea el mismo monto
    const montoActual = Number(montoMayorista);
    if (montoNum === montoActual) {
      setError('Debe ingresar un monto diferente al actual');
      return;
    }

    setIsUpdating(true);
    try {
      if (onUpdateMontoMayorista) {
        await onUpdateMontoMayorista(nuevoMonto);
        setIsEditingMonto(false);
        setNuevoMonto('');
      }
    } catch (err) {
      setError('Error al actualizar el monto mayorista');
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <div>
      {order.length === 0 ? (
        <p className="text-gray-500">No se han seleccionado artículos.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {order.map((item) => {
            const tieneOferta = item.tiene_oferta === 'S';
            const esBundle = item.art_bundle === 'S';
            const precioAMostrar = selectedPriceType === 'detal' && item.price_detal ? item.price_detal : item.price;

            // Determinar si el artículo recibe descuento evento (no tiene descuento activo Y no es bundle)
            // kar_des_uno es el descuento general de la orden, no un descuento individual del artículo
            // Solo los artículos con oferta activa tienen descuento individual
            // Los bundles NO reciben descuento de evento
            const tieneDescuentoActivo = tieneOferta;
            const recibeDescuentoEvento = hayEventoActivo && !tieneDescuentoActivo && !esBundle && porcentajeDescuentoEvento > 0;

            return (
              <li key={item.id} className={`py-3 ${
                tieneOferta
                  ? 'bg-orange-50 rounded-lg p-2 -mx-2'
                  : esBundle
                    ? 'bg-emerald-50 rounded-lg p-2 -mx-2 border border-emerald-100'
                    : ''
              }`}>
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
                    {/* Badge de bundle en la imagen */}
                    {esBundle && !tieneOferta && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        <FaCubes className="w-2 h-2" />
                      </div>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          <h3
                            onClick={() => esBundle && onShowBundleDetails && onShowBundleDetails(item)}
                            className={`font-semibold break-words max-w-full md:max-w-[180px] text-sm leading-snug ${
                              tieneOferta
                                ? 'text-orange-800'
                                : esBundle
                                  ? 'text-emerald-800 cursor-pointer hover:text-emerald-600 hover:underline'
                                  : 'text-gray-900'
                            }`}
                            title={esBundle ? 'Clic para ver detalles del combo' : ''}
                          >
                            {formatName(item.name)}
                          </h3>
                          {esBundle && !tieneOferta && (
                            <button
                              onClick={() => onShowBundleDetails && onShowBundleDetails(item)}
                              className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 hover:bg-emerald-200 transition-colors cursor-pointer"
                              title="Ver detalles del combo"
                            >
                              <FaCubes className="w-2 h-2" />
                              COMBO
                            </button>
                          )}
                        </div>
                        <p className={`text-sm ${esBundle ? 'text-emerald-600' : 'text-gray-500'}`}>
                          Cód: {item.codigo}
                        </p>
                        {/* Badge de descuento evento */}
                        {recibeDescuentoEvento && eventoPromocional && (
                          <div className="mt-2 mb-1">
                            <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] border-2 border-[#f58ea3] rounded-lg px-2.5 py-1.5 flex items-center gap-2 inline-flex">
                              <span className="text-white text-xs font-bold whitespace-nowrap">
                                {eventoPromocional.eve_nombre}
                              </span>
                              <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                -{porcentajeDescuentoEvento}%
                              </span>
                            </div>
                          </div>
                        )}
                        {tieneOferta && item.descripcion_promocion && (
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            {item.descripcion_promocion}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`font-bold ${
                          tieneOferta
                            ? 'text-orange-600'
                            : esBundle
                              ? 'text-emerald-600'
                              : 'text-[#f58ea3]'
                        }`}>
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
                              : esBundle
                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                : 'bg-[#f7b3c2] hover:bg-[#f58ea3]'
                          }`}
                        >
                          <FaMinus className="w-3 h-3" />
                        </button>
                        <span className={`text-sm font-medium ${
                          tieneOferta
                            ? 'text-orange-700'
                            : esBundle
                              ? 'text-emerald-700'
                              : 'text-gray-700'
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
                                : esBundle
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
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
            {!isEditingMonto ? (
              <div className="flex justify-between items-center">
                <span className="text-blue-700 font-semibold text-sm">Monto Mayorista:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-900 text-base">${formatValue(Number(montoMayorista))}</span>
                  {onUpdateMontoMayorista && (
                    <button
                      onClick={handleEditClick}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                      title="Editar monto mayorista"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-blue-700 font-semibold text-sm mb-1">
                  Editar Monto Mayorista:
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={nuevoMonto}
                    onChange={(e) => {
                      setNuevoMonto(e.target.value);
                      setError('');
                    }}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ingrese el monto"
                    min="1"
                    step="0.01"
                    disabled={isUpdating}
                  />
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Actualizar"
                  >
                    <FaCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUpdating}
                    className="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    title="Cancelar"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-xs mt-1">{error}</p>
                )}
              </div>
            )}
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
  eventoPromocional: PropTypes.object,
  hayEventoActivo: PropTypes.bool,
  cumpleUmbralMayorista: PropTypes.bool,
  onUpdateMontoMayorista: PropTypes.func,
  onShowBundleDetails: PropTypes.func,
};

export default OrderSummary;
