import React from 'react';
import { FaPlus, FaSyncAlt, FaSpinner } from 'react-icons/fa';

const VariationsTable = ({ variations, isLoading, onAddVariation, onSyncAttributes, isSyncing, parentName }) => {
  const formatPrice = (price) => {
    if (!price) return '$0';
    return `$${parseInt(price).toLocaleString('es-CO')}`;
  };

  return (
    <div className="mt-8 p-4 sm:p-6 bg-white/80 border border-[#f5cad4] rounded-2xl backdrop-blur-md shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Variaciones</h3>
          <p className="text-xs text-gray-500">{variations.length} variaciones creadas</p>
        </div>
        <div className="flex gap-2">
          {variations.length > 0 && (
            <button
              type="button"
              onClick={onSyncAttributes}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition font-semibold shadow-sm flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Sincronizar atributos con WooCommerce"
            >
              {isSyncing ? (
                <FaSpinner className="w-3 h-3 animate-spin" />
              ) : (
                <FaSyncAlt className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">Sync WooCommerce</span>
              <span className="sm:hidden">Sync</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAddVariation}
            className="px-4 py-2 bg-[#f58ea3] hover:bg-[#f7b3c2] text-white rounded-xl transition font-semibold shadow-sm flex items-center gap-2 text-sm"
          >
            <FaPlus className="w-3 h-3" />
            Nueva Variación
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-[#f58ea3] border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Cargando variaciones...</p>
        </div>
      ) : variations.length === 0 ? (
        <div className="text-center py-8 bg-[#fffafe] rounded-xl border border-dashed border-[#f5cad4]">
          <p className="text-gray-500 text-sm">No hay variaciones creadas aún.</p>
          <p className="text-gray-400 text-xs mt-1">Haz clic en "Nueva Variación" para crear la primera.</p>
        </div>
      ) : (
        <>
          {/* Vista Mobile - Tarjetas */}
          <div className="block sm:hidden space-y-3">
            {variations.map((variation) => (
              <div key={variation.art_sec} className="bg-[#fffafe] border border-[#f5cad4] rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-xs text-gray-800">{variation.art_cod}</p>
                    <p className="text-sm text-gray-700 mt-0.5">{variation.art_nom}</p>
                  </div>
                  {variation.art_variation_attributes && (
                    <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                      {Object.values(variation.art_variation_attributes)[0]}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#f5cad4]/50">
                  <div>
                    <span className="text-xs text-gray-500 block">Detal</span>
                    <span className="text-sm font-semibold text-gray-800">{formatPrice(variation.precio_detal)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Mayor</span>
                    <span className="text-sm font-semibold text-gray-800">{formatPrice(variation.precio_mayor)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">Stock</span>
                    <span className="text-sm font-semibold text-[#f58ea3]">{variation.existencia ?? 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Desktop - Tabla */}
          <div className="hidden sm:block overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fff5f7] text-left">
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase rounded-tl-lg">SKU</th>
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase">Nombre</th>
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase">Atributo</th>
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase text-right">P. Detal</th>
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase text-right">P. Mayor</th>
                  <th className="px-3 py-2 text-xs font-bold text-gray-700 uppercase text-center rounded-tr-lg">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variations.map((variation) => (
                  <tr key={variation.art_sec} className="hover:bg-pink-50/50 transition-colors">
                    <td className="px-3 py-2.5 text-xs font-semibold text-gray-900">{variation.art_cod}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">{variation.art_nom}</td>
                    <td className="px-3 py-2.5">
                      {variation.art_variation_attributes && (
                        <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full font-medium">
                          {Object.values(variation.art_variation_attributes)[0]}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-900 text-right font-medium">{formatPrice(variation.precio_detal)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-900 text-right font-medium">{formatPrice(variation.precio_mayor)}</td>
                    <td className="px-3 py-2.5 text-xs text-center font-semibold text-[#f58ea3]">{variation.existencia ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default VariationsTable;
