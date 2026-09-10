import React from 'react';
import { formatCurrency, formatNumber, formatPorcentaje } from './formato';

/**
 * `rentabilidad` llega del backend como utilidad en PESOS, no como porcentaje
 * (a diferencia de `rentabilidad_promedio` del dashboard de ventas). Por eso la
 * columna se titula Utilidad y se formatea como moneda.
 */
const ResumenCanalesTabla = ({ canales = [], totales }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr className="border-b border-gray-200">
          <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Canal</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Ordenes</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Ticket Prom.</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Ventas</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">% Comision</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Comision</th>
          <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Utilidad</th>
        </tr>
      </thead>
      <tbody>
        {canales.map((canal) => (
          <tr key={canal.canal} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2.5 px-3 font-medium text-gray-900">{canal.canal}</td>
            <td className="text-right py-2.5 px-3 text-gray-700">{formatNumber(canal.ordenes)}</td>
            <td className="text-right py-2.5 px-3 text-gray-700">{formatCurrency(canal.ticket_promedio)}</td>
            <td className="text-right py-2.5 px-3 font-semibold text-gray-900">{formatCurrency(canal.ventas)}</td>
            <td className="text-right py-2.5 px-3 text-gray-500">{formatPorcentaje(canal.porcentaje_comision)}</td>
            <td className="text-right py-2.5 px-3 text-gray-700">{formatCurrency(canal.comision)}</td>
            <td className="text-right py-2.5 px-3 text-gray-700">{formatCurrency(canal.rentabilidad)}</td>
          </tr>
        ))}
      </tbody>
      {totales && (
        <tfoot>
          <tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold text-gray-900">
            <td className="py-3 px-3">Total</td>
            <td className="text-right py-3 px-3">{formatNumber(totales.ordenes)}</td>
            <td className="text-right py-3 px-3">—</td>
            <td className="text-right py-3 px-3 text-[#f58ea3]">{formatCurrency(totales.ventas)}</td>
            <td className="text-right py-3 px-3">—</td>
            <td className="text-right py-3 px-3">{formatCurrency(totales.comision)}</td>
            <td className="text-right py-3 px-3">{formatCurrency(totales.rentabilidad)}</td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

export default ResumenCanalesTabla;
