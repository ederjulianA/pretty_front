// src/components/OrderDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import PropTypes from 'prop-types';
import axios from 'axios';
import { API_URL } from '../config';
import { formatValue } from '../utils';

const OrderDetailModal = ({ order, onClose }) => {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (order && order.fac_nro) {
      axios
        .get(`${API_URL}/order/${order.fac_nro}`)
        .then((response) => {
          // Se espera que la respuesta tenga la estructura:
          // { success: true, order: { header: {...}, details: [...] } }
          setOrderData(response.data.order);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error al obtener el detalle de la orden:', error);
          setLoading(false);
        });
    }
  }, [order]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-700">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  if (!orderData || !orderData.header) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <p className="text-gray-700">No se encontraron detalles del pedido.</p>
        </div>
      </div>
    );
  }

  const { header, details } = orderData;

  // Cálculo de totales
  const computedSubtotal =
    details && details.length > 0
      ? details.reduce((acc, item) => acc + item.kar_pre_pub * item.kar_uni, 0)
      : 0;
  const computedDiscount =
    details && details.length > 0
      ? details.reduce(
          (acc, item) =>
            acc + item.kar_pre_pub * item.kar_uni * (item.kar_des_uno / 100),
          0
        )
      : 0;
  const computedTotal = computedSubtotal - computedDiscount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
      <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 shadow-lg cursor-pointer max-h-[90vh] overflow-hidden">
        {/* Encabezado fijo con sticky */}
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="text-xl font-bold">Detalle del Pedido</h3>
          <button onClick={onClose} className="text-2xl text-gray-600 cursor-pointer">
            <FaTimes />
          </button>
        </div>
        {/* Encabezado del Pedido */}
        <div className="mb-4">
          <p className="text-sm text-gray-700">
            <strong>Fecha:</strong> {new Date(header.fac_fec).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-700">
            <strong># Pedido:</strong> {header.fac_nro || 'N/A'}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Cliente:</strong> {header.nit_nom} ({header.nit_ide})
          </p>
        </div>
        {/* Detalle de Ítems con scroll */}
        {details && details.length > 0 ? (
          <div className="overflow-y-auto" style={{ maxHeight: "300px" }}>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-1">Código</th>
                  <th className="text-left px-2 py-1">Artículo</th>
                  <th className="text-right px-2 py-1">Cantidad</th>
                  <th className="text-right px-2 py-1">Precio Unitario</th>
                  <th className="text-right px-2 py-1">% Desc</th>
                  <th className="text-right px-2 py-1">Descuento</th>
                  <th className="text-right px-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {details.map((item, index) => {
                  const unitPrice = item.kar_pre_pub;
                  const quantity = item.kar_uni;
                  const discountPercentage = item.kar_des_uno;
                  const discountAmount = unitPrice * quantity * (discountPercentage / 100);
                  const totalItem = unitPrice * quantity - discountAmount;
                  return (
                    <tr key={index} className="border-b">
                      <td className="px-2 py-1">{item.art_cod || item.art_sec}</td>
                      <td className="px-2 py-1">{item.art_nom}</td>
                      <td className="px-2 py-1 text-right">{quantity}</td>
                      <td className="px-2 py-1 text-right">${formatValue(unitPrice)}</td>
                      <td className="px-2 py-1 text-right">{discountPercentage}%</td>
                      <td className="px-2 py-1 text-right">${formatValue(discountAmount)}</td>
                      <td className="px-2 py-1 text-right">${formatValue(totalItem)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No se encontraron detalles del pedido.</p>
        )}
        {/* Sección de totales debajo de la grilla */}
        <div className="mt-4 text-right">
          <p className="text-sm text-gray-700">
            <strong>Subtotal:</strong> ${formatValue(computedSubtotal)}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Descuento:</strong> ${formatValue(computedDiscount)}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Total Pedido:</strong> ${formatValue(computedTotal)}
          </p>
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
