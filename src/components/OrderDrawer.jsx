// src/components/OrderDrawer.js
import React from 'react';
import OrderSummary from './OrderSummary';
import { FaTimes, FaUser, FaUserPlus } from 'react-icons/fa';
import BotoneraDocumento from './pos/BotoneraDocumento';

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
  onRemisionar,
  onFacturarOrder,
  bloqueo,
  badgeDocumento,
  selectedPriceType,
  onPriceTypeChange,
  discountPercent,
  onDiscountChange,
  facDescuentoGeneral,
  porcentajeDescuentoEvento,
  discountValue,
  finalTotal,
  montoMayorista,
  isPriceTypeDisabled,
  hayEventoActivo,
  isEditing,
  orderType,
  eventoPromocional,
  cumpleUmbralMayorista,
  onUpdateMontoMayorista
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col md:hidden">
      {/* Header con glassmorphism y sombra */}
      <div className="bg-white/90 backdrop-blur-xl px-6 py-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 font-system">Resumen de Pedido</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 cursor-pointer group"
          >
            <FaTimes className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>
        {isEditing && order.length > 0 && (
          <div className="mt-3 flex justify-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#f58ea3]/10 text-[#c53051] border border-[#f58ea3]/50">
              {badgeDocumento || `Editando ${orderType === "VTA" ? "Factura" : "Pedido"}: ${selectedClient?.fac_nro || "N/A"}`}
            </span>
          </div>
        )}
      </div>

      {/* Contenido scrollable con glassmorphism */}
      <div className="flex-1 bg-gray-50/80 backdrop-blur-sm overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Sección de cliente */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 font-system">Cliente</h3>
            {selectedClient ? (
              <div className="space-y-4">
                <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/50">
                  <p className="font-semibold text-gray-900 text-base mb-2 font-system">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600 font-system">{selectedClient.nit_ide}</p>
                    <p className="text-sm text-gray-600 font-system">{selectedClient.nit_tel}</p>
                    <p className="text-sm text-gray-600 font-system">{selectedClient.nit_dir}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={onShowClientModal}
                    className="flex-1 bg-[#f58ea3] text-white py-3 px-4 rounded-xl hover:bg-[#f7b3c2] active:bg-[#e67a90] transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <FaUser className="w-4 h-4" />
                    Cambiar
                  </button>
                  <button 
                    onClick={onCreateClient}
                    className="flex-1 bg-white border border-[#f58ea3] text-[#f58ea3] py-3 px-4 rounded-xl hover:bg-[#f58ea3]/10 active:bg-[#f58ea3]/20 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <FaUserPlus className="w-4 h-4" />
                    Crear
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={onShowClientModal}
                  className="w-full bg-[#f58ea3] text-white py-4 px-6 rounded-xl hover:bg-[#f7b3c2] active:bg-[#e67a90] transition-all duration-200 flex items-center justify-center gap-3 text-sm font-medium cursor-pointer shadow-sm hover:shadow-md"
                >
                  <FaUser className="w-5 h-5" />
                  Seleccionar Cliente
                </button>
                <button 
                  onClick={onCreateClient}
                  className="w-full bg-white border border-[#f58ea3] text-[#f58ea3] py-4 px-6 rounded-xl hover:bg-[#f58ea3]/10 active:bg-[#f58ea3]/20 transition-all duration-200 flex items-center justify-center gap-3 text-sm font-medium cursor-pointer shadow-sm hover:shadow-md"
                >
                  <FaUserPlus className="w-5 h-5" />
                  Crear Cliente
                </button>
              </div>
            )}
          </div>

          {/* Configuración de precios y descuento */}
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50">
              <label className="block text-sm font-semibold text-gray-900 mb-3 font-system">
                Tipo de Precio
                {isPriceTypeDisabled && (
                  <span className="ml-2 text-xs text-orange-600 font-normal">
                    (Automático según umbral mayorista)
                  </span>
                )}
              </label>
              <select
                value={selectedPriceType}
                onChange={onPriceTypeChange}
                disabled={isPriceTypeDisabled}
                className={`w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm font-system ${
                  isPriceTypeDisabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
                }`}
              >
                <option value="mayor">Precios al Mayor</option>
                <option value="detal">Precios al Detal</option>
              </select>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50">
              <label className="block text-sm font-semibold text-gray-900 mb-3 font-system">
                Descuento (%)
              </label>
              <input
                type="number"
                value={discountPercent}
                onChange={onDiscountChange}
                className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200 bg-white/90 backdrop-blur-sm font-system"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Resumen de pedido */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-white/50">
            <OrderSummary
              readOnly={!!bloqueo}
              order={order}
              onRemove={onRemove}
              onAdd={onAdd}
              totalValue={totalValue}
              selectedPriceType={selectedPriceType}
              discountValue={discountValue}
              facDescuentoGeneral={facDescuentoGeneral}
              porcentajeDescuentoEvento={porcentajeDescuentoEvento}
              finalTotal={finalTotal}
              montoMayorista={montoMayorista}
              eventoPromocional={eventoPromocional}
              hayEventoActivo={hayEventoActivo}
              cumpleUmbralMayorista={cumpleUmbralMayorista}
              onUpdateMontoMayorista={onUpdateMontoMayorista}
            />
          </div>
        </div>
      </div>

      {/* Footer con los botones según el documento cargado (SPEC-014 §2.3) */}
      <div className="bg-white/95 backdrop-blur-xl p-6 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
        <BotoneraDocumento
          compact
          orderType={orderType}
          isEditing={isEditing}
          bloqueo={bloqueo}
          onCotizar={onPlaceOrder}
          onRemisionar={onRemisionar}
          onFacturar={onFacturarOrder}
        />
      </div>
    </div>
  );
};

export default OrderDrawer;
