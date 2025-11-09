// src/components/OrderDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaBoxOpen } from 'react-icons/fa';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_URL } from '../config';
import { formatValue } from '../utils';

const OrderDetailModal = ({ order, onClose }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order && order.fac_nro) {
      // Reiniciar estado al cambiar de orden
      setLoading(true);
      setOrderData(null);
      
      axios
        .get(`${API_URL}/order/${order.fac_nro}`)
        .then((response) => {
          setOrderData(response.data.order);
        })
        .catch((error) => {
          console.error('Error al obtener el detalle de la orden:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [order]);

  const renderLoadingOrError = (message) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        {loading && <FaSpinner className="animate-spin text-4xl text-[#f58ea3]" />}
        <p className="text-lg font-medium text-gray-800">{message}</p>
        {!loading && (
           <button 
             onClick={onClose} 
             className="mt-4 bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded transition-colors"
           >
             Cerrar
           </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return renderLoadingOrError('Cargando detalles...');
  }

  if (!orderData || !orderData.header) {
    return renderLoadingOrError('No se encontraron detalles del pedido.');
  }

  const { header, details } = orderData;

  const computedSubtotal = details?.reduce((acc, item) => acc + item.kar_pre_pub * item.kar_uni, 0) || 0;
  const computedDiscount = details?.reduce((acc, item) => acc + item.kar_pre_pub * item.kar_uni * (item.kar_des_uno / 100), 0) || 0;
  const facDescuentoGeneral = header.fac_descuento_general || 0;
  const computedTotal = computedSubtotal - computedDiscount - facDescuentoGeneral;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#fff5f7] rounded-t-lg">
          <div className="flex items-center space-x-3">
            <FaBoxOpen className="text-[#f58ea3] text-2xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Detalle del Pedido #{header.fac_nro || 'N/A'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Article Info */}
          <div className="bg-[#fff5f7] p-4 rounded-lg border border-[#f58ea3]/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <span className="text-gray-600 text-sm">Cliente</span>
                <p className="font-medium text-gray-800">{header.nit_nom} ({header.nit_ide})</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Fecha</span>
                <p className="font-medium text-gray-800">{new Date(header.fac_fec).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
          </div>

          {/* Movements Table */}
          {details && details.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#fff5f7]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Artículo</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Cant.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Desc.</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {details.map((item, index) => {
                    const unitPrice = item.kar_pre_pub;
                    const quantity = item.kar_uni;
                    const discountPercentage = item.kar_des_uno;
                    const discountAmount = unitPrice * quantity * (discountPercentage / 100);
                    const totalItem = unitPrice * quantity - discountAmount;
                    return (
                      <tr key={index} className="hover:bg-[#fff5f7]/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 text-sm">{item.art_nom}</p>
                          <p className="text-gray-500 text-xs">{item.art_cod || item.art_sec}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{quantity}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">${formatValue(unitPrice)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">${formatValue(discountAmount)} ({discountPercentage}%)</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">${formatValue(totalItem)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No hay productos registrados para este pedido.
            </div>
          )}

          {/* Totals section */}
          <div className="mt-auto pt-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal:</p>
                  <p className="font-medium text-gray-800">${formatValue(computedSubtotal)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Descuento:</p>
                  <p className="font-medium text-red-500">-${formatValue(computedDiscount)}</p>
                </div>
                {facDescuentoGeneral > 0 && (
                  <div className="flex justify-between">
                    <p className="text-gray-600">Descuento Evento:</p>
                    <p className="font-medium text-red-500">-${formatValue(facDescuentoGeneral)}</p>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold border-t border-gray-300 pt-3 mt-3">
                  <p className="text-gray-900">Total Pedido:</p>
                  <p className="text-[#f58ea3]">${formatValue(computedTotal)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

OrderDetailModal.propTypes = {
  order: PropTypes.shape({
    fac_nro: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default OrderDetailModal;
