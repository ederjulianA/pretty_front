import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaBan, FaEye, FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCierresHistorico } from '../hooks/useCierresHistorico';
import CierreDetalleModal from '../components/cierreMes/CierreDetalleModal';
import ObservacionModal from '../components/cierreMes/ObservacionModal';
import { etiquetaPeriodo, formatCurrency, formatFechaHora, formatNumber } from '../components/cierreMes/formato';

const CierreMes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const { cierres, pagination, loading, error, page, setPage, refetch, fetchDetalle, anularCierre } =
    useCierresHistorico();

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [cierreAAnular, setCierreAAnular] = useState(null);
  const [anulando, setAnulando] = useState(false);

  const cierreNuevo = location.state?.cierreNuevo;
  const puedeCrear = hasPermission('cierre_mes', 'create');
  const puedeAnular = hasPermission('cierre_mes', 'delete');

  useEffect(() => {
    if (cierreNuevo) navigate(location.pathname, { replace: true, state: {} });
    // Solo limpia el resaltado al montar con un cierre recien creado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verDetalle = async (cieSec) => {
    setModalDetalle(true);
    setCargandoDetalle(true);
    setDetalle(await fetchDetalle(cieSec));
    setCargandoDetalle(false);
  };

  const confirmarAnulacion = async (observacion) => {
    setAnulando(true);
    const ok = await anularCierre(cierreAAnular.cie_sec, observacion);
    setAnulando(false);
    if (ok) setCierreAAnular(null);
  };

  const totalPaginas = Math.max(1, Math.ceil((pagination.total ?? 0) / (pagination.pageSize || 20)));

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cierre de Mes</h1>
          <p className="text-sm text-gray-500">Historico de cierres contables mensuales</p>
        </div>
        {puedeCrear && (
          <button
            type="button"
            onClick={() => navigate('/cierre-mes/nuevo')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#f58ea3] hover:bg-[#e57d92] shadow-lg"
          >
            <FaPlus /> Nuevo Cierre
          </button>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 sm:p-6">
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse bg-gray-100 rounded-xl" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={refetch} className="underline font-medium mt-1">
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && cierres.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-gray-500">Aun no se ha generado ningun cierre de mes.</p>
            {puedeCrear && (
              <button
                type="button"
                onClick={() => navigate('/cierre-mes/nuevo')}
                className="mt-3 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92]"
              >
                Generar el primero
              </button>
            )}
          </div>
        )}

        {!loading && !error && cierres.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Periodo</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Estado</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Cerrado</th>
                    <th className="text-left py-2.5 px-3 font-semibold text-gray-700">Usuario</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Facturas</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Ventas</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Comision</th>
                    <th className="text-right py-2.5 px-3 font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cierres.map((cierre) => (
                    <tr
                      key={cierre.cie_sec}
                      className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                        cierre.cie_sec === cierreNuevo ? 'bg-[#fff5f7]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {etiquetaPeriodo(cierre.cie_anio, cierre.cie_mes)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            cierre.cie_estado === 'A' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cierre.cie_estado === 'A' ? 'Activo' : 'Anulado'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{formatFechaHora(cierre.cie_fec_cierre)}</td>
                      <td className="py-2.5 px-3 text-gray-600">{cierre.cie_usu_cod}</td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {formatNumber(cierre.cie_total_ordenes)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                        {formatCurrency(cierre.cie_total_ventas)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {formatCurrency(cierre.cie_total_comision)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => verDetalle(cierre.cie_sec)}
                            title="Ver detalle"
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                          >
                            <FaEye />
                          </button>
                          {puedeAnular && cierre.cie_estado === 'A' && (
                            <button
                              type="button"
                              onClick={() => setCierreAAnular(cierre)}
                              title="Anular cierre"
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                            >
                              <FaBan />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm">
                <span className="text-gray-500">
                  Pagina {pagination.page} de {totalPaginas} · {pagination.total} cierres
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
                    disabled={page >= totalPaginas}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CierreDetalleModal
        abierto={modalDetalle}
        cierre={detalle}
        cargando={cargandoDetalle}
        onCerrar={() => {
          setModalDetalle(false);
          setDetalle(null);
        }}
      />

      <ObservacionModal
        abierto={!!cierreAAnular}
        titulo={
          cierreAAnular ? `Anular cierre de ${etiquetaPeriodo(cierreAAnular.cie_anio, cierreAAnular.cie_mes)}` : ''
        }
        descripcion="El cierre se conserva como historico y el periodo queda liberado para volver a cerrarse."
        etiquetaBoton="Anular cierre"
        procesando={anulando}
        onConfirmar={confirmarAnulacion}
        onCerrar={() => setCierreAAnular(null)}
      />
    </div>
  );
};

export default CierreMes;
