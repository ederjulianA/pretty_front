import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const EditVariationModal = ({
  isOpen,
  onClose,
  parentArtSec,
  variation,
  attributeType,
  onVariationUpdated,
  onVariationDeleted,
}) => {
  const [variationName, setVariationName] = useState('');
  const [precioDetal, setPrecioDetal] = useState('');
  const [precioMayor, setPrecioMayor] = useState('');
  const [attributeValue, setAttributeValue] = useState('');
  const [artPeso, setArtPeso] = useState('');
  const [artLargo, setArtLargo] = useState('');
  const [artAncho, setArtAncho] = useState('');
  const [artAlto, setArtAlto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen && variation) {
      setVariationName(variation.art_nom || '');
      setPrecioDetal(variation.precio_detal || '');
      setPrecioMayor(variation.precio_mayor || '');
      setArtPeso(variation.art_peso ?? '');
      setArtLargo(variation.art_largo ?? '');
      setArtAncho(variation.art_ancho ?? '');
      setArtAlto(variation.art_alto ?? '');
      setAttributeValue(
        variation.art_variation_attributes ? Object.values(variation.art_variation_attributes)[0] : ''
      );
    }
  }, [isOpen, variation]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!variationName || !precioDetal || !precioMayor || !attributeValue) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: `Ingresa el nombre, el ${attributeType.toLowerCase()} y ambos precios.`,
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.put(
        `${API_URL}/articulos/variable/${parentArtSec}/variations/${variation.art_sec}`,
        {
          art_nom: variationName,
          precio_detal: Number(precioDetal),
          precio_mayor: Number(precioMayor),
          attributes: { [attributeType]: attributeValue },
          art_peso: artPeso === '' ? null : Number(artPeso),
          art_largo: artLargo === '' ? null : Number(artLargo),
          art_ancho: artAncho === '' ? null : Number(artAncho),
          art_alto: artAlto === '' ? null : Number(artAlto),
        },
        { headers: { 'x-access-token': token } }
      );

      if (response.data.success) {
        const wooError = response.data.errors?.wooCommerce;
        if (wooError) {
          toast.warning('Variación actualizada, pero no se pudo sincronizar con WooCommerce.');
        } else {
          toast.success('Variación actualizada exitosamente');
        }
        onVariationUpdated();
        onClose();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al actualizar la variación.',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      console.error('Error al actualizar variación:', error);
      const message = error.response?.data?.message || 'Error al actualizar la variación.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar variación?',
      text: `Se eliminará "${variation.art_nom}" del sistema y de WooCommerce. Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    });
    if (!confirm.isConfirmed) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.delete(
        `${API_URL}/articulos/variable/${parentArtSec}/variations/${variation.art_sec}`,
        { headers: { 'x-access-token': token } }
      );

      if (response.data.success) {
        const wooError = response.data.errors?.wooCommerce;
        if (wooError) {
          toast.warning('Variación eliminada localmente, pero no se pudo eliminar en WooCommerce.');
        } else {
          toast.success('Variación eliminada exitosamente');
        }
        onVariationDeleted();
        onClose();
      }
    } catch (error) {
      console.error('Error al eliminar variación:', error);
      if (error.response?.status === 409) {
        Swal.fire({
          icon: 'warning',
          title: 'No se puede eliminar',
          text: error.response?.data?.message || 'Esta variación tiene movimientos de inventario asociados (ventas, ajustes) y no puede eliminarse.',
          confirmButtonColor: '#f58ea3'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Error al eliminar la variación.',
          confirmButtonColor: '#f58ea3'
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !variation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Editar Variación</h3>
            <p className="text-xs text-gray-500 mt-0.5">SKU: {variation.art_cod}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <FaTimes className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">{attributeType}</label>
            <input
              type="text"
              value={attributeValue}
              onChange={(e) => setAttributeValue(e.target.value)}
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
              disabled={isSubmitting || isDeleting}
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Nombre de la variación</label>
            <input
              type="text"
              value={variationName}
              onChange={(e) => setVariationName(e.target.value)}
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
              disabled={isSubmitting || isDeleting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Precio Detal</label>
              <input
                type="number"
                value={precioDetal}
                onChange={(e) => setPrecioDetal(e.target.value)}
                placeholder="0"
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                required
                disabled={isSubmitting || isDeleting}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Precio Mayor</label>
              <input
                type="number"
                value={precioMayor}
                onChange={(e) => setPrecioMayor(e.target.value)}
                placeholder="0"
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                required
                disabled={isSubmitting || isDeleting}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Peso y dimensiones (opcional)</label>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="number"
                value={artPeso}
                onChange={(e) => setArtPeso(e.target.value)}
                placeholder="Kg"
                min="0"
                step="0.01"
                className="w-full p-2.5 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition text-sm"
                disabled={isSubmitting || isDeleting}
              />
              <input
                type="number"
                value={artLargo}
                onChange={(e) => setArtLargo(e.target.value)}
                placeholder="Largo cm"
                min="0"
                step="0.1"
                className="w-full p-2.5 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition text-sm"
                disabled={isSubmitting || isDeleting}
              />
              <input
                type="number"
                value={artAncho}
                onChange={(e) => setArtAncho(e.target.value)}
                placeholder="Ancho cm"
                min="0"
                step="0.1"
                className="w-full p-2.5 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition text-sm"
                disabled={isSubmitting || isDeleting}
              />
              <input
                type="number"
                value={artAlto}
                onChange={(e) => setArtAlto(e.target.value)}
                placeholder="Alto cm"
                min="0"
                step="0.1"
                className="w-full p-2.5 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition text-sm"
                disabled={isSubmitting || isDeleting}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Necesario para que envia.com cotice el envío de esta variación correctamente. Déjalos vacíos para borrar el valor guardado.
            </p>
          </div>

          <div className="flex justify-between items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting || isDeleting}
              className="px-4 py-2 rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash className="w-3 h-3" />}
              Eliminar
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-[#f58ea3] text-[#f58ea3] rounded-xl bg-[#fffafe] hover:bg-[#f7b3c2]/40 transition font-semibold text-sm"
                disabled={isSubmitting || isDeleting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:from-[#e07d92] hover:to-[#f58ea3] transition disabled:opacity-60 flex items-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVariationModal;
