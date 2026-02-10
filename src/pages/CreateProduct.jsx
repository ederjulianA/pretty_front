// src/pages/CreateProduct.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUpload, FaTrash, FaSpinner, FaSyncAlt } from 'react-icons/fa';
import ProductTypeSelector from '../components/product/ProductTypeSelector';
import AttributeManager from '../components/product/AttributeManager';

const CreateProduct = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [productType, setProductType] = useState('simple');
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
  const [isLoadingCodigo, setIsLoadingCodigo] = useState(false);

  // Estados para atributos (producto variable)
  const [attributeType, setAttributeType] = useState('Tono');
  const [attributeOptions, setAttributeOptions] = useState([]);

  // Estados para los errores de validación
  const [errorArtCod, setErrorArtCod] = useState('');
  const [errorArtWoo, setErrorArtWoo] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Cargar listado de categorías
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await axios.get(`${API_URL}/categorias?limit=1000`);

        if (response.data.success && response.data.data) {
          setCategories(response.data.data);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las categorías.',
            confirmButtonColor: '#f58ea3'
          });
        }
      } catch (error) {
        console.error("Error al obtener categorías:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las categorías.',
          confirmButtonColor: '#f58ea3'
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Cargar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (formData.categoria) {
        setIsLoadingSubcategories(true);
        try {
          const response = await axios.get(`${API_URL}/subcategorias`, {
            params: { inv_gru_cod: formData.categoria, limit: 1000 }
          });

          if (response.data.success && response.data.data) {
            setSubcategories(response.data.data);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar las subcategorías.',
              confirmButtonColor: '#f58ea3'
            });
          }
        } catch (error) {
          console.error("Error al obtener subcategorías:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las subcategorías.',
            confirmButtonColor: '#f58ea3'
          });
        } finally {
          setIsLoadingSubcategories(false);
        }
      } else {
        setSubcategories([]);
        setFormData(prev => ({ ...prev, subcategoria: '' }));
      }
    };

    fetchSubcategories();
  }, [formData.categoria]);

  // Obtener código sugerido al montar
  useEffect(() => {
    const fetchCodigoSugerido = async () => {
      setIsLoadingCodigo(true);
      try {
        const token = localStorage.getItem('pedidos_pretty_token');
        const response = await axios.get(`${API_URL}/articulos/next-codigo/generate`, {
          headers: token ? { 'x-access-token': token } : {}
        });
        if (response.data && response.data.art_cod && !formData.art_cod) {
          setFormData(prev => ({ ...prev, art_cod: response.data.art_cod }));
        }
      } catch (error) {
        console.error('Error obteniendo código sugerido:', error);
      } finally {
        setIsLoadingCodigo(false);
      }
    };
    fetchCodigoSugerido();
    // eslint-disable-next-line
  }, []);

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

  // Función para refrescar el código sugerido
  const handleRefreshCodigo = async () => {
    setIsLoadingCodigo(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.get(`${API_URL}/articulos/next-codigo/generate`, {
        headers: token ? { 'x-access-token': token } : {}
      });
      if (response.data && response.data.art_cod) {
        setFormData(prev => ({ ...prev, art_cod: response.data.art_cod }));
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo obtener un código sugerido',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoadingCodigo(false);
    }
  };

  // Submit para producto SIMPLE (lógica original)
  const handleSubmitSimple = async () => {
    const formDataToSend = new FormData();

    // Agregar campos del formulario
    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        formDataToSend.append(key, value);
      }
    });

    // Agregar imágenes
    images.forEach((image, index) => {
      formDataToSend.append(`image${index + 1}`, image);
    });

    const response = await axios.post(`${API_URL}/crearArticulo`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response;
  };

  // Submit para producto VARIABLE
  const handleSubmitVariable = async () => {
    // Validar que hay opciones de atributo
    if (attributeOptions.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: `Debes agregar al menos una opción de ${attributeType.toLowerCase()}.`,
        confirmButtonColor: '#f58ea3'
      });
      return null;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('art_nom', formData.art_nom);
    formDataToSend.append('art_cod', formData.art_cod);
    formDataToSend.append('subcategoria', formData.subcategoria);

    if (formData.categoria) formDataToSend.append('categoria', formData.categoria);
    if (formData.precio_detal) formDataToSend.append('precio_detal_referencia', formData.precio_detal);
    if (formData.precio_mayor) formDataToSend.append('precio_mayor_referencia', formData.precio_mayor);

    // Atributos como JSON
    const attributes = [{ name: attributeType, options: attributeOptions }];
    formDataToSend.append('attributes', JSON.stringify(attributes));

    // Imágenes
    images.forEach((image, index) => {
      formDataToSend.append(`image${index + 1}`, image);
    });

    const token = localStorage.getItem('pedidos_pretty_token');
    const response = await axios.post(`${API_URL}/articulos/variable`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-access-token': token,
      }
    });

    return response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si existen errores de validación, no se permite enviar
    if (errorArtCod || errorArtWoo) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        html: `
          <div class="text-left">
            <p class="mb-2">Por favor corrija los siguientes errores:</p>
            ${errorArtCod ? `<p class="text-red-600">• ${errorArtCod}</p>` : ''}
            ${errorArtWoo ? `<p class="text-red-600">• ${errorArtWoo}</p>` : ''}
          </div>
        `,
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let response;

      if (productType === 'variable') {
        response = await handleSubmitVariable();
        if (!response) {
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await handleSubmitSimple();
      }

      console.log('Respuesta del servidor:', response.data);

      if (response.data.success) {
        if (!response.data.errors || Object.keys(response.data.errors).length === 0) {
          Swal.fire({
            icon: 'success',
            title: 'Producto creado',
            text: response.data.message || 'Producto creado exitosamente.',
            confirmButtonColor: '#f58ea3'
          }).then(() => {
            if (productType === 'variable' && response.data.data?.art_sec) {
              navigate(`/products/edit/${response.data.data.art_sec}`);
            } else {
              navigate('/products');
            }
          });
        } else {
          // Producto creado con advertencias
          let errorMessage = '<div class="text-left">';
          errorMessage += `<p class="mb-4 text-lg">${response.data.message}</p>`;
          errorMessage += '<div class="space-y-4">';

          Object.entries(response.data.errors).forEach(([key, errorData]) => {
            const errorType = {
              cloudinary: { title: 'Error en Cloudinary', color: 'red' },
              wooCommerce: { title: 'Error en WooCommerce', color: 'orange' },
              database: { title: 'Error en Base de Datos', color: 'red' }
            }[key] || { title: key, color: 'red' };

            const error = typeof errorData === 'string' ? { message: errorData } : errorData;

            errorMessage += `
              <div class="bg-${errorType.color}-50 p-4 rounded-lg border border-${errorType.color}-200">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-${errorType.color}-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-${errorType.color}-800">${errorType.title}</h3>
                    <div class="mt-2">
                      ${error.message ? `
                        <p class="text-sm text-${errorType.color}-700">
                          ${error.message}
                        </p>
                      ` : ''}

                      ${error.details ? `
                        <p class="text-sm text-${errorType.color}-600 mt-1">
                          ${error.details}
                        </p>
                      ` : ''}

                      <div class="mt-2 p-2 bg-${errorType.color}-100 rounded">
                        <div class="text-xs font-mono">
                          ${Object.entries(error)
                .filter(([k]) => !['message', 'details'].includes(k))
                .map(([k, v]) => `
                              <div class="grid grid-cols-3 gap-2 mb-1">
                                <span class="text-${errorType.color}-800 font-medium">${k}:</span>
                                <span class="text-${errorType.color}-900 col-span-2 break-all">
                                  ${typeof v === 'object' ? JSON.stringify(v) : v}
                                </span>
                              </div>
                            `).join('')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          });

          errorMessage += '</div></div>';

          Swal.fire({
            icon: 'warning',
            title: 'Producto creado con advertencias',
            html: errorMessage,
            width: '600px',
            confirmButtonColor: '#f58ea3',
            confirmButtonText: 'Entendido',
            showClass: {
              popup: 'animate__animated animate__fadeInDown'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp'
            }
          }).then((result) => {
            if (result.isConfirmed) {
              if (productType === 'variable' && response.data.data?.art_sec) {
                navigate(`/products/edit/${response.data.data.art_sec}`);
              } else {
                navigate('/products');
              }
            }
          });
        }
      } else {
        // Error en la creación
        let errorMessage = '<div class="text-left">';
        errorMessage += `<p class="mb-4 text-lg font-medium">${response.data.message || 'Error al crear el producto'}</p>`;
        errorMessage += '<div class="space-y-4">';

        if (response.data.errors) {
          Object.entries(response.data.errors).forEach(([key, error]) => {
            const errorData = typeof error === 'string' ? { message: error } : error;

            errorMessage += `
              <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <div class="flex items-start">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-3 flex-1">
                    <h3 class="text-sm font-medium text-red-800">${key}</h3>
                    <div class="mt-2">
                      ${errorData.message ? `
                        <p class="text-sm text-red-700">${errorData.message}</p>
                      ` : ''}

                      <div class="mt-2 p-2 bg-red-100 rounded">
                        <div class="text-xs font-mono">
                          ${Object.entries(errorData)
                .filter(([k]) => k !== 'message')
                .map(([k, v]) => `
                              <div class="grid grid-cols-3 gap-2 mb-1">
                                <span class="text-red-800 font-medium">${k}:</span>
                                <span class="text-red-900 col-span-2 break-all">
                                  ${typeof v === 'object' ? JSON.stringify(v) : v}
                                </span>
                              </div>
                            `).join('')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `;
          });
        }

        errorMessage += '</div></div>';

        Swal.fire({
          icon: 'error',
          title: 'Error al crear el producto',
          html: errorMessage,
          width: '600px',
          confirmButtonColor: '#f58ea3',
          confirmButtonText: 'Entendido',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          }
        });
      }
    } catch (error) {
      console.error("Error al crear producto:", error);
      console.error("Detalles del error:", error.response?.data);

      let errorMessage = '<div class="text-left">';
      errorMessage += `<p class="mb-4 text-lg font-medium">Error al crear el producto:</p>`;

      const mainError = error.response?.data?.message || error.message || 'Ha ocurrido un error inesperado.';
      errorMessage += `
        <div class="bg-red-50 p-4 rounded-lg border border-red-200">
          <p class="text-sm text-red-700">${mainError}</p>

          ${error.response?.data?.errors ? `
            <div class="mt-2 p-2 bg-red-100 rounded text-xs font-mono">
              ${Object.entries(error.response.data.errors)
            .map(([key, value]) => `
                  <div class="grid grid-cols-3 gap-2 mb-1">
                    <span class="text-red-800 font-medium">${key}:</span>
                    <span class="text-red-900 col-span-2 break-all">
                      ${typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                  </div>
                `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      errorMessage += '</div>';

      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: errorMessage,
        width: '600px',
        confirmButtonColor: '#f58ea3',
        confirmButtonText: 'Entendido',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
          popup: 'animate__animated animate__fadeOutUp'
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVariable = productType === 'variable';

  return (
    <div className="min-h-screen bg-[#edf3f9] p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto bg-white/80 shadow-xl rounded-2xl p-6 sm:p-10 border border-[#f5cad4] backdrop-blur-md relative">
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-2xl z-50">
            <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
            <p className="text-gray-600 font-medium">Creando producto...</p>
            <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
          </div>
        )}
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800 tracking-tight">Crear Nuevo Producto</h2>
        <form onSubmit={handleSubmit} className={`space-y-6 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Selector de Tipo de Producto */}
          <ProductTypeSelector
            productType={productType}
            onTypeChange={setProductType}
            disabled={isSubmitting}
          />

          {/* Código */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Código</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="art_cod"
                value={formData.art_cod}
                onChange={handleChange}
                onBlur={handleBlurArtCod}
                placeholder="Ingrese código"
                className={`w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${errorArtCod ? 'border-red-500 focus:border-red-500' : ''}`}
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={handleRefreshCodigo}
                className="p-3 rounded-xl bg-[#f7b3c2]/40 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Obtener código sugerido"
                disabled={isLoadingCodigo || isSubmitting}
              >
                {isLoadingCodigo ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
              </button>
            </div>
            {errorArtCod && (
              <div className="mt-1 flex items-center text-[#f58ea3] text-xs">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errorArtCod}
              </div>
            )}
          </div>
          {/* Nombre */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Nombre</label>
            <input
              type="text"
              name="art_nom"
              value={formData.art_nom}
              onChange={handleChange}
              placeholder="Ingrese nombre"
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
              disabled={isSubmitting}
            />
          </div>
          {/* Categoría */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Categoría</label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2 text-[#f58ea3]">
                <FaSpinner className="animate-spin" />
                <span>Cargando categorías...</span>
              </div>
            ) : (
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
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
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Subcategoría</label>
            {isLoadingSubcategories ? (
              <div className="flex items-center gap-2 text-[#f58ea3]">
                <FaSpinner className="animate-spin" />
                <span>Cargando subcategorías...</span>
              </div>
            ) : (
              <select
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleChange}
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
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

          {/* Sección de Atributos (solo para producto variable) */}
          {isVariable && (
            <AttributeManager
              attributeType={attributeType}
              onAttributeTypeChange={setAttributeType}
              options={attributeOptions}
              onOptionsChange={setAttributeOptions}
              disabled={isSubmitting}
            />
          )}

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                {isVariable ? 'Precio Detal (Referencia)' : 'Precio Detal'}
              </label>
              <input
                type="number"
                name="precio_detal"
                value={formData.precio_detal}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                required={!isVariable}
                disabled={isSubmitting}
              />
              {isVariable && (
                <p className="text-xs text-gray-400 mt-1">Opcional. Se usará como referencia al crear variaciones.</p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                {isVariable ? 'Precio Mayor (Referencia)' : 'Precio Mayor'}
              </label>
              <input
                type="number"
                name="precio_mayor"
                value={formData.precio_mayor}
                onChange={handleChange}
                placeholder="0"
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
                required={!isVariable}
                disabled={isSubmitting}
              />
              {isVariable && (
                <p className="text-xs text-gray-400 mt-1">Opcional. Se usará como referencia al crear variaciones.</p>
              )}
            </div>
          </div>
          {/* Código WooCommerce - solo para producto simple */}
          {!isVariable && (
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Código WooCommerce</label>
              <input
                type="text"
                name="art_woo_id"
                value={formData.art_woo_id}
                onChange={handleChange}
                onBlur={handleBlurArtWoo}
                placeholder="Ingrese código WooCommerce (opcional)"
                className={`w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition ${errorArtWoo ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isSubmitting}
              />
              {errorArtWoo && (
                <div className="mt-1 flex items-center text-[#f58ea3] text-xs">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errorArtWoo}
                </div>
              )}
            </div>
          )}
          {/* Imágenes */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Imágenes (Máximo 4)</label>
            <div className="border-2 border-dashed border-[#f5cad4] rounded-xl p-4 text-center bg-[#fffafe]">
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
                className="bg-[#f7b3c2]/40 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 mx-auto font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full h-32 object-cover rounded-xl border border-[#f5cad4] bg-[#fffafe] shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-[#f58ea3] text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
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

          {/* Info para producto variable */}
          {isVariable && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Después de crear el producto variable, serás redirigido a la pantalla de edición donde podrás crear las variaciones individuales con sus precios y stock.
              </p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-2 border border-[#f58ea3] text-[#f58ea3] rounded-xl bg-[#fffafe] hover:bg-[#f7b3c2]/40 hover:text-[#a5762f] transition font-semibold shadow-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || errorArtCod || (productType === 'simple' && errorArtWoo)}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:from-[#a5762f] hover:to-[#f7b3c2] transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                isVariable ? 'Crear Producto Variable' : 'Crear Producto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
