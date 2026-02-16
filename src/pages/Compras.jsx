import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaEye, FaFilter, FaPlus, FaSearch, FaSyncAlt } from 'react-icons/fa';
import axiosInstance from '../axiosConfig';
import { compraService } from '../services/compraService';

const todayISO = new Date().toISOString().slice(0, 10);

const Compras = () => {
  const navigate = useNavigate();
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compraDetalle, setCompraDetalle] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);

  const [filtros, setFiltros] = useState({
    fecha_desde: todayISO,
    fecha_hasta: todayISO,
    nit_sec: '',
    limit: 100
  });

  const [proveedorQuery, setProveedorQuery] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const totalValor = useMemo(
    () => compras.reduce((sum, compra) => sum + Number(compra.total || 0), 0),
    [compras]
  );

  const cargarCompras = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        fecha_desde: filtros.fecha_desde || undefined,
        fecha_hasta: filtros.fecha_hasta || undefined,
        nit_sec: filtros.nit_sec || undefined,
        limit: filtros.limit || 100
      };
      const data = await compraService.listarCompras(payload);
      if (data.success) {
        setCompras(data.data || []);
      } else {
        setCompras([]);
        setError(data.message || 'No se pudo cargar el listado de compras');
      }
    } catch (err) {
      console.error('Error cargando compras:', err);
      setError(err.response?.data?.message || 'Error cargando compras');
    } finally {
      setLoading(false);
    }
  };

  const buscarProveedores = async () => {
    if (!proveedorQuery.trim()) {
      setProveedores([]);
      return;
    }
    setLoadingProveedores(true);
    try {
      const response = await axiosInstance.get('/nits', {
        params: {
          nit_nom: proveedorQuery,
          PageNumber: 1,
          PageSize: 20
        }
      });
      if (response.data?.success) {
        setProveedores(response.data.nits || []);
      } else {
        setProveedores([]);
      }
    } catch (err) {
      console.error('Error buscando proveedores:', err);
      setProveedores([]);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const verDetalleCompra = async (facNro) => {
    try {
      const data = await compraService.obtenerCompra(facNro);
      if (data.success) {
        setCompraDetalle(data.data);
        setShowDetalle(true);
      }
    } catch (err) {
      console.error('Error obteniendo detalle de compra:', err);
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      fecha_desde: todayISO,
      fecha_hasta: todayISO,
      nit_sec: '',
      limit: 100
    });
    setProveedorQuery('');
    setProveedores([]);
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">Gestión de Compras</h1>
              <p className="text-sm text-[#64748b] mt-1">
                Administración integral de órdenes de compra del ERP.
              </p>
            </div>
            <button
              onClick={() => navigate('/compras/nueva')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#f58ea3] text-white rounded-lg hover:bg-[#e25872] transition-colors text-sm font-semibold"
            >
              <FaPlus className="w-4 h-4" />
              Nueva compra
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex items-center gap-2 mb-3">
            <FaFilter className="text-[#64748b] w-4 h-4" />
            <h2 className="text-sm font-semibold text-[#334155]">Filtros</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Fecha desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_desde: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Fecha hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_hasta: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Proveedor
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proveedorQuery}
                  onChange={(e) => setProveedorQuery(e.target.value)}
                  placeholder="Buscar por nombre de proveedor"
                  className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
                />
                <button
                  onClick={buscarProveedores}
                  className="px-3 h-10 rounded-lg border border-[rgba(15,23,42,0.12)] hover:border-[rgba(15,23,42,0.2)]"
                  title="Buscar proveedores"
                >
                  <FaSearch className="w-4 h-4 text-[#64748b]" />
                </button>
              </div>
              {loadingProveedores && <p className="text-xs text-[#94a3b8] mt-1">Buscando proveedores...</p>}
              {!loadingProveedores && proveedores.length > 0 && (
                <div className="mt-2 border border-[rgba(15,23,42,0.08)] rounded-lg max-h-40 overflow-y-auto">
                  {proveedores.map((prov) => (
                    <button
                      key={prov.nit_sec}
                      onClick={() => {
                        setFiltros((prev) => ({ ...prev, nit_sec: String(prov.nit_sec) }));
                        setProveedorQuery(`${prov.nit_nom} (${prov.nit_ide})`);
                        setProveedores([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fafafa] border-b border-[rgba(15,23,42,0.06)] last:border-b-0"
                    >
                      <p className="text-sm text-[#0f172a] font-medium">{prov.nit_nom}</p>
                      <p className="text-xs text-[#64748b]">NIT: {prov.nit_ide} · Código: {prov.nit_sec}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Límite
              </label>
              <select
                value={filtros.limit}
                onChange={(e) => setFiltros((prev) => ({ ...prev, limit: Number(e.target.value) }))}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={cargarCompras}
                className="h-10 px-4 bg-[#f58ea3] text-white rounded-lg hover:bg-[#e25872] transition-colors text-sm font-semibold"
              >
                Aplicar
              </button>
              <button
                onClick={limpiarFiltros}
                className="h-10 px-4 bg-white border border-[rgba(15,23,42,0.12)] rounded-lg hover:border-[rgba(15,23,42,0.2)] text-sm font-medium text-[#475569]"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#334155]">Listado de compras</h2>
            <button
              onClick={cargarCompras}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,23,42,0.12)] text-[#475569] hover:border-[rgba(15,23,42,0.2)]"
            >
              <FaSyncAlt className="w-3 h-3" />
              Refrescar
            </button>
          </div>

          {error && <p className="text-sm text-[#b91c1c] mb-3">{error}</p>}

          <div className="text-xs text-[#64748b] mb-2">
            {compras.length} compras · Valor acumulado {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalValor)}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-[rgba(15,23,42,0.08)]">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Compra</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Fecha</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Proveedor</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Items</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Total</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Usuario</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748b]">Cargando compras...</td>
                  </tr>
                ) : compras.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#64748b]">No hay compras para mostrar con los filtros actuales.</td>
                  </tr>
                ) : (
                  compras.map((compra) => (
                    <tr key={compra.fac_nro} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2 px-3 font-semibold text-[#0f172a]">{compra.fac_nro}</td>
                      <td className="py-2 px-3 text-[#475569]">{new Date(compra.fac_fec).toLocaleDateString('es-CO')}</td>
                      <td className="py-2 px-3">
                        <p className="text-[#0f172a] font-medium">{compra.proveedor || '-'}</p>
                        <p className="text-xs text-[#64748b]">nit_sec: {compra.nit_sec}</p>
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-[#475569]">{compra.total_items}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-semibold text-[#0f172a]">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(compra.total)}
                      </td>
                      <td className="py-2 px-3 text-[#475569]">{compra.usu_cod || '-'}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => verDetalleCompra(compra.fac_nro)}
                            className="p-2 rounded-lg hover:bg-[#fff5f7] text-[#f58ea3]"
                            title="Ver detalle"
                          >
                            <FaEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/compras/editar/${compra.fac_nro}`)}
                            className="p-2 rounded-lg hover:bg-[#fff5f7] text-[#f58ea3]"
                            title="Editar compra"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showDetalle && compraDetalle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0f172a]">Detalle de compra {compraDetalle.encabezado.fac_nro}</h3>
                <p className="text-sm text-[#64748b]">
                  {new Date(compraDetalle.encabezado.fac_fec).toLocaleDateString('es-CO')} · {compraDetalle.encabezado.proveedor}
                </p>
              </div>
              <button onClick={() => setShowDetalle(false)} className="px-3 py-1.5 rounded-lg border border-[rgba(15,23,42,0.12)] text-sm">
                Cerrar
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-[#475569] mb-3">{compraDetalle.encabezado.fac_obs || 'Sin observaciones'}</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[rgba(15,23,42,0.08)]">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Artículo</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Cantidad</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Costo</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                    {compraDetalle.detalles.map((detalle) => (
                      <tr key={detalle.kar_sec}>
                        <td className="py-2 px-3">
                          <p className="font-medium text-[#0f172a]">{detalle.art_nom}</p>
                          <p className="text-xs text-[#64748b]">{detalle.art_cod}</p>
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">{detalle.cantidad}</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(detalle.costo_unitario)}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums font-semibold">
                          {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(detalle.valor_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
