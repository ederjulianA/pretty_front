import React, { useState, useEffect } from 'react';
import { FaTimes, FaSpinner, FaSave, FaLayerGroup, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const SubcategoryModal = ({ isOpen, onClose, subcategory, parentCategory, onSave }) => {
  const [formData, setFormData] = useState({
    inv_sub_gru_nom: '',
    inv_sub_gru_des: '',
    inv_sub_gru_woo_id: '',
    inv_gru_cod: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Fetch available categories when modal opens in edit mode
  useEffect(() => {
    const fetchCategories = async () => {
      if (isOpen && subcategory) {
        setIsLoadingCategories(true);
        try {
          const token = localStorage.getItem('pedidos_pretty_token');
          const response = await axios.get(`${API_URL}/categorias?limit=1000`, {
            headers: { 'x-access-token': token }
          });

          if (response.data.success) {
            setAvailableCategories(response.data.data || []);
          }
        } catch (error) {
          console.error('Error fetching categories:', error);
          toast.error('Error al cargar las categorías disponibles');
        } finally {
          setIsLoadingCategories(false);
        }
      }
    };

    fetchCategories();
  }, [isOpen, subcategory]);

  useEffect(() => {
    if (isOpen) {
      if (subcategory) {
        // Editing mode
        setFormData({
          inv_sub_gru_nom: subcategory.inv_sub_gru_nom || '',
          inv_sub_gru_des: subcategory.inv_sub_gru_des || '',
          inv_sub_gru_woo_id: subcategory.inv_sub_gru_woo_id || '',
          inv_gru_cod: subcategory.inv_gru_cod || parentCategory?.inv_gru_cod || '',
        });
      } else {
        // Create mode
        setFormData({
          inv_sub_gru_nom: '',
          inv_sub_gru_des: '',
          inv_sub_gru_woo_id: '',
          inv_gru_cod: parentCategory?.inv_gru_cod || '',
        });
      }
      setErrors({});
    }
  }, [isOpen, subcategory, parentCategory]);

  const validate = () => {
    const newErrors = {};

    if (!formData.inv_sub_gru_nom.trim()) {
      newErrors.inv_sub_gru_nom = 'El nombre es requerido';
    } else if (formData.inv_sub_gru_nom.length > 100) {
      newErrors.inv_sub_gru_nom = 'El nombre no puede exceder 100 caracteres';
    }

    if (formData.inv_sub_gru_des && formData.inv_sub_gru_des.length > 500) {
      newErrors.inv_sub_gru_des = 'La descripción no puede exceder 500 caracteres';
    }

    if (formData.inv_sub_gru_woo_id) {
      const wooId = parseInt(formData.inv_sub_gru_woo_id);
      if (isNaN(wooId) || wooId <= 0) {
        newErrors.inv_sub_gru_woo_id = 'El ID de WooCommerce debe ser un número positivo';
      }
    }

    if (!formData.inv_gru_cod) {
      newErrors.inv_gru_cod = 'Debe seleccionar una categoría padre';
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
        <p class="text-sm text-gray-600">La próxima actualización creará una nueva subcategoría en WooCommerce.</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#gray'
    });

    if (result.isConfirmed) {
      setFormData(prev => ({ ...prev, inv_sub_gru_woo_id: '' }));
      toast.info('Sincronización limpiada. Guarda los cambios para aplicar.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Confirmación si se está cambiando la categoría padre
    if (subcategory && formData.inv_gru_cod && formData.inv_gru_cod !== subcategory.inv_gru_cod) {
      const oldCategory = availableCategories.find(cat => cat.inv_gru_cod === subcategory.inv_gru_cod);
      const newCategory = availableCategories.find(cat => cat.inv_gru_cod === parseInt(formData.inv_gru_cod));

      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Cambiar categoría padre?',
        html: `
          <p class="mb-2">Estás moviendo esta subcategoría de:</p>
          <p class="font-semibold">${oldCategory?.inv_gru_nom || 'Categoría desconocida'} → ${newCategory?.inv_gru_nom || 'Categoría desconocida'}</p>
          <p class="text-sm text-gray-600 mt-2">Esta acción reorganizará la estructura de categorías.</p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f58ea3'
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    // Confirmación si se está editando el WooCommerce ID manualmente
    if (subcategory && formData.inv_sub_gru_woo_id && formData.inv_sub_gru_woo_id !== subcategory.inv_sub_gru_woo_id) {
      const result = await Swal.fire({
        icon: 'warning',
        title: '¿Cambiar ID de WooCommerce?',
        html: `
          <p class="mb-2">Estás cambiando el ID de WooCommerce de:</p>
          <p class="font-semibold">${subcategory.inv_sub_gru_woo_id || 'ninguno'} → ${formData.inv_sub_gru_woo_id}</p>
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
        inv_sub_gru_nom: formData.inv_sub_gru_nom,
        inv_sub_gru_des: formData.inv_sub_gru_des,
        inv_sub_gru_woo_id: formData.inv_sub_gru_woo_id ? parseInt(formData.inv_sub_gru_woo_id) : null,
        inv_gru_cod: parseInt(formData.inv_gru_cod)
      };

      if (subcategory) {
        // Update existing subcategory
        response = await axios.put(
          `${API_URL}/subcategorias/${subcategory.inv_sub_gru_cod}`,
          dataToSend,
          { headers: { 'x-access-token': token } }
        );
      } else {
        // Create new subcategory
        response = await axios.post(
          `${API_URL}/subcategorias`,
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
            title: subcategory ? 'Subcategoría Actualizada' : 'Subcategoría Creada',
            html: `
              <p class="mb-2">${response.data.message}</p>
              <p class="text-sm text-orange-600">⚠️ No se pudo sincronizar con WooCommerce:</p>
              <p class="text-sm text-gray-600">${wooSync.error || 'Error desconocido'}</p>
            `,
            confirmButtonColor: '#f58ea3'
          });
        } else {
          toast.success(response.data.message || (subcategory ? 'Subcategoría actualizada' : 'Subcategoría creada exitosamente'));
        }
        onSave();
      } else {
        throw new Error(response.data.message || 'Error en la operación');
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      const message = error.response?.data?.message || error.message || 'Error al guardar la subcategoría';
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

  if (!isOpen || !parentCategory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#fff5f7] rounded-lg">
              <FaLayerGroup className="w-5 h-5 text-[#f58ea3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {subcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
              </h3>
              <p className="text-xs text-gray-500">
                Categoría padre: {parentCategory.inv_gru_nom}
              </p>
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
              Nombre de la Subcategoría <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="inv_sub_gru_nom"
              value={formData.inv_sub_gru_nom}
              onChange={handleChange}
              placeholder="Ej: Labiales, Bases, Máscaras..."
              className={`w-full p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${
                errors.inv_sub_gru_nom ? 'border-red-500' : 'border-[#f5cad4]'
              }`}
              disabled={isSubmitting}
              maxLength={100}
            />
            {errors.inv_sub_gru_nom && (
              <p className="text-red-500 text-xs mt-1">{errors.inv_sub_gru_nom}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.inv_sub_gru_nom.length}/100 caracteres
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm font-medium">
              Descripción (Opcional)
            </label>
            <textarea
              name="inv_sub_gru_des"
              value={formData.inv_sub_gru_des}
              onChange={handleChange}
              placeholder="Descripción de la subcategoría..."
              rows={4}
              className={`w-full p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition resize-none ${
                errors.inv_sub_gru_des ? 'border-red-500' : 'border-[#f5cad4]'
              }`}
              disabled={isSubmitting}
              maxLength={500}
            />
            {errors.inv_sub_gru_des && (
              <p className="text-red-500 text-xs mt-1">{errors.inv_sub_gru_des}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {formData.inv_sub_gru_des.length}/500 caracteres
            </p>
          </div>

          {/* Categoría Padre - Solo visible al editar */}
          {subcategory && (
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                Categoría Padre <span className="text-red-500">*</span>
              </label>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe]">
                  <FaSpinner className="animate-spin w-4 h-4 text-[#f58ea3] mr-2" />
                  <span className="text-sm text-gray-600">Cargando categorías...</span>
                </div>
              ) : (
                <>
                  <select
                    name="inv_gru_cod"
                    value={formData.inv_gru_cod}
                    onChange={handleChange}
                    className={`w-full p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${
                      errors.inv_gru_cod ? 'border-red-500' : 'border-[#f5cad4]'
                    }`}
                    disabled={isSubmitting || isLoadingCategories}
                  >
                    <option value="">Seleccionar categoría...</option>
                    {availableCategories.map((category) => (
                      <option key={category.inv_gru_cod} value={category.inv_gru_cod}>
                        {category.inv_gru_nom}
                      </option>
                    ))}
                  </select>
                  {errors.inv_gru_cod && (
                    <p className="text-red-500 text-xs mt-1">{errors.inv_gru_cod}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.inv_gru_cod && formData.inv_gru_cod !== subcategory.inv_gru_cod
                      ? '⚠️ Cambiar categoría reorganizará la estructura'
                      : 'Selecciona la categoría a la que pertenece esta subcategoría'
                    }
                  </p>
                </>
              )}
            </div>
          )}

          {/* WooCommerce ID - Solo visible al editar */}
          {subcategory && (
            <div>
              <label className="block text-gray-700 mb-2 text-sm font-medium">
                ID de WooCommerce (Opcional)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  name="inv_sub_gru_woo_id"
                  value={formData.inv_sub_gru_woo_id}
                  onChange={handleChange}
                  placeholder="ID en WooCommerce..."
                  className={`flex-1 p-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${
                    errors.inv_sub_gru_woo_id ? 'border-red-500' : 'border-[#f5cad4]'
                  }`}
                  disabled={isSubmitting}
                  min="1"
                />
                {formData.inv_sub_gru_woo_id && (
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
              {errors.inv_sub_gru_woo_id && (
                <p className="text-red-500 text-xs mt-1">{errors.inv_sub_gru_woo_id}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {formData.inv_sub_gru_woo_id
                  ? '✓ Asociada a subcategoría WooCommerce existente'
                  : 'Dejar vacío para crear nueva subcategoría en WooCommerce al guardar'
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
                  {subcategory ? 'Actualizar' : 'Crear Subcategoría'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubcategoryModal;
