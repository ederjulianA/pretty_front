import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { FaCheckCircle } from 'react-icons/fa';
import TablaSeleccionable from './TablaSeleccionable';
import ResultadoBloqueModal from './ResultadoBloqueModal';
import ObservacionModal from './ObservacionModal';
import { etiquetaEstadoWoo, formatCurrency, formatFecha } from './formato';

const PasoCotizaciones = ({ cotizaciones, loading, procesando, onFacturar, onAnular }) => {
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [accion, setAccion] = useState('facturar');
  const [modalObservacion, setModalObservacion] = useState(false);
  const [resultado, setResultado] = useState(null);

  const items = cotizaciones?.items ?? [];

  const toggle = (id) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleTodos = (ids) =>
    setSeleccionados((prev) => (ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));

  const mostrarResultado = (titulo, data) => {
    setSeleccionados(new Set());
    setResultado({ titulo, data });
    if (data.errorCount === 0) toast.success(`${data.successCount} cotizacion(es) procesada(s)`);
    else toast.warn(`${data.successCount} de ${data.totalItems} cotizacion(es) procesada(s)`);
  };

  const facturar = async () => {
    const lista = Array.from(seleccionados);
    const confirmacion = await Swal.fire({
      title: `Facturar ${lista.length} cotizacion(es)`,
      text: `Se generaran ${lista.length} factura(s) de venta. Esta accion no se puede deshacer.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Facturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
    });
    if (!confirmacion.isConfirmed) return;

    const data = await onFacturar(lista);
    if (data) mostrarResultado('Facturacion en bloque', data);
  };

  const anular = async (observacion) => {
    const data = await onAnular(Array.from(seleccionados), observacion);
    setModalObservacion(false);
    if (data) mostrarResultado('Cancelacion de cotizaciones', data);
  };

  const aplicar = () => {
    if (seleccionados.size === 0) return;
    if (accion === 'facturar') facturar();
    else setModalObservacion(true);
  };

  const columnas = [
    { key: 'cot', titulo: 'Cotizacion', render: (i) => <span className="font-medium text-gray-900">{i.fac_nro}</span> },
    { key: 'woo', titulo: 'Pedido Woo', render: (i) => (i.fac_nro_woo ? `#${i.fac_nro_woo}` : '—') },
    { key: 'cliente', titulo: 'Cliente', render: (i) => i.nit_nom || '—' },
    { key: 'fecha', titulo: 'Fecha', render: (i) => formatFecha(i.fac_fec) },
    {
      key: 'estado',
      titulo: 'Estado Woo',
      render: (i) => (
        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
          {etiquetaEstadoWoo(i.fac_est_woo)}
        </span>
      ),
    },
    { key: 'total', titulo: 'Total', align: 'right', render: (i) => formatCurrency(i.total) },
  ];

  if (loading) {
    return <div className="h-64 animate-pulse bg-gray-100 rounded-xl" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Cotizaciones pendientes de facturar</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cada cotizacion debe quedar facturada o cancelada antes de generar el cierre.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800">Todas las cotizaciones del periodo estan facturadas.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <label htmlFor="accion-cotizaciones" className="text-sm font-medium text-gray-700">
              Accion
            </label>
            <select
              id="accion-cotizaciones"
              value={accion}
              onChange={(e) => setAccion(e.target.value)}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58ea3]"
            >
              <option value="facturar">Facturar</option>
              <option value="cancelar">Cancelar</option>
            </select>

            {accion === 'cancelar' && (
              <button
                type="button"
                onClick={() => setModalObservacion(true)}
                disabled={seleccionados.size === 0 || procesando}
                className="px-3 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Observaciones
              </button>
            )}

            <button
              type="button"
              onClick={aplicar}
              disabled={seleccionados.size === 0 || procesando}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {procesando ? 'Procesando...' : `Aplicar (${seleccionados.size})`}
            </button>
          </div>

          <TablaSeleccionable
            items={items}
            columnas={columnas}
            seleccionados={seleccionados}
            onToggle={toggle}
            onToggleTodos={toggleTodos}
            getId={(i) => i.fac_sec}
            mensajeVacio="No hay cotizaciones pendientes."
          />
        </>
      )}

      <ObservacionModal
        abierto={modalObservacion}
        titulo={`Cancelar ${seleccionados.size} cotizacion(es)`}
        descripcion="Las cotizaciones quedaran anuladas con la observacion que ingreses."
        etiquetaBoton="Cancelar cotizaciones"
        procesando={procesando}
        onConfirmar={anular}
        onCerrar={() => setModalObservacion(false)}
      />

      <ResultadoBloqueModal
        abierto={!!resultado}
        titulo={resultado?.titulo ?? ''}
        resultado={resultado?.data}
        onCerrar={() => setResultado(null)}
      />
    </div>
  );
};

export default PasoCotizaciones;
