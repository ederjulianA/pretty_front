import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { useComisionesParams } from '../../hooks/useComisionesParams';

const ComisionesConfigModal = ({ abierto, onCerrar, onGuardado }) => {
  const { comisionWoo, comisionLocal, loading, guardando, guardar } = useComisionesParams();
  const [woo, setWoo] = useState('');
  const [local, setLocal] = useState('');

  useEffect(() => {
    if (abierto) {
      setWoo(comisionWoo);
      setLocal(comisionLocal);
    }
  }, [abierto, comisionWoo, comisionLocal]);

  if (!abierto) return null;

  const handleGuardar = async () => {
    const ok = await guardar({ woo, local });
    if (ok) {
      onGuardado?.();
      onCerrar();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Porcentajes de comision</h3>
            <p className="text-sm text-gray-500 mt-1">
              Se aplican a los cierres nuevos. Los cierres ya generados conservan el porcentaje con el que se
              calcularon.
            </p>
          </div>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="h-24 animate-pulse bg-gray-100 rounded-xl" />
          ) : (
            <>
              <div>
                <label htmlFor="comision-woo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  WooCommerce (%)
                </label>
                <input
                  id="comision-woo"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={woo}
                  onChange={(e) => setWoo(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
                />
              </div>
              <div>
                <label htmlFor="comision-local" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Venta Local (%)
                </label>
                <input
                  id="comision-local"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComisionesConfigModal;
