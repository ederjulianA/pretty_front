// src/pages/CreateProduct.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUpload, FaTrash, FaSpinner } from 'react-icons/fa';

const CreateProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    art_cod: '',
    art_nom: '',
    categoria: '',
    subcategoria: '',
    precio_detal: '',
    precio_mayor: '',
    art_woo_id: ''
  });
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para los errores de validación
  const [errorArtCod, setErrorArtCod] = useState('');
  const [errorArtWoo, setErrorArtWoo] = useState('');

  // Cargar listado de categorías
  useEffect(() => {
    setIsLoadingCategories(true);
    axios.get(`${API_URL}/categorias`)
      .then(response => {
        const data = response.data;
        if (data.success && data.result && data.result.data) {
          setCategories(data.result.data);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las categorías.',
            confirmButtonColor: '#f58ea3'
          });
        }
      })
      .catch(error => {
        console.error("Error al obtener categorías:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las categorías.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Cargar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    if (formData.categoria) {
      setIsLoadingSubcategories(true);
      axios.get(`${API_URL}/subcategorias`, { params: { inv_gru_cod: formData.categoria } })
        .then(response => {
          const data = response.data;
          if (data.success && data.subcategorias) {
            setSubcategories(data.subcategorias);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar las subcategorías.',
              confirmButtonColor: '#f58ea3'
            });
          }
        })
        .catch(error => {
          console.error("Error al obtener subcategorías:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las subcategorías.',
            confirmButtonColor: '#f58ea3'
          });
        })
        .finally(() => setIsLoadingSubcategories(false));
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoria: '' }));
    }
  }, [formData.categoria]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Reiniciamos los mensajes de error si el usuario vuelve a editar
    if (e.target.name === 'art_cod') setErrorArtCod('');
    if (e.target.name === 'art_woo_id') setErrorArtWoo('');
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validar número máximo de imágenes
    if (images.length + files.length > 4) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Solo puedes subir hasta 4 imágenes.',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Solo se permiten archivos de imagen (JPG, JPEG, PNG, WEBP).',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    // Crear URLs de previsualización
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...files]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Función para validar el código único
  const validateUnique = async (field, value) => {
    try {
      const response = await axios.get(`${API_URL}/articulos/validar`, {
        params: { [field]: value }
      });
      if (response.data.success && response.data.exists) {
        return true; // Existe
      }
    } catch (error) {
      console.error("Error validando", field, error);
    }
    return false;
  };

  const handleBlurArtCod = async () => {
    if (formData.art_cod) {
      const exists = await validateUnique('art_cod', formData.art_cod);
      if (exists) {
        setErrorArtCod('El código ya existe.');
      }
    }
  };

  const handleBlurArtWoo = async () => {
    if (formData.art_woo_id) {
      const exists = await validateUnique('art_woo_id', formData.art_woo_id);
      if (exists) {
        setErrorArtWoo('El código de WooCommerce ya existe.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si existen errores de validación, no se permite enviar
    if (errorArtCod || errorArtWoo) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'Por favor corrija los errores en el formulario.',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Agregar campos del formulario
      Object.entries(formData).forEach(([key, value]) => {
        if (value) { // Solo agregar campos que tengan valor
          formDataToSend.append(key, value);
        }
      });

      // Agregar imágenes con los nombres correctos que espera el backend
      images.forEach((image, index) => {
        formDataToSend.append(`image${index + 1}`, image);
      });

      const response = await axios.post(`${API_URL}/crearArticulo`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Producto creado',
          text: response.data.message,
          confirmButtonColor: '#f58ea3'
        });
        navigate('/products');
      } else {
        throw new Error(response.data.message || 'Error al crear el producto');
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Error al crear el producto, por favor intente nuevamente.',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6 relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-lg z-50">
            <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
            <p className="text-gray-600 font-medium">Creando producto...</p>
            <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className={isSubmitting ? 'opacity-50 pointer-events-none' : ''}>
          {/* Código */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Código</label>
            <input
              type="text"
              name="art_cod"
              value={formData.art_cod}
              onChange={handleChange}
              onBlur={handleBlurArtCod}
              placeholder="Ingrese código"
              className="w-full p-2 border rounded disabled:bg-gray-100"
              required
              disabled={isSubmitting}
            />
            {errorArtCod && <p className="text-red-500 text-xs mt-1">{errorArtCod}</p>}
          </div>
          {/* Nombre */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              name="art_nom"
              value={formData.art_nom}
              onChange={handleChange}
              placeholder="Ingrese nombre"
              className="w-full p-2 border rounded disabled:bg-gray-100"
              required
              disabled={isSubmitting}
            />
          </div>
          {/* Categoría */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Categoría</label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span>Cargando categorías...</span>
              </div>
            ) : (
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border rounded disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccione categoría</option>
                {categories.map(cat => (
                  <option key={cat.inv_gru_cod} value={cat.inv_gru_cod}>
                    {cat.inv_gru_nom}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Subcategoría */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Subcategoría</label>
            {isLoadingSubcategories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <FaSpinner className="animate-spin" />
                <span>Cargando subcategorías...</span>
              </div>
            ) : (
              <select
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleChange}
                className="w-full p-2 border rounded disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              >
                <option value="">Seleccione subcategoría</option>
                {subcategories.map(sub => (
                  <option key={sub.inv_sub_gru_cod} value={sub.inv_sub_gru_cod}>
                    {sub.inv_sub_gru_nom}
                  </option>
                ))}
              </select>
            )}
          </div>
          {/* Precios */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Precio Detal</label>
              <input
                type="number"
                name="precio_detal"
                value={formData.precio_detal}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-2 border rounded disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Precio Mayor</label>
              <input
                type="number"
                name="precio_mayor"
                value={formData.precio_mayor}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-2 border rounded disabled:bg-gray-100"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          {/* Código WooCommerce */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Código WooCommerce</label>
            <input
              type="text"
              name="art_woo_id"
              value={formData.art_woo_id}
              onChange={handleChange}
              onBlur={handleBlurArtWoo}
              placeholder="Ingrese código WooCommerce (opcional)"
              className="w-full p-2 border rounded disabled:bg-gray-100"
              disabled={isSubmitting}
            />
            {errorArtWoo && <p className="text-red-500 text-xs mt-1">{errorArtWoo}</p>}
          </div>
          {/* Imágenes */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Imágenes (Máximo 4)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <FaUpload />
                Seleccionar Imágenes
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Formatos permitidos: JPG, JPEG, PNG, WEBP. Máximo 4 imágenes.
              </p>
            </div>
            {/* Previsualización de imágenes */}
            {previewUrls.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Previsualización ${index + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar imagen"
                      disabled={isSubmitting}
                    >
                      <FaTrash size="0.8em" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 border rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || errorArtCod || errorArtWoo}
              className="px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#a5762f] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
