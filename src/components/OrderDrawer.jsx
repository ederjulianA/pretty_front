// src/components/OrderDrawer.js
import React from 'react';
import OrderSummary from './OrderSummary';
import { FaTimes } from 'react-icons/fa';

const OrderDrawer = ({
  order,
  onRemove,
  onAdd,
  totalValue,
  onClose,
  selectedClient,
  onShowClientModal,
  onPlaceOrder,
  selectedPriceType, // [NUEVO] Se recibe el tipo de precio seleccionado
  onPriceTypeChange  // [NUEVO] Función para cambiar el tipo de precio
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end cursor-pointer">
      <div className="w-4/5 bg-white p-4 overflow-y-auto transform transition-transform duration-300 cursor-pointer">
        <div className="flex justify-between items-center mb-4 cursor-pointer">
          <h2 className="text-xl font-bold text-gray-800 cursor-pointer">Resumen de Pedidos</h2>
          <button onClick={onClose} className="text-2xl text-gray-600 cursor-pointer">
            <FaTimes />
          </button>
        </div>
        {/* [NUEVO] Combo para elegir el tipo de precio */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1 cursor-pointer">
            Seleccione tipo de precio:
          </label>
          <select
            value={selectedPriceType}
            onChange={onPriceTypeChange}
            className="w-full p-2 border rounded cursor-pointer"
          >
            <option value="mayor">Precios al Mayor</option>
            <option value="detal">Precios al Detal</option>
          </select>
        </div>
        {/* Sección de Selección de Cliente */}
        <div className="mb-4 p-4 border rounded-lg cursor-pointer">
          <p className="text-sm text-gray-600 mb-1 cursor-pointer">Cliente:</p>
          {selectedClient ? (
            <div className="flex justify-between items-center cursor-pointer">
              <div className="cursor-pointer">
                <p className="font-medium cursor-pointer">
                  {selectedClient.nit_nom.trim() || "Sin nombre"}
                </p>
                <p className="text-xs text-gray-500 cursor-pointer">
                  {selectedClient.nit_ide}
                </p>
              </div>
              <button
                onClick={onShowClientModal}
                className="text-blue-600 underline text-sm cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={onShowClientModal}
              className="w-full bg-blue-500 text-white py-2 rounded-md cursor-pointer"
            >
              Seleccionar Cliente
            </button>
          )}
        </div>
        {/* Resumen de Pedidos */}
        <OrderSummary
          order={order}
          onRemove={onRemove}
          onAdd={onAdd}
          totalValue={totalValue}
          selectedPriceType={selectedPriceType} // Se pasa para actualizar el precio de cada ítem
        />
        {/* Botón para Realizar Pedido */}
        <div className="mt-6 border-t pt-4 cursor-pointer">
          <button
            onClick={onPlaceOrder}
            className="w-full bg-[#f58ea3] text-white px-4 py-2 rounded-md shadow-lg hover:bg-[#a5762f] mt-4 cursor-pointer"
          >
            Realizar Pedido
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDrawer;
