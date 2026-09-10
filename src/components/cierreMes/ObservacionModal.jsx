import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

const MINIMO = 10;

const ObservacionModal = ({
  abierto,
  titulo,
  descripcion,
  etiquetaBoton = 'Confirmar',
  procesando = false,
  onConfirmar,
  onCerrar,
}) => {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    if (abierto) setTexto('');
  }, [abierto]);

  if (!abierto) return null;

  const limpio = texto.trim();
  const valido = limpio.length >= MINIMO;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{titulo}</h3>
            {descripcion && <p className="text-sm text-gray-500 mt-1">{descripcion}</p>}
          </div>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="p-5">
          <label htmlFor="observacion-cierre" className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones <span className="text-red-500">*</span>
          </label>
          <textarea
            id="observacion-cierre"
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Detalla el motivo..."
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent"
          />
          <p className={`text-xs mt-1.5 ${valido ? 'text-gray-500' : 'text-amber-600'}`}>
            {limpio.length}/{MINIMO} caracteres minimos
          </p>
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
            disabled={!valido || procesando}
            onClick={() => onConfirmar(limpio)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {procesando ? 'Procesando...' : etiquetaBoton}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ObservacionModal;
