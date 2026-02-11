import React, { useState, useEffect } from 'react';
import { FaTimes, FaCubes, FaBox, FaSpinner } from 'react-icons/fa';
import { formatValue } from '../utils';
import axiosInstance from '../axiosConfig';

const BundleDetailsModal = ({ isOpen, onClose, bundle, onAddToCart }) => {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockValidation, setStockValidation] = useState(null);
  const [isValidatingStock, setIsValidatingStock] = useState(false);

  useEffect(() => {
    if (isOpen && bundle?.id) {
      fetchComponents();
      validateStock();
    }
  }, [isOpen, bundle?.id]);

  const fetchComponents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axiosInstance.get(`/bundles/${bundle.id}/componentes`, {
        headers: { 'x-access-token': token }
      });

      if (response.data.success) {
        setComponents(response.data.data.componentes || []);
      } else {
        setError('No se pudieron cargar los componentes');
      }
    } catch (err) {
      console.error('Error al cargar componentes:', err);
      setError('Error al cargar los componentes del bundle');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStock = async () => {
    setIsValidatingStock(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axiosInstance.post(
        `/bundles/${bundle.id}/validar-stock`,
        { cantidad_bundle: 1 },
        { headers: { 'x-access-token': token } }
      );

      if (response.data.success) {
        setStockValidation(response.data);
      }
    } catch (err) {
      console.error('Error al validar stock:', err);
    } finally {
      setIsValidatingStock(false);
    }
  };

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(bundle);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl">
              <FaCubes className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{bundle?.name}</h2>
              <p className="text-emerald-100 text-sm">Código: {bundle?.codigo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
          >
            <FaTimes className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Alerta de stock insuficiente */}
          {stockValidation && !stockValidation.puede_vender && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 animate-slideUp">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-800 mb-1">Stock Insuficiente</h4>
                  <p className="text-sm text-red-700">
                    {stockValidation.mensaje} No se puede agregar este combo al carrito en este momento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Precio y Stock del Bundle */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-emerald-700">Precio del Combo Completo</span>
              <span className="text-2xl font-bold text-emerald-600">
                ${formatValue(bundle?.price)}
              </span>
            </div>
            {bundle?.price_detal && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">Precio Detal</span>
                <span className="text-lg font-semibold text-emerald-600">
                  ${formatValue(bundle?.price_detal)}
                </span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-700">Stock Disponible</span>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                bundle?.existencia > 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {bundle?.existencia || 0} unidades
              </span>
            </div>
          </div>

          {/* Componentes del Bundle */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaBox className="w-4 h-4 text-emerald-600" />
              Componentes Incluidos
            </h3>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FaSpinner className="animate-spin text-4xl text-emerald-500 mb-3" />
                <p className="text-gray-600">Cargando componentes...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-red-600">{error}</p>
              </div>
            ) : components.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <FaBox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay componentes registrados para este bundle</p>
              </div>
            ) : (
              <div className="space-y-3">
                {components.map((component, index) => {
                  // Buscar la validación de este componente
                  const componentValidation = stockValidation?.detalles?.find(
                    d => d.art_sec === component.art_sec
                  );
                  const tieneStockSuficiente = componentValidation?.cumple !== false;

                  return (
                    <div
                      key={index}
                      className={`rounded-xl p-4 transition-all duration-200 ${
                        tieneStockSuficiente
                          ? 'bg-white border border-gray-200 hover:border-emerald-300 hover:shadow-md'
                          : 'bg-red-50 border-2 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Imagen del componente */}
                        <div className={`w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden ${
                          tieneStockSuficiente ? 'bg-gray-100' : 'bg-red-100'
                        }`}>
                          {component.art_url_img_servi ? (
                            <img
                              src={component.art_url_img_servi}
                              alt={component.art_nom}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FaBox className={`w-6 h-6 ${
                                tieneStockSuficiente ? 'text-gray-400' : 'text-red-400'
                              }`} />
                            </div>
                          )}
                        </div>

                        {/* Info del componente */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold truncate ${
                                tieneStockSuficiente ? 'text-gray-900' : 'text-red-900'
                              }`}>
                                {component.art_nom}
                              </h4>
                              <p className={`text-sm ${
                                tieneStockSuficiente ? 'text-gray-500' : 'text-red-600'
                              }`}>
                                Cód: {component.art_cod}
                              </p>
                            </div>
                            {/* Cantidad */}
                            <div className={`flex-shrink-0 px-3 py-1 rounded-full ${
                              tieneStockSuficiente
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              <span className="text-sm font-bold">
                                {component.cantidad}× unidad{component.cantidad > 1 ? 'es' : ''}
                              </span>
                            </div>
                          </div>

                          {/* Stock del componente */}
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Stock disponible:</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              component.stock_disponible > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {component.stock_disponible || 0}
                            </span>

                            {/* Mostrar faltante si hay */}
                            {componentValidation && !tieneStockSuficiente && componentValidation.faltante && (
                              <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                                Faltan: {componentValidation.faltante}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info adicional */}
          {components.length > 0 && stockValidation && stockValidation.puede_vender && (
            <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                <strong>✓ Stock Disponible:</strong> Todos los componentes tienen stock suficiente para armar este combo.
              </p>
            </div>
          )}
          {components.length > 0 && !stockValidation && !isValidatingStock && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800">
                <strong>💡 Nota:</strong> Al agregar este combo al carrito, se verificará que haya stock suficiente de todos los componentes.
              </p>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl bg-white hover:bg-gray-100 transition font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={handleAddToCart}
              disabled={
                !bundle?.existencia ||
                bundle?.existencia <= 0 ||
                (stockValidation && !stockValidation.puede_vender)
              }
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FaCubes className="w-4 h-4" />
              {stockValidation && !stockValidation.puede_vender
                ? 'Stock Insuficiente'
                : 'Agregar Combo al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleDetailsModal;
