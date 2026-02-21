import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaSpinner, FaUpload, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../../config';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const CreateVariationModal = ({
  isOpen,
  onClose,
  parentArtSec,
  parentName,
  attributeType,
  availableOptions,
  referencePrices,
  onVariationCreated,
}) => {
  const [selectedOption, setSelectedOption] = useState('');
  const [customOption, setCustomOption] = useState('');
  const [variationName, setVariationName] = useState('');
  const [precioDetal, setPrecioDetal] = useState('');
  const [precioMayor, setPrecioMayor] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // La opción efectiva: custom si no hay opciones disponibles o si se eligió "Escribir otro..."
  const effectiveOption = availableOptions.length === 0 || selectedOption === '__custom__'
    ? customOption.trim()
    : selectedOption;

  // Pre-fill prices from parent reference
  useEffect(() => {
    if (isOpen) {
      setPrecioDetal(referencePrices?.detal || '');
      setPrecioMayor(referencePrices?.mayor || '');
      setSelectedOption('');
      setCustomOption('');
      setVariationName('');
      setImage(null);
      setImagePreview(null);
    }
  }, [isOpen, referencePrices]);

  // Auto-generate name when option is selected
  useEffect(() => {
    if (effectiveOption) {
      setVariationName(`${parentName} - ${effectiveOption}`);
    } else {
      setVariationName('');
    }
  }, [effectiveOption, parentName]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Solo se permiten archivos de imagen (JPG, JPEG, PNG, WEBP).',
          confirmButtonColor: '#f58ea3'
        });
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!effectiveOption || !precioDetal || !precioMayor) {
      Swal.fire({
        icon: 'error',
        title: 'Campos requeridos',
        text: `Ingresa el ${attributeType.toLowerCase()} y ambos precios.`,
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('art_nom', variationName);
      formData.append('precio_detal', precioDetal);
      formData.append('precio_mayor', precioMayor);
      formData.append('attributes', JSON.stringify({ [attributeType]: effectiveOption }));

      if (image) {
        formData.append('image1', image);
      }

      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.post(
        `${API_URL}/articulos/variable/${parentArtSec}/variations`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'x-access-token': token,
          },
        }
      );

      if (response.data.success) {
        const wooError = response.data.errors?.wooCommerce;
        if (wooError) {
          toast.warning('Variación creada en el sistema, pero no se pudo sincronizar con WooCommerce.');
          Swal.fire({
            icon: 'warning',
            title: 'Sincronización WooCommerce fallida',
            html: `La variación se guardó correctamente en el sistema pero no tiene ID de WooCommerce.<br><br>
              <strong>Posibles causas:</strong><br>
              • El producto padre no está convertido a tipo "variable" en WooCommerce.<br>
              • Error de conexión o credenciales con WooCommerce.<br><br>
              Revise los logs del backend o que el producto padre esté marcado como variable en WooCommerce y vuelva a intentar.`,
            confirmButtonColor: '#f58ea3'
          }).then(() => {
            onVariationCreated();
            onClose();
          });
        } else {
          toast.success('Variación creada exitosamente');
          onVariationCreated();
          onClose();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al crear la variación.',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      console.error('Error al crear variación:', error);
      const message = error.response?.data?.message || 'Error al crear la variación.';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Nueva Variación</h3>
            <p className="text-xs text-gray-500 mt-0.5">Producto: {parentName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FaTimes className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Seleccionar o escribir opción */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">
              {attributeType}
            </label>
            {availableOptions.length > 0 ? (
              <>
                <select
                  value={selectedOption}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                  disabled={isSubmitting}
                >
                  <option value="">Seleccionar {attributeType.toLowerCase()}...</option>
                  {availableOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="__custom__">Escribir otro...</option>
                </select>
                {selectedOption === '__custom__' && (
                  <input
                    type="text"
                    value={customOption}
                    onChange={(e) => setCustomOption(e.target.value)}
                    placeholder={`Ej: Rojo Pasión, Rosa Nude...`}
                    className="w-full p-3 mt-2 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                    disabled={isSubmitting}
                  />
                )}
              </>
            ) : (
              <>
                <input
                  type="text"
                  value={customOption}
                  onChange={(e) => setCustomOption(e.target.value)}
                  placeholder={`Escribir ${attributeType.toLowerCase()}...`}
                  className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Escribe el {attributeType.toLowerCase()} para la nueva variación.
                </p>
              </>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Nombre de la variación</label>
            <input
              type="text"
              value={variationName}
              onChange={(e) => setVariationName(e.target.value)}
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Precios */}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="block text-gray-700 mb-1 text-sm font-medium">Imagen (opcional)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-xl border border-[#f5cad4]"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-[#f58ea3] text-white p-1 rounded-full shadow-md hover:bg-red-500 transition"
                  disabled={isSubmitting}
                >
                  <FaTrash size="0.6em" />
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="px-4 py-2 bg-[#f7b3c2]/40 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white rounded-xl transition font-semibold text-sm flex items-center gap-2"
                  disabled={isSubmitting}
                >
                  <FaUpload className="w-3 h-3" />
                  Seleccionar imagen
                </button>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-[#f58ea3] text-[#f58ea3] rounded-xl bg-[#fffafe] hover:bg-[#f7b3c2]/40 transition font-semibold text-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:from-[#e07d92] hover:to-[#f58ea3] transition disabled:opacity-60 flex items-center gap-2 text-sm"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Variación'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVariationModal;
