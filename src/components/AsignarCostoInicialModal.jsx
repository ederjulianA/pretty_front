// src/components/AsignarCostoInicialModal.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import axiosInstance from '../axiosConfig';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const AsignarCostoInicialModal = ({ isOpen, onClose, articulo, onSuccess }) => {
  const [costoInicial, setCostoInicial] = useState('');
  const [cantidad, setCantidad] = useState(articulo?.existencia || 1);
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear formulario cuando se abre el modal
  React.useEffect(() => {
    if (isOpen && articulo) {
      setCostoInicial('');
      setCantidad(articulo.existencia || 1);
      setObservaciones('');
    }
  }, [isOpen, articulo]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (!costoInicial || parseFloat(costoInicial) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El costo inicial debe ser mayor a 0',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    if (!cantidad || parseFloat(cantidad) <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'La cantidad debe ser mayor a 0',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Endpoint correcto según documentación del backend
      // POST /api/carga-costos/registrar-individual
      const payload = {
        art_sec: articulo.art_sec,
        art_cod: articulo.art_cod,
        costo_inicial: parseFloat(costoInicial),
        cantidad: parseFloat(cantidad),
        metodo: 'MANUAL',
        observaciones: observaciones.trim() || 'Costo inicial asignado desde dashboard de costos'
      };

      const response = await axiosInstance.post('/carga-costos/registrar-individual', payload);

      if (response.data.success) {
        const { estado, margen, precio_venta, siguiente_paso } = response.data.data;
        const usuCod = localStorage.getItem('user_pretty') || undefined;
        
        // Función auxiliar para aplicar el costo
        const aplicarCosto = async () => {
          const aplicarPayload = usuCod ? { usu_cod: usuCod } : {};
          const aplicarResponse = await axiosInstance.post('/carga-costos/aplicar', aplicarPayload);
          
          if (aplicarResponse.data.success) {
            const { total_aplicados } = aplicarResponse.data.data || {};
            return { success: true, total_aplicados };
          } else {
            throw new Error(aplicarResponse.data.message || 'Error al aplicar costo');
          }
        };

        // Función auxiliar para aprobar el costo si tiene alertas
        const aprobarCosto = async () => {
          try {
            const aprobarResponse = await axiosInstance.put(
              `/carga-costos/aprobar/${articulo.art_cod}`,
              { observaciones: 'Aprobado automáticamente después de asignar costo inicial' }
            );
            return aprobarResponse.data.success;
          } catch (error) {
            console.error('Error aprobando costo:', error);
            throw error;
          }
        };

        try {
          let costoAplicado = false;
          let mensajeFinal = '';

          // Si el estado es VALIDADO, aplicar directamente
          if (estado === 'VALIDADO') {
            await aplicarCosto();
            costoAplicado = true;
            mensajeFinal = `✅ Costo inicial de ${formatCurrency(parseFloat(costoInicial))} aplicado exitosamente al artículo ${articulo.art_cod}\n\n✅ Estado: Validado (Margen: ${margen}%)`;
          } 
          // Si el estado es VALIDADO_CON_ALERTAS, aprobar primero y luego aplicar
          else if (estado === 'VALIDADO_CON_ALERTAS') {
            await aprobarCosto();
            await aplicarCosto();
            costoAplicado = true;
            mensajeFinal = `✅ Costo inicial de ${formatCurrency(parseFloat(costoInicial))} aplicado exitosamente al artículo ${articulo.art_cod}\n\n⚠️ Advertencia: Margen bajo (${margen}% < 20%)\n\nEl costo fue aprobado y aplicado automáticamente.`;
          } 
          // Si fue rechazado, mostrar error y no cerrar el modal
          else if (estado === 'RECHAZADO') {
            Swal.fire({
              icon: 'error',
              title: 'Costo Rechazado',
              text: `❌ No se pudo registrar el costo:\n\n${response.data.data.observaciones || 'El costo fue rechazado por el sistema'}\n\nPrecio de venta: ${formatCurrency(precio_venta)}\n\n${siguiente_paso || ''}`,
              confirmButtonColor: '#f58ea3'
            });
            return; // No cerrar el modal para permitir corrección
          } 
          // Estado PENDIENTE u otro - intentar aplicar de todas formas
          else {
            // Intentar aplicar aunque el estado no sea VALIDADO
            try {
              await aplicarCosto();
              costoAplicado = true;
              mensajeFinal = `✅ Costo inicial de ${formatCurrency(parseFloat(costoInicial))} aplicado exitosamente al artículo ${articulo.art_cod}\n\nEstado: ${estado}`;
            } catch (error) {
              // Si no se puede aplicar, mostrar mensaje informativo
              mensajeFinal = `⚠️ Costo registrado pero no se pudo aplicar automáticamente\n\nEstado: ${estado}\n\n${siguiente_paso || 'Puede aplicar los costos manualmente más tarde.'}`;
            }
          }

          // Mostrar mensaje de éxito y refrescar datos
          Swal.fire({
            icon: costoAplicado ? 'success' : 'warning',
            title: costoAplicado ? 'Costo Aplicado Exitosamente' : 'Costo Registrado',
            text: mensajeFinal,
            confirmButtonColor: '#f58ea3'
          }).then(() => {
            onSuccess?.();
            onClose();
          });

        } catch (error) {
          console.error('Error aplicando costo:', error);
          // Si hay error al aplicar, mostrar mensaje pero mantener el costo registrado
          Swal.fire({
            icon: 'warning',
            title: 'Costo Registrado',
            text: `El costo se registró pero hubo un error al aplicarlo: ${error.response?.data?.message || error.message}\n\nPuede aplicar los costos manualmente más tarde desde el dashboard.`,
            confirmButtonColor: '#f58ea3'
          }).then(() => {
            onSuccess?.();
            onClose();
          });
        }
      } else {
        throw new Error(response.data.message || 'Error al asignar costo inicial');
      }
    } catch (error) {
      console.error('Error asignando costo inicial:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || error.message || 'Error al asignar el costo inicial. Verifique que el endpoint esté disponible.',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !articulo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Asignar Costo Inicial
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Información del artículo */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Código
              </label>
              <p className="text-sm font-semibold text-gray-900">{articulo.art_cod}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nombre
              </label>
              <p className="text-sm text-gray-700">{articulo.art_nom}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Existencia Actual
                </label>
                <p className="text-sm font-semibold text-gray-900">{articulo.existencia || 0}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Precio Mayor
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(articulo.precio_mayor || 0)}
                </p>
              </div>
            </div>
            {articulo.costo_sugerido && (
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Costo Sugerido
                </label>
                <p className="text-sm font-semibold text-amber-600">
                  {formatCurrency(articulo.costo_sugerido)}
                </p>
              </div>
            )}
          </div>

          {/* Campo: Cantidad */}
          <div>
            <label htmlFor="cantidad" className="block text-sm font-medium text-gray-700 mb-1">
              Cantidad <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="cantidad"
              min="1"
              step="1"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Cantidad de unidades"
            />
            <p className="mt-1 text-xs text-gray-500">
              Cantidad de unidades para las que se asigna este costo inicial
            </p>
          </div>

          {/* Campo: Costo Inicial */}
          <div>
            <label htmlFor="costoInicial" className="block text-sm font-medium text-gray-700 mb-1">
              Costo Inicial (Unitario) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                id="costoInicial"
                min="0"
                step="0.01"
                value={costoInicial}
                onChange={(e) => setCostoInicial(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder={articulo.costo_sugerido ? formatCurrency(articulo.costo_sugerido) : "0.00"}
              />
            </div>
            {articulo.costo_sugerido && (
              <button
                type="button"
                onClick={() => setCostoInicial(articulo.costo_sugerido.toString())}
                disabled={isSubmitting}
                className="mt-1 text-xs text-amber-600 hover:text-amber-700 underline disabled:opacity-50"
              >
                Usar costo sugerido: {formatCurrency(articulo.costo_sugerido)}
              </button>
            )}
          </div>

          {/* Campo: Observaciones */}
          <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones (Opcional)
            </label>
            <textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
              placeholder="Notas adicionales sobre este costo inicial..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !costoInicial || parseFloat(costoInicial) <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="w-4 h-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                'Asignar Costo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AsignarCostoInicialModal;
