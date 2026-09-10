import React from 'react';
import { FaTimes } from 'react-icons/fa';
import ResumenCanalesTabla from './ResumenCanalesTabla';
import { etiquetaPeriodo, formatCurrency, formatFecha, formatFechaHora } from './formato';

const canalesDesdeCabecera = (cierre) => [
  {
    canal: 'WooCommerce',
    ordenes: cierre.cie_woo_ordenes,
    ventas: cierre.cie_woo_ventas,
    ticket_promedio: cierre.cie_woo_ticket_prom,
    porcentaje_comision: cierre.cie_woo_pct_comision,
    comision: cierre.cie_woo_comision,
    rentabilidad: cierre.cie_woo_rentabilidad,
  },
  {
    canal: 'Local',
    ordenes: cierre.cie_loc_ordenes,
    ventas: cierre.cie_loc_ventas,
    ticket_promedio: cierre.cie_loc_ticket_prom,
    porcentaje_comision: cierre.cie_loc_pct_comision,
    comision: cierre.cie_loc_comision,
    rentabilidad: cierre.cie_loc_rentabilidad,
  },
];

const CierreDetalleModal = ({ abierto, cierre, cargando, onCerrar }) => {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[88vh] flex flex-col">
        <div className="flex items-start justify-between p-5 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {cierre ? `Cierre de ${etiquetaPeriodo(cierre.cie_anio, cierre.cie_mes)}` : 'Detalle del cierre'}
            </h3>
            {cierre && (
              <p className="text-sm text-gray-500 mt-1">
                Generado el {formatFechaHora(cierre.cie_fec_cierre)} por {cierre.cie_usu_cod}
              </p>
            )}
          </div>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {cargando && <div className="h-40 animate-pulse bg-gray-100 rounded-xl" />}

          {!cargando && cierre && (
            <>
              {cierre.cie_estado === 'I' && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">Cierre anulado el {formatFechaHora(cierre.cie_anu_fec)}</p>
                  {cierre.cie_anu_usu_cod && <p>Anulado por {cierre.cie_anu_usu_cod}</p>}
                  {cierre.cie_anu_obs && <p className="mt-1">{cierre.cie_anu_obs}</p>}
                </div>
              )}

              {cierre.cie_obs && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  <span className="font-medium">Observaciones: </span>
                  {cierre.cie_obs}
                </div>
              )}

              <ResumenCanalesTabla
                canales={canalesDesdeCabecera(cierre)}
                totales={{
                  ordenes: cierre.cie_total_ordenes,
                  ventas: cierre.cie_total_ventas,
                  comision: cierre.cie_total_comision,
                  rentabilidad: cierre.cie_total_rentabilidad,
                }}
              />

              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-2">
                  Facturas incluidas ({cierre.detalle?.length ?? 0})
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Factura</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Canal</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Fecha</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Total</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Comision</th>
                        <th className="text-right py-2 px-3 font-semibold text-gray-700">Utilidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cierre.detalle ?? []).map((linea) => (
                        <tr key={linea.cid_sec} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 px-3 font-medium text-gray-900">{linea.fac_nro}</td>
                          <td className="py-2 px-3 text-gray-600">{linea.cid_canal}</td>
                          <td className="py-2 px-3 text-gray-600">{formatFecha(linea.cid_fecha)}</td>
                          <td className="py-2 px-3 text-right text-gray-900">{formatCurrency(linea.cid_total)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(linea.cid_comision)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">
                            {formatCurrency(linea.cid_rentabilidad)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end p-5 border-t border-gray-200">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CierreDetalleModal;
