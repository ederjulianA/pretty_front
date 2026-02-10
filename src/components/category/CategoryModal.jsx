import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaSave, FaFolderPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const CategoryModal = ({ isOpen, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    inv_gru_nom: '',
    inv_gru_des: '',
    inv_gru_woo_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (category) {
        // Editing mode
        setFormData({
          inv_gru_nom: category.inv_gru_nom || '',
          inv_gru_des: category.inv_gru_des || '',
          inv_gru_woo_id: category.inv_gru_woo_id || '',
        });
      } else {
        // Create mode
        setFormData({
          inv_gru_nom: '',
          inv_gru_des: '',
          inv_gru_woo_id: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validate = () => {
    const newErrors = {};

    if (!formData.inv_gru_nom.trim()) {
      newErrors.inv_gru_nom = 'El nombre es requerido';
    } else if (formData.inv_gru_nom.length > 100) {
      newErrors.inv_gru_nom = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.inv_gru_des && formData.inv_gru_des.length > 500) {
      newErrors.inv_gru_des = 'La descripción no puede exceder 500 caracteres';
    }

    if (formData.inv_gru_woo_id) {
      const wooId = parseInt(formData.inv_gru_woo_id);
      if (isNaN(wooId) || wooId <= 0) {
        newErrors.inv_gru_woo_id = 'El ID de WooCommerce debe ser un número positivo';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClearSync = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Limpiar sincronización?',
      html: `
        <p class="mb-2">Esto eliminará el ID de WooCommerce actual.</p>
        <p class="text-sm text-gray-600">La próxima actualización creará una nueva categoría en WooCommerce.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#gray'
    });

    if (result.isConfirmed) {
      setFormData(prev => ({ ...prev, inv_gru_woo_id: '' }));
      toast.info('Sincronización limpiada. Guarda los cambios para aplicar.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Confirmación si se está editando el WooCommerce ID manualmente
    if (category && formData.inv_gru_woo_id && formData.inv_gru_woo_id !== category.inv_gru_woo_id) {
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Cambiar ID de WooCommerce?',
        html: `
          <p class="mb-2">Estás cambiando el ID de WooCommerce de:</p>
          <p class="font-semibold">${category.inv_gru_woo_id || 'ninguno'} → ${formData.inv_gru_woo_id}</p>
          <p class="text-sm text-orange-600 mt-2">⚠️ Asegúrate de que este ID existe en WooCommerce</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, actualizar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f58ea3'
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      let response;

      // Preparar datos: convertir empty string a null para woo_id
      const dataToSend = {
        ...formData,
        inv_gru_woo_id: formData.inv_gru_woo_id ? parseInt(formData.inv_gru_woo_id) : null
      };

      if (category) {
        // Update existing category
        response = await axios.put(
          `${API_URL}/categorias/${category.inv_gru_cod}`,
          dataToSend,
          { headers: { 'x-access-token': token } }
        );
      } else {
        // Create new category
        response = await axios.post(
          `${API_URL}/categorias`,
          dataToSend,
          { headers: { 'x-access-token': token } }
        );
      }

      if (response.data.success) {
        // Show sync status
        const wooSync = response.data.data?.woo_sync;
        if (wooSync && !wooSync.synced) {
          Swal.fire({
            icon: 'warning',
            title: category ? 'Categoría Actualizada' : 'Categoría Creada',
            html: `
              <p class="mb-2">${response.data.message}</p>
              <p class="text-sm text-orange-600">⚠️ No se pudo sincronizar con WooCommerce:</p>
              <p class="text-sm text-gray-600">${wooSync.error || 'Error desconocido'}</p>
            `,
            confirmButtonColor: '#f58ea3'
          });
        } else {
          toast.success(response.data.message || (category ? 'Categoría actualizada' : 'Categoría creada exitosamente'));
        }
        onSave();
      } else {
        throw new Error(response.data.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      const message = error.response?.data?.message || error.message || 'Error al guardar la categoría';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fff5f7] rounded-lg">
              <FaFolderPlus className="w-5 h-5 text-[#f58ea3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {category ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              {category && (
                <p className="text-xs text-gray-500">Código: {category.inv_gru_cod}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <FaTimes className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">
              Nombre de la Categoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="inv_gru_nom"
              value={formData.inv_gru_nom}
              onChange={handleChange}
              placeholder="Ej: Maquillaje, Cuidado de la Piel..."
              className={`w-full p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${
                errors.inv_gru_nom ? 'border-red-500' : 'border-[#f5cad4]'
              }`}
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.inv_gru_nom && (
              <p className="text-red-500 text-xs mt-1">{errors.inv_gru_nom}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.inv_gru_nom.length}/100 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              name="inv_gru_des"
              value={formData.inv_gru_des}
              onChange={handleChange}
              placeholder="Descripción de la categoría..."
              rows={4}
              className={`w-full p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition resize-none ${
                errors.inv_gru_des ? 'border-red-500' : 'border-[#f5cad4]'
              }`}
              disabled={isSubmitting}
              maxLength={500}
            />
            {errors.inv_gru_des && (
              <p className="text-red-500 text-xs mt-1">{errors.inv_gru_des}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.inv_gru_des.length}/500 caracteres
            </p>
          </div>

          {/* WooCommerce ID - Solo visible al editar */}
          {category && (
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                ID de WooCommerce (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="inv_gru_woo_id"
                  value={formData.inv_gru_woo_id}
                  onChange={handleChange}
                  placeholder="ID en WooCommerce..."
                  className={`flex-1 p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${
                    errors.inv_gru_woo_id ? 'border-red-500' : 'border-[#f5cad4]'
                  }`}
                  disabled={isSubmitting}
                  min="1"
                />
                {formData.inv_gru_woo_id && (
                  <button
                    type="button"
                    onClick={handleClearSync}
                    className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition font-medium text-sm flex items-center gap-2"
                    disabled={isSubmitting}
                    title="Limpiar sincronización"
                  >
                    <FaTrash className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>
              {errors.inv_gru_woo_id && (
                <p className="text-red-500 text-xs mt-1">{errors.inv_gru_woo_id}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formData.inv_gru_woo_id
                  ? '✓ Asociada a categoría WooCommerce existente'
                  : 'Dejar vacío para crear nueva categoría en WooCommerce al guardar'
                }
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-[#f58ea3] text-[#f58ea3] rounded-xl bg-[#fffafe] hover:bg-[#f7b3c2]/40 transition font-semibold text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:from-[#e07d92] hover:to-[#f58ea3] transition disabled:opacity-60 flex items-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin w-4 h-4" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {category ? 'Actualizar' : 'Crear Categoría'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
