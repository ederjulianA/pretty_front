import React, { useState } from 'react';
import { FaCog, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import ResumenCanalesTabla from './ResumenCanalesTabla';
import ComisionesConfigModal from './ComisionesConfigModal';
import { etiquetaPeriodo } from './formato';

const PasoResumen = ({
  anio,
  mes,
  resumen,
  loading,
  procesando,
  puedeEditarComisiones,
  bloqueoCierre,
  observacion,
  onObservacionChange,
  onGenerar,
  onIrAPaso,
  onComisionesGuardadas,
}) => {
  const [modalComisiones, setModalComisiones] = useState(false);

  if (loading) {
    return <div className="h-64 animate-pulse bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Resumen de {etiquetaPeriodo(anio, mes)}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Estas cifras quedaran congeladas en el cierre, junto con los porcentajes de comision aplicados.
          </p>
        </div>
        {puedeEditarComisiones && (
          <button
            type="button"
            onClick={() => setModalComisiones(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            <FaCog /> Configurar comisiones
          </button>
        )}
      </div>

      <ResumenCanalesTabla canales={resumen?.canales} totales={resumen?.totales} />

      <div className="flex items-start gap-2 text-xs text-gray-500">
        <FaInfoCircle className="mt-0.5 shrink-0" />
        <p>
          El Dashboard de Ventas puede mostrar cifras ligeramente distintas para el mismo mes: incluye por error
          documentos del dia siguiente al ultimo del periodo. Las cifras validas para el cierre son estas.
        </p>
      </div>

      {bloqueoCierre && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">{bloqueoCierre.motivo}</p>
            <button
              type="button"
              onClick={() => onIrAPaso(bloqueoCierre.paso)}
              className="underline font-medium hover:text-amber-900 mt-0.5"
            >
              Ir al paso {bloqueoCierre.paso} para resolverlo
            </button>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="cierre-obs" className="block text-sm font-medium text-gray-700 mb-1.5">
          Observaciones del cierre <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          id="cierre-obs"
          rows={3}
          value={observacion}
          onChange={(e) => onObservacionChange(e.target.value)}
          className="w-full max-w-2xl rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
        />
      </div>

      <button
        type="button"
        onClick={onGenerar}
        disabled={procesando || !!bloqueoCierre}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
      >
        {procesando ? 'Generando cierre...' : 'Generar Cierre'}
      </button>

      <ComisionesConfigModal
        abierto={modalComisiones}
        onCerrar={() => setModalComisiones(false)}
        onGuardado={onComisionesGuardadas}
      />
    </div>
  );
};

export default PasoResumen;
