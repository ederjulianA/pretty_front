// src/pages/Dashboard.jsx
// SPEC-013 (14/sep/2026): el panel "Sincronización de Pedidos WooCommerce" (traer pedidos como
// cotización por lotes con un estado por corrida) se retiró al pasar el importador automático a
// modo real. Los pedidos web ahora entran solos como remisiones (REM) y se gestionan en /pedidos-web;
// el estado del inventario ERP ↔ Woo se ve en /dashboard/inventario (reconciliación nocturna).
// Este Dashboard queda como punto de entrada con los indicadores de ese flujo.
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { FaGlobe, FaBalanceScale, FaChartLine, FaExclamationTriangle } from 'react-icons/fa';

const fmtFecha = (v) => (v ? new Date(v).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '-');

// eslint-disable-next-line react/prop-types
const Tarjeta = ({ to, icono, titulo, children, alerta }) => (
  <Link to={to} className={`block bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition ${alerta ? 'border-red-200' : 'border-gray-100 hover:border-[#f58ea3]'}`}>
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[#f58ea3]">{icono}</span>
      <h3 className="text-base font-semibold text-[#0f172a]">{titulo}</h3>
      {alerta && <FaExclamationTriangle className="text-red-500 w-4 h-4 ml-auto" title={alerta} />}
    </div>
    <div className="text-sm text-[#475569] space-y-1">{children}</div>
  </Link>
);

const Dashboard = () => {
  const [pedidos, setPedidos] = useState(null);
  const [recon, setRecon] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get('/pedidos-web', { params: { limite: 1 } });
        if (data.success) setPedidos({ conteos: data.conteos || {}, salud: data.salud || null });
      } catch { setPedidos({ error: true }); }
      try {
        const { data } = await axiosInstance.get('/woo/reconciliaciones', { params: { limite: 1 } });
        if (data.success) setRecon({ ultima: data.reconciliaciones?.[0] || null, estado: data.estado || null });
      } catch { setRecon({ error: true }); }
    })();
  }, []);

  const c = pedidos?.conteos || {};
  const salud = pedidos?.salud;
  const u = recon?.ultima;
  const alertaImportador = salud && (!salud.enabled || salud.alerta) ? (salud.enabled ? 'El importador lleva más de 10 min sin un ciclo OK' : 'El importador de pedidos web está apagado') : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Dashboard</h2>
          <p className="text-sm text-[#64748b]">Los pedidos de la tienda web entran automáticamente al ERP como remisiones; ya no se sincronizan a mano.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Tarjeta to="/pedidos-web" icono={<FaGlobe className="w-5 h-5" />} titulo="Pedidos web" alerta={alertaImportador}>
            {pedidos?.error ? <p>No se pudo consultar.</p> : (
              <>
                <p><b>{c.REM_ACTIVA?.n ?? 0}</b> reservados (pendientes de pago){c.REM_ACTIVA?.por_vencer ? <span className="text-red-600"> · {c.REM_ACTIVA.por_vencer} por vencer</span> : ''}</p>
                <p><b>{c.FACTURADO?.n ?? 0}</b> facturados · <b>{c.REVISION?.n ?? 0}</b> en revisión · <b>{c.ERROR?.n ?? 0}</b> con error</p>
                {c._alerta?.n ? <p className="text-red-700 font-medium">⚠ {c._alerta.n} con stock insuficiente</p> : <p className="text-green-700">Sin alertas de stock</p>}
                <p className="text-xs text-[#94a3b8]">Importador {salud ? (salud.enabled ? `${salud.modo === 'simulacion' ? 'en simulación' : 'activo'} · último ciclo hace ${Math.round((salud.atraso_seg || 0) / 60)} min` : 'apagado') : '…'}</p>
              </>
            )}
          </Tarjeta>

          <Tarjeta to="/dashboard/inventario" icono={<FaBalanceScale className="w-5 h-5" />} titulo="Inventario ERP ↔ Woo" alerta={u && Number(u.inv_neg_sin_pedido) > 0 ? `${u.inv_neg_sin_pedido} artículos negativos sin pedido web` : null}>
            {recon?.error ? <p>No se pudo consultar.</p> : !u ? <p>Aún no hay reconciliaciones.</p> : (
              <>
                <p>Última reconciliación: {fmtFecha(u.ejecutada_en)} ({u.origen || '-'})</p>
                <p><b>{u.total_diferentes}</b> diferencias de {u.total_comparados} comparados · {u.corregidos} corregidas</p>
                <p className={Number(u.inv_neg_sin_pedido) ? 'text-red-700 font-medium' : ''}>{u.inv_neg_sin_pedido ?? 0} negativos sin pedido web · {u.inv_repetidas ?? 0} repetidas</p>
                <p className="text-xs text-[#94a3b8]">{recon.estado?.enabled ? `Programada a las ${recon.estado.hora}${recon.estado.autocorregir ? ' con autocorrección' : ' (solo reporte)'}` : 'Job nocturno apagado'}</p>
              </>
            )}
          </Tarjeta>

          <Tarjeta to="/dashboard/ventas" icono={<FaChartLine className="w-5 h-5" />} titulo="Ventas">
            <p>Indicadores de ventas por canal, periodo y producto.</p>
          </Tarjeta>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
