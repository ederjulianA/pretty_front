import React from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaTimes, FaTimesCircle } from 'react-icons/fa';

/**
 * Reporte fila a fila de una operacion masiva. El backend responde 200 aunque
 * haya fallos parciales, asi que cada item trae su propio resultado.
 */
const ResultadoBloqueModal = ({ abierto, titulo, resultado, onCerrar, onReintentarDesincronizados }) => {
  if (!abierto || !resultado) return null;

  const { totalItems = 0, successCount = 0, errorCount = 0, resultados = [] } = resultado;

  // ok:true + woo:false = el sistema local quedo actualizado pero WooCommerce no.
  const desincronizados = resultados.filter((r) => r.ok && r.woo === false);

  const estiloFila = (item) => {
    if (!item.ok) return { icono: <FaTimesCircle className="text-red-500" />, clase: 'bg-red-50' };
    if (item.woo === false) return { icono: <FaExclamationTriangle className="text-amber-500" />, clase: 'bg-amber-50' };
    return { icono: <FaCheckCircle className="text-green-500" />, clase: '' };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
            <div className="flex flex-wrap gap-3 mt-2 text-sm">
              <span className="text-gray-600">{totalItems} procesados</span>
              <span className="text-green-600 font-medium">{successCount} correctos</span>
              {errorCount > 0 && <span className="text-red-600 font-medium">{errorCount} con error</span>}
              {desincronizados.length > 0 && (
                <span className="text-amber-600 font-medium">{desincronizados.length} sin sincronizar en Woo</span>
              )}
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        {desincronizados.length > 0 && (
          <div className="mx-5 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            El estado se guardo en el sistema local pero WooCommerce no lo recibio. Esos pedidos quedaron
            desincronizados.
            {onReintentarDesincronizados && (
              <button
                type="button"
                onClick={() => onReintentarDesincronizados(desincronizados.map((r) => r.fac_sec))}
                className="ml-2 underline font-medium hover:text-amber-900"
              >
                Reintentar solo esos
              </button>
            )}
          </div>
        )}

        <div className="overflow-y-auto p-5">
          <ul className="space-y-1.5">
            {resultados.map((item) => {
              const { icono, clase } = estiloFila(item);
              return (
                <li
                  key={item.fac_sec}
                  className={`flex items-start gap-3 rounded-xl px-3 py-2.5 border border-gray-100 ${clase}`}
                >
                  <span className="mt-0.5 shrink-0">{icono}</span>
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-gray-900">
                      {item.fac_nro ?? `Documento ${item.fac_sec}`}
                      {item.fac_nro_generado && (
                        <span className="text-green-700"> → {item.fac_nro_generado}</span>
                      )}
                    </p>
                    {item.ok && item.woo === false && (
                      <p className="text-amber-700 text-xs font-medium">Local actualizado · WooCommerce NO</p>
                    )}
                    {item.mensaje && <p className="text-gray-600 break-words">{item.mensaje}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex justify-end p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92]"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultadoBloqueModal;
