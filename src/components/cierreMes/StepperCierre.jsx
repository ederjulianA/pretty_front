import React from 'react';
import { FaCheck } from 'react-icons/fa';

const PASOS = [
  { numero: 1, titulo: 'Periodo' },
  { numero: 2, titulo: 'Pedidos' },
  { numero: 3, titulo: 'Cotizaciones' },
  { numero: 4, titulo: 'Resumen' },
];

const StepperCierre = ({ pasoActual, onIrAPaso, pasoMaximoAlcanzado = 1 }) => (
  <ol className="flex items-center gap-2 overflow-x-auto pb-1">
    {PASOS.map((paso, index) => {
      const completado = paso.numero < pasoActual;
      const activo = paso.numero === pasoActual;
      const habilitado = paso.numero <= pasoMaximoAlcanzado;

      return (
        <li key={paso.numero} className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => habilitado && onIrAPaso?.(paso.numero)}
            disabled={!habilitado}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              activo
                ? 'bg-[#f58ea3] text-white shadow-md'
                : completado
                  ? 'bg-[#fff5f7] text-[#f58ea3]'
                  : 'bg-white/70 text-gray-400'
            } ${habilitado ? 'cursor-pointer hover:shadow-sm' : 'cursor-not-allowed'}`}
          >
            <span
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                activo ? 'bg-white text-[#f58ea3]' : completado ? 'bg-[#f58ea3] text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {completado ? <FaCheck className="w-3 h-3" /> : paso.numero}
            </span>
            <span className="hidden sm:inline">{paso.titulo}</span>
          </button>
          {index < PASOS.length - 1 && <span className="w-6 h-px bg-gray-300" />}
        </li>
      );
    })}
  </ol>
);

export default StepperCierre;
