import React, { useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { FaCheck, FaExclamationTriangle, FaSync, FaTimes } from 'react-icons/fa';
import TablaSeleccionable from './TablaSeleccionable';
import ResultadoBloqueModal from './ResultadoBloqueModal';
import { ESTADO_CANCELADO, esPedidoResuelto, etiquetaEstadoWoo, formatCurrency, formatFecha, formatNumber } from './formato';

const ACCIONES = {
  confirmar: {
    titulo: 'Confirmar pago',
    pregunta: 'Los pedidos seleccionados pasaran a "completed" en el sistema local y en WooCommerce.',
    color: 'bg-green-600 hover:bg-green-700',
  },
  no_pagado: {
    titulo: 'Marcar como no pagado',
    pregunta: 'Los pedidos seleccionados pasaran a "cancelled" en el sistema local y en WooCommerce.',
    color: 'bg-red-600 hover:bg-red-700',
  },
};

const chipEstado = (item) => {
  if (item.confirmado) return 'bg-green-100 text-green-800';
  if (item.fac_est_woo === ESTADO_CANCELADO) return 'bg-gray-200 text-gray-700';
  if (!item.fac_est_woo) return 'bg-gray-100 text-gray-600';
  if (/(failed|cancelled|refunded)/.test(item.fac_est_woo)) return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
};

const PasoPedidos = ({ pedidos, loading, procesando, progresoSync, onSincronizar, onActualizarEstado }) => {
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [resultado, setResultado] = useState(null);

  const items = pedidos?.items ?? [];
  const wooDisponible = pedidos?.woo_disponible !== false;
  const faltantes = pedidos?.faltantes;

  const sinResolver = useMemo(() => items.filter((p) => !esPedidoResuelto(p)), [items]);

  const toggle = (id) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleTodos = (ids) =>
    setSeleccionados((prev) => (ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));

  const aplicar = async (accion, facSecs) => {
    const config = ACCIONES[accion];
    const lista = facSecs ?? Array.from(seleccionados);
    if (lista.length === 0) return;

    const confirmacion = await Swal.fire({
      title: `${config.titulo} (${lista.length})`,
      html: `${config.pregunta}<br/><br/><span style="color:#6b7280;font-size:13px">El cliente recibira la notificacion estandar de WooCommerce.</span>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: config.titulo,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
    });
    if (!confirmacion.isConfirmed) return;

    const data = await onActualizarEstado(lista, accion);
    if (!data) return;

    setSeleccionados(new Set());
    setResultado({ titulo: config.titulo, accion, data });
    if (data.errorCount === 0) toast.success(`${data.successCount} pedido(s) actualizado(s)`);
    else toast.warn(`${data.successCount} de ${data.totalItems} pedido(s) actualizado(s)`);
  };

  const sincronizar = async () => {
    const reporte = await onSincronizar();
    if (!reporte) return;
    if (reporte.conError > 0) {
      toast.warn(`Sincronizacion terminada con ${reporte.conError} estado(s) con error`);
    } else {
      toast.success(`Sincronizacion completada (${reporte.estadosProcesados} estados)`);
    }
  };

  const columnas = [
    { key: 'woo', titulo: 'Pedido Woo', render: (i) => <span className="font-medium text-gray-900">#{i.fac_nro_woo}</span> },
    { key: 'doc', titulo: 'Documento', render: (i) => i.fac_nro },
    { key: 'cliente', titulo: 'Cliente', render: (i) => i.nit_nom || '—' },
    { key: 'fecha', titulo: 'Fecha', render: (i) => formatFecha(i.fac_fec) },
    {
      key: 'estado',
      titulo: 'Estado Woo',
      render: (i) => (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${chipEstado(i)}`}>
          {etiquetaEstadoWoo(i.fac_est_woo)}
        </span>
      ),
    },
    { key: 'total', titulo: 'Total', align: 'right', render: (i) => formatCurrency(i.total) },
    {
      key: 'facturado',
      titulo: 'Facturado',
      render: (i) =>
        i.facturado ? (
          <span className="text-green-700 text-xs font-medium">{i.fac_nro_origen}</span>
        ) : (
          <span className="text-gray-400 text-xs">Pendiente</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse bg-gray-100 rounded-xl" />
        <div className="h-64 animate-pulse bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Consolidacion de pedidos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Resuelve los pedidos cuyo pago no esta confirmado antes de generar el cierre.
        </p>
      </div>

      {!wooDisponible && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-500 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800 flex-1">
              <p className="font-semibold">No se pudo verificar la consolidacion con WooCommerce.</p>
              {pedidos?.woo_error && <p className="mt-0.5">{pedidos.woo_error}</p>}
              <p className="mt-1">
                Puedes continuar con los pasos siguientes, que son locales, pero no es posible sincronizar ni
                actualizar estados hasta recuperar la conexion.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">En WooCommerce</p>
          <p className="text-xl font-bold text-gray-900">
            {wooDisponible ? formatNumber(pedidos?.total_woo) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs text-gray-500">Sincronizados</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(pedidos?.total_local)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${faltantes > 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'}`}>
          <p className="text-xs text-gray-500">Faltantes</p>
          <p className={`text-xl font-bold ${faltantes > 0 ? 'text-amber-700' : 'text-gray-900'}`}>
            {wooDisponible ? formatNumber(faltantes) : '—'}
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${sinResolver.length > 0 ? 'border-amber-300 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
          <p className="text-xs text-gray-500">Sin resolver</p>
          <p className={`text-xl font-bold ${sinResolver.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
            {formatNumber(sinResolver.length)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={sincronizar}
          disabled={!wooDisponible || procesando}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FaSync className={procesando && progresoSync ? 'animate-spin' : ''} />
          Sincronizar faltantes
        </button>
        {progresoSync?.estado && (
          <span className="text-sm text-gray-600">
            Sincronizando {progresoSync.actual} de {progresoSync.total}: {progresoSync.estado}
          </span>
        )}
      </div>

      {seleccionados.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#f58ea3]/40 bg-[#fff5f7] p-3">
          <span className="text-sm font-medium text-gray-700">{seleccionados.size} seleccionado(s)</span>
          <button
            type="button"
            onClick={() => aplicar('confirmar')}
            disabled={!wooDisponible || procesando}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white ${ACCIONES.confirmar.color} disabled:opacity-40`}
          >
            <FaCheck /> Confirmar pago
          </button>
          <button
            type="button"
            onClick={() => aplicar('no_pagado')}
            disabled={!wooDisponible || procesando}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white ${ACCIONES.no_pagado.color} disabled:opacity-40`}
          >
            <FaTimes /> Marcar como no pagado
          </button>
        </div>
      )}

      <TablaSeleccionable
        items={items}
        columnas={columnas}
        seleccionados={seleccionados}
        onToggle={toggle}
        onToggleTodos={toggleTodos}
        getId={(i) => i.fac_sec}
        esSeleccionable={(i) => !i.confirmado && wooDisponible}
        getClaseFila={(i) => (esPedidoResuelto(i) ? '' : 'bg-amber-50/40')}
        mensajeVacio="No hay pedidos de WooCommerce en este periodo."
      />

      <ResultadoBloqueModal
        abierto={!!resultado}
        titulo={resultado?.titulo ?? ''}
        resultado={resultado?.data}
        onCerrar={() => setResultado(null)}
        onReintentarDesincronizados={(facSecs) => {
          setResultado(null);
          aplicar(resultado.accion, facSecs);
        }}
      />
    </div>
  );
};

export default PasoPedidos;
