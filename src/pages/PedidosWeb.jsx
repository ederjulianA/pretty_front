// src/pages/PedidosWeb.jsx — SPEC-013 Fase 2 (versión mínima de la Tarea 8)
// Lista las remisiones web (REM) que crea el importador automático a partir de los pedidos
// de WooCommerce, con las dos acciones del flujo: Confirmar pago (REM → VTA por relevo,
// pedido Woo → processing) y Anular (REM → I, pedido Woo → cancelled).
// Fuente: GET /api/pedidos-web (woo_pedidos + factura). Todas las llamadas llevan el token
// vía axiosInstance (x-access-token).
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { FaSyncAlt, FaCheck, FaBan, FaEye, FaCloudDownloadAlt, FaExclamationTriangle } from 'react-icons/fa';

const fmtCOP = (v) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(v) || 0);
const fmtFecha = (v) => (v ? new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-');

/** Etiquetas y colores del estado en el ERP (woo_pedidos.estado_erp). */
const ESTADOS_ERP = {
  REM_ACTIVA: { label: 'Reservado (REM)', cls: 'bg-amber-100 text-amber-800' },
  FACTURADO: { label: 'Facturado', cls: 'bg-green-100 text-green-800' },
  ANULADO: { label: 'Anulado', cls: 'bg-gray-100 text-gray-700' },
  REVISION: { label: 'Revisión', cls: 'bg-red-100 text-red-800' },
  ERROR: { label: 'Error', cls: 'bg-red-100 text-red-800' },
  SIN_DOC: { label: 'Sin documento', cls: 'bg-gray-100 text-gray-600' },
  SIMULADO: { label: 'Simulado', cls: 'bg-blue-100 text-blue-800' }
};

/** Estados de Woo con guion o guion bajo → texto corto en español. */
const ESTADOS_WOO = {
  'on-hold': 'En espera', processing: 'Procesando', completed: 'Completado', cancelled: 'Cancelado',
  refunded: 'Reembolsado', failed: 'Fallido', pending: 'Pendiente de pago',
  'epayco-processing': 'Pagado ePayco', 'epayco-completed': 'Completado ePayco',
  'epayco-cancelled': 'Cancelado ePayco', 'epayco-failed': 'Fallido ePayco', 'epayco-pending': 'Pendiente ePayco'
};
const estadoWooLabel = (s) => ESTADOS_WOO[String(s || '').replace(/_/g, '-')] || s || '-';

const FILTROS = [
  { key: '', label: 'Todos' },
  { key: 'REM_ACTIVA', label: 'Reservados' },
  { key: 'FACTURADO', label: 'Facturados' },
  { key: 'REVISION', label: 'En revisión' },
  { key: 'ERROR', label: 'Con error' },
  { key: 'ANULADO', label: 'Anulados' },
  { key: 'SIN_DOC', label: 'Sin documento' }
];

const PedidosWeb = () => {
  const [pedidos, setPedidos] = useState([]);
  const [conteos, setConteos] = useState({});
  const [salud, setSalud] = useState(null);
  const [filtro, setFiltro] = useState('REM_ACTIVA');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accionEnCurso, setAccionEnCurso] = useState(null); // fac_nro_rem o 'importar'
  const [detalle, setDetalle] = useState(null); // { woo_order_id, documentos }

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filtro) params.estado = filtro;
      const { data } = await axiosInstance.get('/pedidos-web', { params });
      if (data.success) {
        setPedidos(data.pedidos || []);
        setConteos(data.conteos || {});
        setSalud(data.salud || null);
      } else {
        setError(data.error || 'No se pudo cargar el listado');
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => { cargar(); }, [cargar]);

  const confirmarPago = async (p) => {
    const r = await Swal.fire({
      title: '¿Confirmar pago?',
      html: `Se facturará la remisión <b>${p.fac_nro_rem}</b> del pedido web <b>#${p.woo_order_id}</b> (${p.cliente || ''}, ${fmtCOP(p.total_rem)}).<br/>El pedido en WooCommerce pasará a <b>Procesando</b>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, facturar',
      cancelButtonText: 'Cancelar'
    });
    if (!r.isConfirmed) return;
    setAccionEnCurso(p.fac_nro_rem);
    try {
      const { data } = await axiosInstance.post(`/pedidos-web/${p.fac_nro_rem}/facturar`);
      await Swal.fire({ icon: 'success', title: 'Facturado', text: data.message, confirmButtonColor: '#f58ea3' });
      cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo facturar', text: e.response?.data?.error || e.message, confirmButtonColor: '#f58ea3' });
    } finally {
      setAccionEnCurso(null);
    }
  };

  const anular = async (p) => {
    const r = await Swal.fire({
      title: '¿Anular remisión?',
      html: `Se anulará <b>${p.fac_nro_rem}</b> (pedido web <b>#${p.woo_order_id}</b>). El stock vuelve a quedar disponible y el pedido en WooCommerce pasará a <b>Cancelado</b>.`,
      icon: 'warning',
      input: 'text',
      inputLabel: 'Motivo (obligatorio)',
      inputPlaceholder: 'Ej: la clienta no realizó el pago',
      inputValidator: (v) => (!v || !v.trim() ? 'Escribe el motivo' : undefined),
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Anular',
      cancelButtonText: 'Volver'
    });
    if (!r.isConfirmed) return;
    setAccionEnCurso(p.fac_nro_rem);
    try {
      const { data } = await axiosInstance.post(`/pedidos-web/${p.fac_nro_rem}/anular`, { motivo: r.value.trim() });
      await Swal.fire({ icon: 'success', title: 'Anulada', text: data.message, confirmButtonColor: '#f58ea3' });
      cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'No se pudo anular', text: e.response?.data?.error || e.message, confirmButtonColor: '#f58ea3' });
    } finally {
      setAccionEnCurso(null);
    }
  };

  const importarAhora = async () => {
    setAccionEnCurso('importar');
    try {
      const { data } = await axiosInstance.post('/pedidos-web/importar-ahora');
      const r = data.resumen || {};
      const acciones = Object.entries(r.acciones || {}).map(([k, v]) => `${k}: ${v}`).join(', ') || 'ninguna';
      await Swal.fire({
        icon: data.success ? 'success' : 'error',
        title: r.omitido ? 'Ciclo omitido' : `Importación (${data.modo})`,
        html: r.omitido
          ? r.motivo
          : `Leídos: ${r.leidos ?? 0} · procesados: ${r.procesados ?? 0} · reintentados: ${r.reintentados ?? 0} · con error: ${r.conError ?? 0}<br/><span class="text-xs">Acciones → ${acciones}</span>${r.error ? `<br/><b>Error:</b> ${r.error}` : ''}`,
        confirmButtonColor: '#f58ea3'
      });
      cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || e.message, confirmButtonColor: '#f58ea3' });
    } finally {
      setAccionEnCurso(null);
    }
  };

  const verDocumentos = async (p) => {
    try {
      const { data } = await axiosInstance.get(`/pedidos-web/${p.woo_order_id}/documentos`);
      setDetalle({ pedido: p, documentos: data.documentos || [] });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || e.message, confirmButtonColor: '#f58ea3' });
    }
  };

  const horasParaVencer = (v) => (v ? Math.round((new Date(v).getTime() - Date.now()) / 36e5) : null);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Encabezado + salud del importador */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">Pedidos web</h1>
          <p className="text-xs text-[#64748b]">Remisiones creadas automáticamente desde WooCommerce. Confirma el pago para facturar o anula si no se pagó.</p>
        </div>
        <div className="flex items-center gap-2">
          {salud && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                !salud.enabled ? 'bg-gray-100 text-gray-600' : salud.alerta ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
              }`}
              title={`Cursor: ${fmtFecha(salud.cursor_gmt)} · último OK: ${fmtFecha(salud.ultimo_ok)}${salud.ultimo_error ? ` · error: ${salud.ultimo_error}` : ''}`}
            >
              {salud.alerta && <FaExclamationTriangle className="w-3 h-3" />}
              Importador {!salud.enabled ? 'apagado' : `${salud.modo === 'simulacion' ? 'en simulación' : 'activo'} · último ciclo ${salud.atraso_seg != null ? `hace ${Math.round(salud.atraso_seg / 60)} min` : 'nunca'}`}
            </span>
          )}
          <button
            onClick={importarAhora}
            disabled={accionEnCurso === 'importar'}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[#f58ea3] text-white hover:bg-[#e87d93] disabled:opacity-50"
            title="Consultar WooCommerce ahora sin esperar al siguiente ciclo"
          >
            <FaCloudDownloadAlt className={`w-3 h-3 ${accionEnCurso === 'importar' ? 'animate-pulse' : ''}`} />
            Importar ahora
          </button>
          <button
            onClick={cargar}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,23,42,0.12)] text-[#475569] hover:border-[rgba(15,23,42,0.2)]"
          >
            <FaSyncAlt className="w-3 h-3" />
            Refrescar
          </button>
        </div>
      </div>

      {/* Filtros rápidos con conteo */}
      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => {
          const n = f.key ? (conteos[f.key]?.n ?? 0) : Object.values(conteos).reduce((s, c) => s + (c.n || 0), 0);
          const porVencer = f.key === 'REM_ACTIVA' ? conteos.REM_ACTIVA?.por_vencer || 0 : 0;
          return (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filtro === f.key ? 'bg-[#f58ea3] text-white border-[#f58ea3]' : 'bg-white text-[#475569] border-[rgba(15,23,42,0.12)] hover:border-[#f58ea3]'
              }`}
            >
              {f.label} <span className="opacity-80">({n})</span>
              {porVencer > 0 && <span className="ml-1 text-[10px] bg-red-500 text-white rounded-full px-1.5">{porVencer} por vencer</span>}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
        {error && <p className="text-sm text-[#b91c1c] mb-3">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-[rgba(15,23,42,0.08)]">
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Pedido Woo</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Fecha</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Cliente</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Pago</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Total</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Estado Woo</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Estado ERP</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Documentos</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Vence</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
              {loading ? (
                <tr><td colSpan={10} className="py-8 text-center text-[#64748b]">Cargando pedidos web...</td></tr>
              ) : pedidos.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-[#64748b]">No hay pedidos con este filtro.</td></tr>
              ) : (
                pedidos.map((p) => {
                  const est = ESTADOS_ERP[p.estado_erp] || { label: p.estado_erp, cls: 'bg-gray-100 text-gray-700' };
                  const horas = p.estado_erp === 'REM_ACTIVA' ? horasParaVencer(p.vence_el) : null;
                  const ocupado = accionEnCurso === p.fac_nro_rem;
                  return (
                    <tr key={p.woo_order_id} className="hover:bg-[#fafafa] transition-colors align-top">
                      <td className="py-2 px-3 font-semibold text-[#0f172a]">#{p.woo_order_id}</td>
                      <td className="py-2 px-3 text-[#475569] whitespace-nowrap">{fmtFecha(p.woo_created_gmt || p.rem_fec)}</td>
                      <td className="py-2 px-3">
                        <p className="text-[#0f172a] font-medium">{p.cliente || '-'}</p>
                        <p className="text-xs text-[#64748b]">{p.woo_email || p.nit_ide || ''}</p>
                      </td>
                      <td className="py-2 px-3 text-[#475569]">{p.woo_payment_method === 'bacs' ? 'Transferencia' : p.woo_payment_method === 'epayco' ? 'ePayco' : (p.woo_payment_method || '-')}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#0f172a]">{fmtCOP(p.woo_total)}</td>
                      <td className="py-2 px-3 text-[#475569]">{estadoWooLabel(p.woo_status)}</td>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${est.cls}`}>{est.label}</span>
                        {(p.error || p.ultima_accion) && (
                          <p className="text-[11px] text-[#64748b] mt-1 max-w-[260px] truncate" title={p.error || p.ultima_accion}>{p.error || p.ultima_accion}</p>
                        )}
                      </td>
                      <td className="py-2 px-3 text-xs text-[#475569] whitespace-nowrap">
                        {p.fac_nro_rem && <div>{p.fac_nro_rem}{p.rem_est === 'F' ? ' (facturada)' : p.rem_est === 'I' ? ' (anulada)' : ''}</div>}
                        {p.fac_nro_vta && <div className="font-medium text-[#0f172a]">{p.fac_nro_vta}</div>}
                        {!p.fac_nro_rem && !p.fac_nro_vta && '-'}
                      </td>
                      <td className="py-2 px-3 text-xs whitespace-nowrap">
                        {horas === null ? '-' : (
                          <span className={horas <= 24 ? 'text-red-600 font-semibold' : 'text-[#475569]'}>
                            {horas <= 0 ? 'vencida' : horas < 48 ? `en ${horas} h` : `en ${Math.round(horas / 24)} días`}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => verDocumentos(p)} className="p-2 rounded-lg hover:bg-[#fff5f7] text-[#f58ea3]" title="Ver documentos del ERP">
                            <FaEye className="w-4 h-4" />
                          </button>
                          {p.estado_erp === 'REM_ACTIVA' && p.fac_nro_rem && (
                            <>
                              <button onClick={() => confirmarPago(p)} disabled={ocupado} className="p-2 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-40" title="Confirmar pago (facturar)">
                                <FaCheck className="w-4 h-4" />
                              </button>
                              <button onClick={() => anular(p)} disabled={ocupado} className="p-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-40" title="Anular remisión">
                                <FaBan className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalle de documentos */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#0f172a]">Pedido web #{detalle.pedido.woo_order_id} — documentos en el ERP</h2>
              <button onClick={() => setDetalle(null)} className="text-xs text-[#64748b] hover:text-[#0f172a]">Cerrar</button>
            </div>
            {detalle.pedido.ultima_accion && <p className="text-xs text-[#64748b] mb-3">Última acción: {detalle.pedido.ultima_accion}</p>}
            {detalle.documentos.length === 0 ? (
              <p className="text-sm text-[#64748b]">Este pedido no tiene documentos vigentes en el ERP.</p>
            ) : detalle.documentos.map((d) => (
              <div key={d.fac_nro} className="mb-4 border border-gray-100 rounded-lg p-3">
                <p className="text-sm font-semibold text-[#0f172a]">
                  {d.fac_nro} <span className="text-xs font-normal text-[#64748b]">({d.fac_tip_cod} · estado {d.fac_est_fac}{d.fac_nro_origen ? ` · vínculo ${d.fac_nro_origen}` : ''} · {fmtFecha(d.fac_fec)})</span>
                </p>
                <table className="w-full text-xs mt-2">
                  <thead><tr className="text-[#64748b]"><th className="text-left py-1">Artículo</th><th className="text-right py-1">Cant.</th><th className="text-right py-1">Precio</th><th className="text-right py-1">Total</th></tr></thead>
                  <tbody>
                    {d.lineas.map((l) => (
                      <tr key={l.kar_sec} className={l.kar_bundle_padre ? 'text-[#94a3b8]' : ''}>
                        <td className="py-0.5">{l.kar_bundle_padre ? '↳ ' : ''}{l.art_sec}</td>
                        <td className="py-0.5 text-right tabular-nums">{Number(l.kar_uni)}</td>
                        <td className="py-0.5 text-right tabular-nums">{fmtCOP(l.kar_pre_pub)}</td>
                        <td className="py-0.5 text-right tabular-nums">{fmtCOP(l.kar_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PedidosWeb;
