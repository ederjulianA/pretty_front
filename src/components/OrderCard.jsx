import React from 'react';
import PropTypes from 'prop-types';
import { formatValue } from '../utils';

const OrderCard = ({ order, onClick }) => {
  const formattedDate = new Date(order.fac_fec).toLocaleDateString();
  const isFacturado = order.documentos && order.documentos !== "";

  return (
    <div 
      onClick={() => onClick && onClick(order)}
      className="relative bg-white rounded-lg shadow p-4 cursor-pointer transform hover:scale-105 transition duration-300"
    >
      {isFacturado && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded">
          FACTURADO
        </div>
      )}
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          <strong>Fecha:</strong> {formattedDate}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          <strong>Cliente:</strong> {order.nit_nom}
        </p>
        <p className="text-xs text-gray-500">
          {order.nit_ide}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          <strong># Pedido:</strong> {order.fac_nro || 'N/A'}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-500">
          <strong>Estado:</strong> {order.fac_est_fac}
        </p>
      </div>
            {/* Mostrar campo Woocommerce si existe */}
            {order.fac_nro_woo && (
            <div className="mb-2">
              <p className="text-sm">
                <strong className="bg-purple-700 text-white px-1 py-0.5 rounded">
                  Woocommerce:
                </strong>
                <span className="ml-1 text-purple-700 font-semibold">
                  {order.fac_nro_woo}
                </span>
              </p>
            </div>
          )}

      {isFacturado && (
        <div className="mb-2">
          <p className="text-sm text-gray-500">
            <strong>Facturado:</strong> {order.documentos}
          </p>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-500">
          <strong>Total:</strong> <span className="font-bold text-[#f58ea3]">${formatValue(order.total_pedido)}</span>
        </p>
      </div>
    </div>
  );
};

OrderCard.propTypes = {
  order: PropTypes.object.isRequired,
  onClick: PropTypes.func,
};

export default OrderCard;
