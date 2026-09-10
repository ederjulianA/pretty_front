import React from 'react';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { MESES, etiquetaPeriodo, formatFechaHora } from './formato';

const ANIOS_DISPONIBLES = 3;

const PasoSeleccionPeriodo = ({ anio, mes, onAnioChange, onMesChange, validacion, validando }) => {
  const anioActual = new Date().getFullYear();
  const anios = Array.from({ length: ANIOS_DISPONIBLES }, (_, i) => anioActual - i);
  const existente = validacion?.cierre_existente;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Selecciona el periodo a cerrar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Solo se puede cerrar un mes ya terminado y que no tenga un cierre activo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <div>
          <label htmlFor="cierre-anio" className="block text-sm font-medium text-gray-700 mb-1.5">
            Año
          </label>
          <select
            id="cierre-anio"
            value={anio}
            onChange={(e) => onAnioChange(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
          >
            {anios.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cierre-mes" className="block text-sm font-medium text-gray-700 mb-1.5">
            Mes
          </label>
          <select
            id="cierre-mes"
            value={mes}
            onChange={(e) => onMesChange(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
          >
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {validando && (
        <div className="h-14 max-w-lg animate-pulse bg-gray-100 rounded-xl" />
      )}

      {!validando && validacion?.puede_cerrar === true && (
        <div className="max-w-lg flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">
            <span className="font-semibold">{etiquetaPeriodo(anio, mes)}</span> esta disponible para cerrar.
          </p>
        </div>
      )}

      {!validando && validacion?.puede_cerrar === false && (
        <div className="max-w-lg flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <FaExclamationCircle className="text-red-500 mt-0.5 shrink-0" />
          <div className="text-sm text-red-800">
            <p>{validacion.motivo}</p>
            {existente && (
              <p className="mt-1 text-red-700">
                Cierre #{existente.cie_sec} generado el {formatFechaHora(existente.cie_fec_cierre)} por{' '}
                {existente.cie_usu_cod}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasoSeleccionPeriodo;
