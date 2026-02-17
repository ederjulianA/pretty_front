// src/components/AprobarCostosAlertasModal.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../axiosConfig';
import { FaTimes, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const AprobarCostosAlertasModal = ({ isOpen, onClose, onSuccess }) => {
  const [costosConAlertas, setCostosConAlertas] = useState([]);
  const [cargandoCostos, setCargandoCostos] = useState(false);
  const [costosSeleccionados, setCostosSeleccionados] = useState(new Set());
  const [aprobarTodos, setAprobarTodos] = useState(false);
  const [aplicandoCambios, setAplicandoCambios] = useState(false);
  const [observacionesAprobacion, setObservacionesAprobacion] = useState('');

  // Cargar costos con alertas cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      cargarCostosConAlertas();
      setCostosSeleccionados(new Set());
      setAprobarTodos(false);
      setObservacionesAprobacion('');
    }
  }, [isOpen]);

  const cargarCostosConAlertas = async () => {
    setCargandoCostos(true);
    try {
      const response = await axiosInstance.get('/carga-costos/alertas');
      if (response.data.success) {
        setCostosConAlertas(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Error al cargar costos con alertas');
      }
    } catch (error) {
      console.error('Error cargando costos con alertas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Error al cargar los costos con alertas',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setCargandoCostos(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const toggleSeleccionarTodos = () => {
    if (aprobarTodos) {
      setCostosSeleccionados(new Set());
      setAprobarTodos(false);
    } else {
      const todosLosIds = new Set(costosConAlertas.map(c => c.art_cod));
      setCostosSeleccionados(todosLosIds);
      setAprobarTodos(true);
    }
  };

  const toggleSeleccionarCosto = (artCod) => {
    const nuevosSeleccionados = new Set(costosSeleccionados);
    if (nuevosSeleccionados.has(artCod)) {
      nuevosSeleccionados.delete(artCod);
    } else {
      nuevosSeleccionados.add(artCod);
    }
    setCostosSeleccionados(nuevosSeleccionados);
    setAprobarTodos(nuevosSeleccionados.size === costosConAlertas.length);
  };

  const aprobarCostosSeleccionados = async () => {
    if (costosSeleccionados.size === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin selección',
        text: 'Por favor seleccione al menos un costo para aprobar',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: 'Aprobar Costos',
      text: `¿Está seguro de aprobar ${costosSeleccionados.size} costo(s) con alertas?\n\nEsto cambiará su estado a VALIDADO y podrán aplicarse.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmacion.isConfirmed) {
      return;
    }

    setAplicandoCambios(true);
    try {
      const costosParaAprobar = Array.from(costosSeleccionados);
      
      // Usar aprobación masiva (endpoint implementado por el backend)
      const observaciones = observacionesAprobacion.trim() || 'Aprobados masivamente desde dashboard de costos';
      
      const updateResponse = await axiosInstance.put('/carga-costos/actualizar-estado', {
        art_cods: costosParaAprobar,
        observaciones
      });

      if (updateResponse.data.success) {
        const { total_actualizados, total_errores, errores } = updateResponse.data.data || {};
        const aprobados = total_actualizados || 0;
        
        let mensaje = `✅ ${aprobados} costo(s) aprobado(s) exitosamente`;
        
        if (total_errores > 0 && errores && errores.length > 0) {
          mensaje += `\n\n⚠️ ${total_errores} error(es):\n${errores.slice(0, 5).join('\n')}`;
          if (errores.length > 5) {
            mensaje += `\n... y ${errores.length - 5} más`;
          }
        }

        Swal.fire({
          icon: total_errores > 0 ? 'warning' : 'success',
          title: total_errores > 0 ? 'Aprobación Parcial' : 'Costos Aprobados',
          text: mensaje,
          confirmButtonColor: '#f58ea3'
        }).then(() => {
          onSuccess?.();
          onClose();
        });
      } else {
        throw new Error(updateResponse.data.message || 'Error al aprobar costos');
      }

    } catch (error) {
      console.error('Error aprobando costos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Error al aprobar los costos',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setAplicandoCambios(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle className="text-amber-600 w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Aprobar Costos con Alertas
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Seleccione los costos que desea aprobar para cambiar su estado a VALIDADO
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={aplicandoCambios}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {cargandoCostos ? (
            <div className="flex items-center justify-center py-12">
              <FaSpinner className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Cargando costos con alertas...</span>
            </div>
          ) : costosConAlertas.length === 0 ? (
            <div className="text-center py-12">
              <FaCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No hay costos con alertas pendientes</p>
            </div>
          ) : (
            <>
              {/* Seleccionar todos */}
              <div className="mb-4 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aprobarTodos}
                    onChange={toggleSeleccionarTodos}
                    disabled={aplicandoCambios}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Seleccionar todos ({costosConAlertas.length})
                  </span>
                </label>
                <span className="text-sm text-gray-500">
                  {costosSeleccionados.size} seleccionado(s)
                </span>
              </div>

              {/* Tabla de costos */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        <input
                          type="checkbox"
                          checked={aprobarTodos}
                          onChange={toggleSeleccionarTodos}
                          disabled={aplicandoCambios}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Código</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Producto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Costo Propuesto</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Precio Venta</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Margen</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {costosConAlertas.map((costo) => {
                      const estaSeleccionado = costosSeleccionados.has(costo.art_cod);
                      const margen = parseFloat(costo.margen || 0);
                      
                      return (
                        <tr
                          key={costo.art_cod}
                          className={`hover:bg-gray-50 transition-colors ${estaSeleccionado ? 'bg-blue-50' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={estaSeleccionado}
                              onChange={() => toggleSeleccionarCosto(costo.art_cod)}
                              disabled={aplicandoCambios}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{costo.art_cod}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs truncate" title={costo.art_nom}>
                            {costo.art_nom}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">
                            {formatCurrency(costo.costo_propuesto || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700">
                            {formatCurrency(costo.precio_venta || 0)}
                          </td>
                          <td className={`px-4 py-3 text-right font-medium ${margen < 20 ? 'text-amber-600' : 'text-green-600'}`}>
                            {margen.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              costo.estado === 'VALIDADO_CON_ALERTAS'
                                ? 'bg-amber-100 text-amber-800'
                                : costo.estado === 'RECHAZADO'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {costo.estado === 'VALIDADO_CON_ALERTAS' && <FaExclamationTriangle className="w-3 h-3" />}
                              {costo.estado === 'RECHAZADO' && <FaTimesCircle className="w-3 h-3" />}
                              {costo.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Campo de observaciones */}
              <div className="mt-4">
                <label htmlFor="observaciones-aprobacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  id="observaciones-aprobacion"
                  value={observacionesAprobacion}
                  onChange={(e) => setObservacionesAprobacion(e.target.value)}
                  disabled={aplicandoCambios}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none text-sm"
                  placeholder="Razón de la aprobación (ej: márgenes validados por gerencia, productos estratégicos, etc.)"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {costosConAlertas.length > 0 && (
              <>
                Total: <strong>{costosConAlertas.length}</strong> costo(s) con alertas
                {costosSeleccionados.size > 0 && (
                  <> · Seleccionados: <strong>{costosSeleccionados.size}</strong></>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={aplicandoCambios}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={aprobarCostosSeleccionados}
              disabled={aplicandoCambios || costosSeleccionados.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {aplicandoCambios ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Aprobando...
                </>
              ) : (
                <>
                  <FaCheckCircle className="w-4 h-4" />
                  Aprobar Seleccionados ({costosSeleccionados.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AprobarCostosAlertasModal;
