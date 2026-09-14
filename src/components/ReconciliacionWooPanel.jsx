// src/components/ReconciliacionWooPanel.jsx — SPEC-013 Fase 3 (Tarea 7)
// Panel de la reconciliación nocturna ERP ↔ WooCommerce: último reporte, invariantes, botones
// "Reconciliar ahora" (solo reporte) y "Reconciliar y corregir" (empuja las diferencias por el
// punto único), historial y detalle. Se monta en DiferenciaInventario.jsx.
import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../axiosConfig';
import Swal from 'sweetalert2';
import { FaBalanceScale, FaSyncAlt, FaTools, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const fmtFecha = (v) => (v ? new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-');

const INVARIANTES = [
  { key: 'pedidos_comprometidos_sin_documento', label: 'Pedidos Woo sin REM/VTA', ok0: true, ayuda: 'Pedidos que comprometen stock en Woo y no tienen documento vigente en el ERP. Debe ser 0: el importador los crea en ≤60 s.' },
  { key: 'rem_vencidas_sin_anular', label: 'REM vencidas sin anular', ok0: true, ayuda: 'Remisiones activas cuya fecha de vencimiento ya pasó. Las anula el job de vencimiento (Tarea 6).' },
  { key: 'vta_activa_con_pedido_cancelado', label: 'VTA con pedido cancelado', ok0: true, ayuda: 'Facturas activas cuyo pedido en Woo está cancelado o reembolsado. Decisión contable manual.' },
  { key: 'negativos_con_pedido_web', label: 'Negativos con pedido web', ok0: false, ayuda: 'Existencias negativas explicadas por una REM activa o una VTA web reciente (ya alertadas en Pedidos web).' },
  { key: 'negativos_sin_pedido_web', label: 'Negativos SIN pedido web', ok0: true, ayuda: 'Existencias negativas que ningún pedido web explica: entrada sin registrar o venta de mostrador sin saldo. Revisar en bodega.' },
  { key: 'diferencias_repetidas', label: 'Diferencias repetidas', ok0: true, ayuda: 'Artículos con diferencia ERP≠Woo en dos reconciliaciones seguidas: algo escribe stock por fuera del ERP.' }
];

const ReconciliacionWooPanel = () => {
  const [historial, setHistorial] = useState([]);
  const [estado, setEstado] = useState(null);
  const [detalle, setDetalle] = useState(null); // reporte completo del seleccionado
  const [cargando, setCargando] = useState(false);
  const [corriendo, setCorriendo] = useState(false);
  const [abierto, setAbierto] = useState(true);
  const [seccion, setSeccion] = useState('diferencias'); // diferencias | negativos_sin | negativos_con | sin_doc | vta_cancelada | repetidas | huerfanos

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await axiosInstance.get('/woo/reconciliaciones', { params: { limite: 15 } });
      if (data.success) {
        setHistorial(data.reconciliaciones || []);
        setEstado(data.estado || null);
        if (data.reconciliaciones?.length) {
          const d = await axiosInstance.get(`/woo/reconciliaciones/${data.reconciliaciones[0].id}`);
          if (d.data.success) setDetalle(d.data.reconciliacion);
        } else {
          setDetalle(null);
        }
      }
    } catch (e) {
      console.error('reconciliaciones:', e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const verReporte = async (id) => {
    try {
      const d = await axiosInstance.get(`/woo/reconciliaciones/${id}`);
      if (d.data.success) { setDetalle(d.data.reconciliacion); setSeccion('diferencias'); }
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || e.message, confirmButtonColor: '#f58ea3' });
    }
  };

  const reconciliar = async (autocorregir) => {
    if (autocorregir) {
      const r = await Swal.fire({
        title: '¿Reconciliar y corregir WooCommerce?',
        html: 'Se compara todo el catálogo y, donde el stock de Woo difiera del ERP, <b>se escribe el valor del ERP en Woo</b> (el ERP es la fuente de verdad). No modifica nada en el ERP.',
        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Sí, corregir', cancelButtonText: 'Cancelar'
      });
      if (!r.isConfirmed) return;
    }
    setCorriendo(true);
    try {
      const { data } = await axiosInstance.post('/woo/reconciliar', { autocorregir });
      const rep = data.reporte || {};
      if (rep.omitido) {
        Swal.fire({ icon: 'info', title: 'Ya hay una reconciliación en curso', text: rep.motivo, confirmButtonColor: '#f58ea3' });
      } else {
        const inv = rep.invariantes?.resumen || {};
        await Swal.fire({
          icon: rep.error ? 'error' : (rep.diferencias?.length || inv.negativos_sin_pedido_web ? 'warning' : 'success'),
          title: rep.error ? 'La reconciliación falló' : 'Reconciliación terminada',
          html: rep.error ? rep.error : `${rep.comparados} artículos comparados · <b>${rep.diferencias?.length || 0} diferencias</b> · ${rep.corregidos || 0} corregidas<br/><span class="text-xs">Negativos sin pedido web: ${inv.negativos_sin_pedido_web ?? 0} · pedidos Woo sin documento: ${inv.pedidos_comprometidos_sin_documento ?? 0} · repetidas: ${inv.diferencias_repetidas ?? 0} · ${Math.round((rep.duracion_ms || 0) / 1000)} s</span>`,
          confirmButtonColor: '#f58ea3'
        });
      }
      cargar();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.error || e.response?.data?.reporte?.error || e.message, confirmButtonColor: '#f58ea3' });
    } finally {
      setCorriendo(false);
    }
  };

  const ultima = historial[0];
  const inv = detalle?.invariantes || {};
  const resumen = inv.resumen || {};

  const filas = (() => {
    switch (seccion) {
      case 'diferencias': return { cols: ['Código', 'Artículo', 'ERP', 'Woo', 'Dif.', 'Estado Woo'], rows: (detalle?.diferencias || []).map((d) => [d.art_cod, d.art_nom, d.erp, d.woo, d.diferencia, d.status]) };
      case 'negativos_sin': return { cols: ['Código', 'Artículo', 'Existencia'], rows: (inv.negativos_sin_pedido_web || []).map((n) => [n.art_cod, n.art_nom, n.existencia]) };
      case 'negativos_con': return { cols: ['Código', 'Artículo', 'Existencia', 'REM activas', 'VTA web recientes'], rows: (inv.negativos_con_pedido_web || []).map((n) => [n.art_cod, n.art_nom, n.existencia, n.rem_activas || '-', n.vta_web_recientes || '-']) };
      case 'sin_doc': return { cols: ['Pedido Woo', 'Estado Woo', 'Estado ERP', 'Error'], rows: (inv.pedidos_comprometidos_sin_documento || []).map((p) => [`#${p.woo_order_id}`, p.woo_status, p.estado_erp, p.error || '-']) };
      case 'vta_cancelada': return { cols: ['Pedido Woo', 'Estado Woo', 'VTA', 'Fecha'], rows: (inv.vta_activa_con_pedido_cancelado || []).map((p) => [`#${p.woo_order_id}`, p.woo_status, p.fac_nro_vta, fmtFecha(p.fac_fec)]) };
      case 'repetidas': return { cols: ['Código', 'Artículo', 'ERP', 'Woo', 'Anterior (ERP/Woo)'], rows: (inv.diferencias_repetidas || []).map((d) => [d.art_cod, d.art_nom, d.erp, d.woo, `${d.anterior?.erp}/${d.anterior?.woo}`]) };
      case 'huerfanos': return { cols: ['Código', 'Artículo', 'ID Woo', 'ERP'], rows: (inv.no_existen_en_woo || []).map((d) => [d.art_cod, d.art_nom, d.woo_id, d.erp]) };
      default: return { cols: [], rows: [] };
    }
  })();

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <FaBalanceScale className="text-[#f58ea3] w-5 h-5" />
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Reconciliación ERP ↔ WooCommerce</h3>
            <p className="text-xs text-[#64748b]">
              {estado?.enabled ? `Programada a las ${estado.hora}${estado.autocorregir ? ' con autocorrección' : ' (solo reporte)'}` : 'Job nocturno apagado'} · última: {ultima ? `${fmtFecha(ultima.ejecutada_en)} (${ultima.origen || '-'}${ultima.usuario ? `, ${ultima.usuario}` : ''})` : 'nunca'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => reconciliar(false)} disabled={corriendo} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,23,42,0.12)] text-[#475569] hover:border-[#f58ea3] disabled:opacity-50">
            <FaSyncAlt className={`w-3 h-3 ${corriendo ? 'animate-spin' : ''}`} /> Reconciliar ahora (reporte)
          </button>
          <button onClick={() => reconciliar(true)} disabled={corriendo} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-[#f58ea3] text-white hover:bg-[#e87d93] disabled:opacity-50">
            <FaTools className="w-3 h-3" /> Reconciliar y corregir
          </button>
          <button onClick={() => setAbierto(!abierto)} className="p-2 text-[#64748b]" title={abierto ? 'Ocultar' : 'Mostrar'}>{abierto ? <FaChevronUp /> : <FaChevronDown />}</button>
        </div>
      </div>

      {abierto && (
        <>
          {cargando && !detalle && <p className="text-sm text-[#64748b] mt-4">Cargando…</p>}
          {!cargando && !detalle && <p className="text-sm text-[#64748b] mt-4">Aún no hay reconciliaciones. Ejecuta una con «Reconciliar ahora».</p>}

          {detalle && (
            <>
              {/* Tarjetas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-[#fff5f7] p-3 rounded-lg"><p className="text-xs text-gray-600">Comparados</p><p className="text-xl font-bold text-[#f58ea3]">{detalle.total_comparados}</p></div>
                <button onClick={() => setSeccion('diferencias')} className={`p-3 rounded-lg text-left ${seccion === 'diferencias' ? 'ring-2 ring-[#f58ea3]' : ''} ${detalle.total_diferentes ? 'bg-amber-50' : 'bg-green-50'}`}><p className="text-xs text-gray-600">Diferencias ERP ≠ Woo</p><p className={`text-xl font-bold ${detalle.total_diferentes ? 'text-amber-700' : 'text-green-700'}`}>{detalle.total_diferentes}</p></button>
                <div className="bg-[#fff5f7] p-3 rounded-lg"><p className="text-xs text-gray-600">Corregidas</p><p className="text-xl font-bold text-[#f58ea3]">{detalle.corregidos}{detalle.autocorregir ? '' : ' (solo reporte)'}</p></div>
                <button onClick={() => setSeccion('huerfanos')} className={`p-3 rounded-lg text-left bg-gray-50 ${seccion === 'huerfanos' ? 'ring-2 ring-[#f58ea3]' : ''}`}><p className="text-xs text-gray-600">Sin producto en Woo</p><p className="text-xl font-bold text-gray-700">{(inv.no_existen_en_woo || []).length}</p></button>
              </div>

              {/* Invariantes */}
              <div className="flex flex-wrap gap-2 mt-3">
                {INVARIANTES.map((i) => {
                  const n = Number(resumen[i.key] ?? 0);
                  const mal = i.ok0 && n > 0;
                  const sec = { pedidos_comprometidos_sin_documento: 'sin_doc', rem_vencidas_sin_anular: null, vta_activa_con_pedido_cancelado: 'vta_cancelada', negativos_con_pedido_web: 'negativos_con', negativos_sin_pedido_web: 'negativos_sin', diferencias_repetidas: 'repetidas' }[i.key];
                  return (
                    <button key={i.key} onClick={() => sec && setSeccion(sec)} title={i.ayuda} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${mal ? 'bg-red-50 text-red-700 border-red-200' : n > 0 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'} ${seccion === sec ? 'ring-2 ring-[#f58ea3]' : ''}`}>
                      {i.label}: <b>{n}</b>
                    </button>
                  );
                })}
              </div>

              {/* Detalle de la sección */}
              <div className="mt-3 overflow-x-auto max-h-80 overflow-y-auto border border-gray-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-white"><tr className="text-[#64748b] border-b border-gray-100">{filas.cols.map((c) => <th key={c} className="text-left py-1.5 px-2">{c}</th>)}</tr></thead>
                  <tbody>
                    {filas.rows.length === 0 ? (
                      <tr><td colSpan={filas.cols.length || 1} className="py-3 px-2 text-center text-[#64748b]">Nada que mostrar en esta sección.</td></tr>
                    ) : filas.rows.map((r, idx) => (
                      <tr key={idx} className="border-b border-gray-50 hover:bg-[#fafafa]">{r.map((c, j) => <td key={j} className="py-1 px-2 tabular-nums">{c}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Historial */}
          {historial.length > 1 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">Historial</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[#64748b] border-b border-gray-100"><th className="text-left py-1 px-2">Fecha</th><th className="text-left py-1 px-2">Origen</th><th className="text-right py-1 px-2">Comparados</th><th className="text-right py-1 px-2">Diferencias</th><th className="text-right py-1 px-2">Corregidas</th><th className="text-right py-1 px-2">Neg. sin pedido</th><th className="text-right py-1 px-2">Repetidas</th><th className="text-right py-1 px-2">Duración</th></tr></thead>
                  <tbody>
                    {historial.map((h) => (
                      <tr key={h.id} onClick={() => verReporte(h.id)} className={`cursor-pointer hover:bg-[#fff5f7] border-b border-gray-50 ${detalle?.id === h.id ? 'bg-[#fff5f7]' : ''}`}>
                        <td className="py-1 px-2">{fmtFecha(h.ejecutada_en)}</td>
                        <td className="py-1 px-2">{h.origen || '-'}{h.usuario ? ` · ${h.usuario}` : ''}{h.error ? ' · ERROR' : ''}</td>
                        <td className="py-1 px-2 text-right tabular-nums">{h.total_comparados}</td>
                        <td className={`py-1 px-2 text-right tabular-nums ${h.total_diferentes ? 'text-amber-700 font-semibold' : ''}`}>{h.total_diferentes}</td>
                        <td className="py-1 px-2 text-right tabular-nums">{h.corregidos}</td>
                        <td className={`py-1 px-2 text-right tabular-nums ${Number(h.inv_neg_sin_pedido) ? 'text-red-700 font-semibold' : ''}`}>{h.inv_neg_sin_pedido ?? '-'}</td>
                        <td className={`py-1 px-2 text-right tabular-nums ${Number(h.inv_repetidas) ? 'text-red-700 font-semibold' : ''}`}>{h.inv_repetidas ?? '-'}</td>
                        <td className="py-1 px-2 text-right tabular-nums">{h.duracion_ms ? `${Math.round(h.duracion_ms / 1000)} s` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReconciliacionWooPanel;
