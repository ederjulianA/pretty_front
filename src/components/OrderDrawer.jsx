// src/components/OrderDrawer.js
import React from 'react';
import OrderSummary from './OrderSummary';
import { FaTimes, FaUser, FaUserPlus, FaShoppingCart } from 'react-icons/fa';

const OrderDrawer = ({
  order,
  onRemove,
  onAdd,
  totalValue,
  onClose,
  selectedClient,
  onShowClientModal,
  onCreateClient,
  onPlaceOrder,
  onFacturarOrder,
  selectedPriceType,
  onPriceTypeChange,
  discountPercent,
  onDiscountChange,
  discountValue,
  finalTotal,
  isEditing,
  orderType
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col md:hidden">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] p-3 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Resumen de Pedido</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        {isEditing && order.length > 0 && (
          <p className="text-center text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full inline-block">
            Editando {orderType === "VTA" ? "Factura" : "Pedido"}: {selectedClient?.fac_nro || "N/A"}
          </p>
        )}
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 bg-white overflow-y-auto">
        <div className="p-2 space-y-2">
          {/* Sección de cliente */}
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs font-medium text-gray-700 mb-1">Cliente</p>
            {selectedClient ? (
              <div className="space-y-2">
                <div className="bg-white p-2 rounded-lg shadow-sm">
                  <p className="font-medium text-gray-900 text-sm">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_ide}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_tel}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_dir}</p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={onShowClientModal}
                    className="flex-1 bg-[#f58ea3] text-white py-1 rounded-lg hover:bg-[#f7b3c2] transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FaUser className="w-3 h-3" />
                    Cambiar
                  </button>
                  <button 
                    onClick={onCreateClient}
                    className="flex-1 bg-white border border-[#f58ea3] text-[#f58ea3] py-1 rounded-lg hover:bg-[#f58ea3] hover:text-white transition-all duration-200 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <FaUserPlus className="w-3 h-3" />
                    Crear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <button 
                  onClick={onShowClientModal}
                  className="w-full bg-[#f58ea3] text-white py-1.5 rounded-lg hover:bg-[#f7b3c2] transition-all duration-200 flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <FaUser className="w-4 h-4" />
                  Seleccionar Cliente
                </button>
                <button 
                  onClick={onCreateClient}
                  className="w-full bg-white border border-[#f58ea3] text-[#f58ea3] py-1.5 rounded-lg hover:bg-[#f58ea3] hover:text-white transition-all duration-200 flex items-center justify-center gap-1 text-xs cursor-pointer"
                >
                  <FaUserPlus className="w-4 h-4" />
                  Crear Cliente
                </button>
              </div>
            )}
          </div>

          {/* Configuración de precios y descuento */}
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo de Precio
              </label>
              <select
                value={selectedPriceType}
                onChange={onPriceTypeChange}
                className="w-full p-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
              >
                <option value="mayor">Precios al Mayor</option>
                <option value="detal">Precios al Detal</option>
              </select>
            </div>

            <div className="bg-gray-50 p-2 rounded-lg">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Descuento (%)
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={onDiscountChange}
                className="w-full p-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Resumen de pedido */}
          <div className="bg-gray-50 p-2 rounded-lg">
            <OrderSummary
              order={order}
              onRemove={onRemove}
              onAdd={onAdd}
              totalValue={totalValue}
              selectedPriceType={selectedPriceType}
              discountValue={discountValue}
              finalTotal={finalTotal}
              isEditing={isEditing}
              orderType={orderType}
            />
          </div>
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div className="bg-white border-t p-2 space-y-2">
        <button 
          onClick={onPlaceOrder}
          disabled={isEditing && orderType === "VTA"}
          className={`w-full px-3 py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer ${
            isEditing && orderType === "VTA" 
              ? "bg-gray-300 cursor-not-allowed" 
              : "bg-[#f58ea3] text-white hover:bg-[#f7b3c2]"
          }`}
        >
          <FaShoppingCart className="w-4 h-4" />
          {isEditing ? "Editar Pedido" : "Realizar Pedido"}
        </button>
        <button
          onClick={onFacturarOrder}
          className="w-full bg-green-600 text-white px-3 py-2 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {isEditing && orderType === "VTA" ? "Editar Factura" : "Facturar"}
        </button>
      </div>
    </div>
  );
};

export default OrderDrawer;
