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
  onCreateClient,         // [NUEVO] Callback para crear cliente
  onPlaceOrder,
  selectedPriceType,      // [NUEVO] Tipo de precio ("mayor" o "detal")
  onPriceTypeChange,      // [NUEVO] Función para cambiar el tipo de precio
  discountPercent,        // [NUEVO] % de descuento actual
  onDiscountChange,       // [NUEVO] Función para actualizar el % de descuento
  discountValue,          // [NUEVO] Valor calculado del descuento
  finalTotal              // [NUEVO] Total final de la compra (totalValue - discountValue)
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
        {/* [NUEVO] Combo para seleccionar el tipo de precio */}
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
        {/* [NUEVO] Input para ingresar % de descuento */}
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1 cursor-pointer">
            Descuento (%):
          </label>
          <input
            type="number"
            value={discountPercent}
            onChange={onDiscountChange}
            className="w-full p-2 border rounded cursor-pointer"
          />
        </div>
        {/* Sección de selección de cliente */}
        <div className="mb-4 p-4 border rounded-lg cursor-pointer">
          <p className="text-sm text-gray-600 mb-1 cursor-pointer">Cliente:</p>
          {selectedClient ? (
            <div className="flex justify-between items-center cursor-pointer">
              <div className="cursor-pointer">
                <p className="font-medium cursor-pointer">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                <p className="text-xs text-gray-500 cursor-pointer">{selectedClient.nit_ide}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={onShowClientModal}
                  className="text-blue-600 underline text-sm cursor-pointer"
                >
                  Cambiar
                </button>
                {/* [NUEVO] Botón para crear cliente */}
                <button
                  onClick={onCreateClient}
                  className="text-blue-600 underline text-sm cursor-pointer"
                >
                  Crear Cliente
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <button
                onClick={onShowClientModal}
                className="w-full bg-blue-500 text-white py-2 rounded-md cursor-pointer"
              >
                Seleccionar Cliente
              </button>
              {/* [NUEVO] Botón para crear cliente cuando no hay uno seleccionado */}
              <button
                onClick={onCreateClient}
                className="w-full bg-[#f58ea3] text-white py-2 rounded-md cursor-pointer"
              >
                Crear Cliente
              </button>
            </div>
          )}
        </div>
        {/* Resumen de Pedidos */}
        <OrderSummary
          order={order}
          onRemove={onRemove}
          onAdd={onAdd}
          totalValue={totalValue}
          selectedPriceType={selectedPriceType} // [NUEVO]
          discountValue={discountValue}         // [NUEVO]
          finalTotal={finalTotal}               // [NUEVO]
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
