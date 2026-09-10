export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value));
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '0';
  return new Intl.NumberFormat('es-CO').format(Number(value));
};

export const formatPorcentaje = (value) => {
  if (value === null || value === undefined || value === '') return '0,00%';
  return `${Number(value).toFixed(2).replace('.', ',')}%`;
};

export const formatFecha = (value) => {
  if (!value) return '—';
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatFechaHora = (value) => {
  if (!value) return '—';
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

export const etiquetaPeriodo = (anio, mes) => `${MESES[Number(mes) - 1] ?? mes} ${anio}`;

export const etiquetaEstadoWoo = (estado) => {
  if (!estado) return 'Sin estado';
  return estado.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

/**
 * Un pedido cancelado esta RESUELTO aunque no este confirmado: el usuario ya
 * decidio que no se paga ni se despacha. Confundir "confirmado" con "resuelto"
 * dejaba la accion "Marcar como no pagado" sin salida — nunca desbloqueaba.
 */
export const ESTADO_CANCELADO = 'cancelled';

export const esPedidoResuelto = (item) =>
  item?.confirmado === true || item?.fac_est_woo === ESTADO_CANCELADO;
