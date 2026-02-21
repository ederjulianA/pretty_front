import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlus, FaSearch, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import axiosInstance from '../axiosConfig';
import { compraService } from '../services/compraService';
import ArticleSearchModal from '../components/ArticleSearchModal';

const defaultLinea = () => ({
  id: `${Date.now()}-${Math.random()}`,
  kar_sec: '',
  art_sec: '',
  art_cod: '',
  art_nom: '',
  cantidad: '',
  costo_unitario: ''
});

const todayISO = new Date().toISOString().slice(0, 10);

const CompraForm = () => {
  const navigate = useNavigate();
  const { fac_nro: facNro } = useParams();
  const isEdit = Boolean(facNro);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [encabezado, setEncabezado] = useState({
    nit_sec: '',
    proveedorLabel: '',
    fac_fec: todayISO,
    fac_obs: '',
    fac_est_fac: 'A'
  });
  const [detalles, setDetalles] = useState([defaultLinea()]);
  const [detallesOriginales, setDetallesOriginales] = useState([]);

  const [proveedorQuery, setProveedorQuery] = useState('');
  const [proveedores, setProveedores] = useState([]);
  const [loadingProveedores, setLoadingProveedores] = useState(false);

  const [showArticuloModal, setShowArticuloModal] = useState(false);
  const [lineaActiva, setLineaActiva] = useState(null);

  const totalCompra = useMemo(
    () =>
      detalles.reduce((sum, item) => {
        const cantidad = Number(item.cantidad || 0);
        const costo = Number(item.costo_unitario || 0);
        return sum + cantidad * costo;
      }, 0),
    [detalles]
  );

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
    } catch (error) {
      console.error('Error buscando proveedores:', error);
      setProveedores([]);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const cargarCompraEditar = async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const data = await compraService.obtenerCompra(facNro);
      if (data.success) {
        const { encabezado: enc, detalles: det } = data.data;
        setEncabezado({
          nit_sec: String(enc.nit_sec),
          proveedorLabel: `${enc.proveedor} (nit_sec: ${enc.nit_sec})`,
          fac_fec: new Date(enc.fac_fec).toISOString().slice(0, 10),
          fac_obs: enc.fac_obs || '',
          fac_est_fac: enc.fac_est_fac || 'A'
        });
        const detallesMapeados = (det || []).map((item) => ({
          id: `${item.kar_sec}-${item.art_sec}`,
          kar_sec: item.kar_sec,
          art_sec: item.art_sec,
          art_cod: item.art_cod,
          art_nom: item.art_nom,
          cantidad: Number(item.cantidad),
          costo_unitario: Number(item.costo_unitario)
        }));
        setDetalles(detallesMapeados);
        setDetallesOriginales(detallesMapeados);
      }
    } catch (error) {
      console.error('Error cargando compra para edición:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cargar la compra para edición'
      });
      navigate('/compras');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCompraEditar();
  }, [facNro]);

  const actualizarLinea = (id, campo, valor) => {
    setDetalles((prev) => prev.map((linea) => (linea.id === id ? { ...linea, [campo]: valor } : linea)));
  };

  const agregarLinea = () => setDetalles((prev) => [...prev, defaultLinea()]);

  const eliminarLinea = (id) => {
    setDetalles((prev) => {
      const siguiente = prev.filter((linea) => linea.id !== id);
      return siguiente.length > 0 ? siguiente : [defaultLinea()];
    });
  };

  const abrirSelectorArticulo = (idLinea) => {
    setLineaActiva(idLinea);
    setShowArticuloModal(true);
  };

  const seleccionarArticulo = (articulo) => {
    if (!lineaActiva) return;
    setDetalles((prev) =>
      prev.map((linea) =>
        linea.id === lineaActiva
          ? (() => {
              const costoActual = Number(linea.costo_unitario || 0);
              const costoPromedio = Number(articulo.average_cost || 0);
              return {
                ...linea,
                art_sec: articulo.id,
                art_cod: articulo.codigo,
                art_nom: articulo.name,
                // Si la línea aún no tiene costo, sugerimos el costo promedio enviado por backend.
                costo_unitario: costoActual > 0 ? linea.costo_unitario : costoPromedio > 0 ? costoPromedio : linea.costo_unitario
              };
            })()
          : linea
      )
    );
    setShowArticuloModal(false);
  };

  const buscarArticuloPorCodigo = async (idLinea, codigoIngresado) => {
    const codigo = String(codigoIngresado || '').trim();
    if (!codigo) return;

    try {
      const response = await axiosInstance.get(`/consultarArticuloByArtCod/articulo/${encodeURIComponent(codigo)}`);
      if (response.data?.success && response.data?.articulo) {
        const articulo = response.data.articulo;
        setDetalles((prev) =>
          prev.map((linea) =>
            linea.id === idLinea
              ? {
                  ...linea,
                  art_sec: articulo.art_sec,
                  art_cod: articulo.art_cod,
                  art_nom: articulo.art_nom
                }
              : linea
          )
        );
        return;
      }

      await Swal.fire({
        icon: 'warning',
        title: 'Artículo no encontrado',
        text: `No se encontró ningún artículo con el código ${codigo}`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });

      setDetalles((prev) =>
        prev.map((linea) =>
          linea.id === idLinea
            ? {
                ...linea,
                art_sec: '',
                art_nom: ''
              }
            : linea
        )
      );
    } catch (error) {
      console.error('Error buscando artículo por código:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo consultar el artículo por código',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true
      });
    }
  };

  const validarFormulario = () => {
    if (!encabezado.nit_sec) {
      return 'Debe seleccionar un proveedor';
    }
    if (!encabezado.fac_fec) {
      return 'La fecha de compra es requerida';
    }
    const lineasValidas = detalles.filter((linea) => linea.art_sec);
    if (lineasValidas.length === 0) {
      return 'Debe agregar al menos un artículo';
    }
    for (const [index, linea] of lineasValidas.entries()) {
      if (!linea.cantidad || Number(linea.cantidad) <= 0) {
        return `Línea ${index + 1}: cantidad debe ser mayor a 0`;
      }
      if (!linea.costo_unitario || Number(linea.costo_unitario) <= 0) {
        return `Línea ${index + 1}: costo unitario debe ser mayor a 0`;
      }
    }
    return null;
  };

  const construirPayload = () => {
    const lineasValidas = detalles
      .filter((linea) => linea.art_sec && Number(linea.cantidad) > 0 && Number(linea.costo_unitario) > 0)
      .map((linea) => ({
        art_sec: linea.art_sec,
        cantidad: Number(linea.cantidad),
        costo_unitario: Number(linea.costo_unitario)
      }));

    return {
      nit_sec: encabezado.nit_sec,
      fac_fec: encabezado.fac_fec,
      fac_obs: encabezado.fac_obs || '',
      detalles: lineasValidas
    };
  };

  const construirPayloadEdicion = () => {
    const payloadBase = {
      nit_sec: encabezado.nit_sec,
      fac_fec: encabezado.fac_fec,
      fac_obs: encabezado.fac_obs || '',
      fac_est_fac: encabezado.fac_est_fac || 'A'
    };

    const originalesPorKarSec = new Map(
      detallesOriginales
        .filter((linea) => linea.kar_sec)
        .map((linea) => [Number(linea.kar_sec), linea])
    );

    // Líneas existentes (con kar_sec): solo las que tengan cambio de cantidad o costo
    const detallesActualizados = detalles
      .filter((linea) => linea.kar_sec)
      .map((linea) => {
        const karSec = Number(linea.kar_sec);
        const cantidadNueva = Number(linea.cantidad);
        const costoNuevo = Number(linea.costo_unitario);
        const original = originalesPorKarSec.get(karSec);
        const cantidadCambio = !original || Number(original.cantidad) !== cantidadNueva;
        const costoCambio = !original || Number(original.costo_unitario) !== costoNuevo;

        if (!cantidadCambio && !costoCambio) return null;

        return {
          kar_sec: karSec,
          ...(cantidadCambio ? { cantidad: cantidadNueva } : {}),
          ...(costoCambio ? { costo_unitario: costoNuevo } : {})
        };
      })
      .filter(Boolean);

    if (detallesActualizados.length > 0) {
      payloadBase.detalles = detallesActualizados;
    }

    // Ítems nuevos (sin kar_sec): art_sec, cantidad, costo_unitario para que el backend pueda insertarlos
    const detallesNuevos = detalles
      .filter((linea) => !linea.kar_sec && linea.art_sec && Number(linea.cantidad) > 0 && Number(linea.costo_unitario) > 0)
      .map((linea) => ({
        art_sec: linea.art_sec,
        cantidad: Number(linea.cantidad),
        costo_unitario: Number(linea.costo_unitario)
      }));

    if (detallesNuevos.length > 0) {
      payloadBase.detalles_nuevos = detallesNuevos;
    }

    return payloadBase;
  };

  const guardarCompra = async () => {
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      await Swal.fire({
        icon: 'warning',
        title: 'Validación',
        text: errorValidacion
      });
      return;
    }

    setGuardando(true);
    try {
      if (isEdit) {
        const payloadEdicion = construirPayloadEdicion();
        const respuesta = await compraService.actualizarCompra(facNro, payloadEdicion);

        if (respuesta.success) {
          const detallesActualizados = respuesta.detalles_actualizados || [];
          const detallesNuevosInsertados = respuesta.detalles_nuevos_insertados || [];
          const lineas = [
            `<p>La compra <b>${respuesta.fac_nro || facNro}</b> fue actualizada correctamente.</p>`,
            detallesActualizados.length > 0 && `<p>Detalles actualizados: <b>${detallesActualizados.length}</b></p>`,
            detallesNuevosInsertados.length > 0 && `<p>Ítems nuevos agregados: <b>${detallesNuevosInsertados.length}</b></p>`
          ].filter(Boolean);
          await Swal.fire({
            icon: 'success',
            title: 'Compra actualizada',
            html: `<div style="text-align:left">${lineas.join('')}</div>`,
            confirmButtonColor: '#f58ea3'
          });
          navigate('/compras');
          return;
        }
      }

      const payload = construirPayload();
      const respuestaCrear = await compraService.crearCompra(payload);
      if (respuestaCrear.success) {
        await Swal.fire({
          icon: 'success',
          title: isEdit ? 'Nueva compra generada' : 'Compra creada',
          text: `Número: ${respuestaCrear.data?.fac_nro || 'N/A'}`,
          confirmButtonColor: '#f58ea3'
        });
        navigate('/compras');
      } else {
        throw new Error(respuestaCrear.message || 'No se pudo guardar la compra');
      }
    } catch (error) {
      console.error('Error guardando compra:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'No se pudo guardar la compra'
      });
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <p className="text-[#64748b]">Cargando compra...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">
                {isEdit ? `Editar compra ${facNro}` : 'Nueva compra'}
              </h1>
              <p className="text-sm text-[#64748b] mt-1">
                Registro de compras con costo promedio ponderado.
              </p>
            </div>
            <button
              onClick={() => navigate('/compras')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(15,23,42,0.12)] text-sm text-[#475569]"
            >
              <FaArrowLeft className="w-4 h-4" />
              Volver
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#334155]">Datos de la compra</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Proveedor
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proveedorQuery}
                  onChange={(e) => setProveedorQuery(e.target.value)}
                  placeholder="Buscar proveedor por nombre"
                  className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
                />
                <button
                  type="button"
                  onClick={buscarProveedores}
                  className="px-3 h-10 rounded-lg border border-[rgba(15,23,42,0.12)]"
                  title="Buscar proveedor"
                >
                  <FaSearch className="w-4 h-4 text-[#64748b]" />
                </button>
              </div>
              {encabezado.proveedorLabel && (
                <p className="text-xs text-[#0f172a] mt-1 font-medium">Seleccionado: {encabezado.proveedorLabel}</p>
              )}
              {loadingProveedores && <p className="text-xs text-[#94a3b8] mt-1">Buscando proveedores...</p>}
              {!loadingProveedores && proveedores.length > 0 && (
                <div className="mt-2 border border-[rgba(15,23,42,0.08)] rounded-lg max-h-44 overflow-y-auto">
                  {proveedores.map((prov) => (
                    <button
                      key={prov.nit_sec}
                      onClick={() => {
                        setEncabezado((prev) => ({
                          ...prev,
                          nit_sec: String(prov.nit_sec),
                          proveedorLabel: `${prov.nit_nom} (NIT: ${prov.nit_ide})`
                        }));
                        setProveedores([]);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#fafafa] border-b border-[rgba(15,23,42,0.06)] last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[#0f172a]">{prov.nit_nom}</p>
                      <p className="text-xs text-[#64748b]">NIT: {prov.nit_ide} · nit_sec: {prov.nit_sec}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Fecha compra
              </label>
              <input
                type="date"
                value={encabezado.fac_fec}
                onChange={(e) => setEncabezado((prev) => ({ ...prev, fac_fec: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Estado factura
              </label>
              <select
                value={encabezado.fac_est_fac}
                onChange={(e) => setEncabezado((prev) => ({ ...prev, fac_est_fac: e.target.value }))}
                className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              >
                <option value="A">Activa (A)</option>
                <option value="I">Inactiva (I)</option>
                <option value="C">Cancelada (C)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
                Total estimado
              </label>
              <div className="w-full h-10 px-3 rounded-lg border border-[rgba(15,23,42,0.12)] flex items-center font-semibold text-[#0f172a]">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalCompra)}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-[#64748b] font-semibold uppercase tracking-wide mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={encabezado.fac_obs}
              onChange={(e) => setEncabezado((prev) => ({ ...prev, fac_obs: e.target.value }))}
              className="w-full p-3 rounded-lg border border-[rgba(15,23,42,0.12)]"
              placeholder="Notas de la compra..."
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#334155]">Detalle de artículos</h2>
            <button
              onClick={agregarLinea}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff5f7] text-[#f58ea3] border border-[#f58ea3]/30 text-sm font-semibold"
            >
              <FaPlus className="w-4 h-4" />
              Agregar línea
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-[rgba(15,23,42,0.08)]">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Código / Artículo</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Cantidad</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Costo unitario</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Subtotal</th>
                  <th className="text-center py-2 px-3 text-xs font-semibold text-[#64748b] uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(15,23,42,0.08)]">
                {detalles.map((linea) => {
                  const subtotal = Number(linea.cantidad || 0) * Number(linea.costo_unitario || 0);
                  return (
                    <tr key={linea.id}>
                      <td className="py-2 px-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={linea.art_cod || ''}
                              onChange={(e) => actualizarLinea(linea.id, 'art_cod', e.target.value)}
                              onBlur={(e) => buscarArticuloPorCodigo(linea.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  buscarArticuloPorCodigo(linea.id, e.currentTarget.value);
                                }
                              }}
                              placeholder="Código artículo"
                              className="w-full h-9 px-2 rounded-lg border border-[rgba(15,23,42,0.12)] text-sm"
                            />
                            <button
                              onClick={() => abrirSelectorArticulo(linea.id)}
                              className="px-2 h-9 rounded-lg border border-[rgba(15,23,42,0.12)] text-xs text-[#475569]"
                              title="Buscar artículo"
                            >
                              <FaSearch className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {linea.art_sec ? (
                            <p className="font-medium text-[#0f172a] text-sm">{linea.art_nom}</p>
                          ) : (
                            <p className="text-xs text-[#94a3b8]">Sin artículo seleccionado</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={linea.cantidad}
                          onChange={(e) => actualizarLinea(linea.id, 'cantidad', e.target.value)}
                          className="w-24 h-9 px-2 rounded-lg border border-[rgba(15,23,42,0.12)] text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={linea.costo_unitario}
                          onChange={(e) => actualizarLinea(linea.id, 'costo_unitario', e.target.value)}
                          className="w-32 h-9 px-2 rounded-lg border border-[rgba(15,23,42,0.12)] text-right"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-semibold tabular-nums">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal)}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => eliminarLinea(linea.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-[#ef4444]"
                            title="Eliminar línea"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate('/compras')}
            className="px-4 py-2 rounded-lg border border-[rgba(15,23,42,0.12)] text-[#475569] font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={guardarCompra}
            disabled={guardando}
            className="px-4 py-2 rounded-lg bg-[#f58ea3] hover:bg-[#e25872] text-white font-semibold disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear compra'}
          </button>
        </div>
      </div>

      {showArticuloModal && (
        <ArticleSearchModal
          isOpen={showArticuloModal}
          onClose={() => setShowArticuloModal(false)}
          onSelectArticle={seleccionarArticulo}
        />
      )}
    </div>
  );
};

export default CompraForm;
