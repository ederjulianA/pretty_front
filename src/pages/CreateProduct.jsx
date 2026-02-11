// src/pages/CreateProduct.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaUpload, FaTrash, FaSpinner, FaSyncAlt } from 'react-icons/fa';
import ProductTypeSelector from '../components/product/ProductTypeSelector';
import AttributeManager from '../components/product/AttributeManager';
import BundleManager from '../components/product/BundleManager';

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

  // Estados para componentes (producto bundle)
  const [bundleComponents, setBundleComponents] = useState([]);

  // Estados para los errores de validación
  const [errorArtCod, setErrorArtCod] = useState('');
  const [errorArtWoo, setErrorArtWoo] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Cargar listado de categorías
  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const token = localStorage.getItem('pedidos_pretty_token');
        const response = await axios.get(`${API_URL}/categorias?limit=1000`, {
          headers: { 'x-access-token': token }
        });

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
          const token = localStorage.getItem('pedidos_pretty_token');
          const response = await axios.get(`${API_URL}/subcategorias`, {
            params: { inv_gru_cod: formData.categoria, limit: 1000 },
            headers: { 'x-access-token': token }
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

  // Submit para producto BUNDLE
  const handleSubmitBundle = async () => {
    // Validar que hay componentes
    if (bundleComponents.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'Debes agregar al menos un componente al bundle.',
        confirmButtonColor: '#f58ea3'
      });
      return null;
    }

    // Validar precios obligatorios para bundles
    if (!formData.precio_detal || !formData.precio_mayor) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'Los precios son obligatorios para bundles.',
        confirmButtonColor: '#f58ea3'
      });
      return null;
    }

    // Usar FormData para soportar imágenes
    const formDataToSend = new FormData();
    formDataToSend.append('art_nom', formData.art_nom);
    formDataToSend.append('art_cod', formData.art_cod);
    formDataToSend.append('inv_sub_gru_cod', formData.subcategoria);
    formDataToSend.append('precio_detal', formData.precio_detal);
    formDataToSend.append('precio_mayor', formData.precio_mayor);

    // Agregar componentes como JSON string
    formDataToSend.append('componentes', JSON.stringify(
      bundleComponents.map(c => ({
        art_sec: c.art_sec,
        cantidad: c.cantidad
      }))
    ));

    // Agregar imágenes
    images.forEach((image, index) => {
      formDataToSend.append(`image${index + 1}`, image);
    });

    const token = localStorage.getItem('pedidos_pretty_token');
    const response = await axios.post(`${API_URL}/bundles`, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-access-token': token
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
      } else if (productType === 'bundle') {
        response = await handleSubmitBundle();
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
    <div className="min-h-screen bg-[#edf3f9] pb-24">
      <div className="w-full max-w-4xl mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-800 truncate">Crear Nuevo Producto</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {productType === 'simple' && 'Producto Simple'}
              {productType === 'variable' && 'Producto Variable con Atributos'}
              {productType === 'bundle' && 'Bundle/Combo de Productos'}
            </p>
          </div>
          <div className="flex-shrink-0">
            <ProductTypeSelector
              productType={productType}
              onTypeChange={setProductType}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="relative">
        {isSubmitting && (
          <div className="fixed inset-0 bg-white/90 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
            <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
            <p className="text-gray-600 font-medium">Creando producto...</p>
            <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className={`space-y-5 ${isSubmitting ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Información Básica */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Información Básica
            </h3>
            <div className="space-y-5">
              {/* Código */}
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-base">Código del Producto</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="art_cod"
                    value={formData.art_cod}
                    onChange={handleChange}
                    onBlur={handleBlurArtCod}
                    placeholder="Ingrese código único"
                    className={`w-full px-4 py-3.5 text-base border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${errorArtCod ? 'border-red-400 focus:border-red-400 bg-red-50/30' : 'border-[#f5cad4]/60'}`}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleRefreshCodigo}
                    className="p-3.5 rounded-xl bg-[#f7b3c2]/30 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Obtener código sugerido"
                    disabled={isLoadingCodigo || isSubmitting}
                  >
                    {isLoadingCodigo ? <FaSpinner className="animate-spin" /> : <FaSyncAlt />}
                  </button>
                </div>
                {errorArtCod && (
                  <div className="mt-2 flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorArtCod}
                  </div>
                )}
              </div>
              {/* Nombre */}
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-base">Nombre del Producto</label>
                <input
                  type="text"
                  name="art_nom"
                  value={formData.art_nom}
                  onChange={handleChange}
                  placeholder="Ingrese el nombre completo"
                  className="w-full px-4 py-3.5 text-base border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Clasificación */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Clasificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Categoría */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Categoría</label>
                {isLoadingCategories ? (
                  <div className="flex items-center gap-2 text-[#f58ea3] py-3">
                    <FaSpinner className="animate-spin" />
                    <span>Cargando categorías...</span>
                  </div>
                ) : (
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
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
                  <div className="flex items-center gap-2 text-[#f58ea3] py-3">
                    <FaSpinner className="animate-spin" />
                    <span>Cargando subcategorías...</span>
                  </div>
                ) : (
                  <select
                    name="subcategoria"
                    value={formData.subcategoria}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
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
            </div>
          </div>

          {/* Sección de Atributos (solo para producto variable) */}
          {isVariable && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-purple-200/40">
                Atributos del Producto Variable
              </h3>
              <AttributeManager
                attributeType={attributeType}
                onAttributeTypeChange={setAttributeType}
                options={attributeOptions}
                onOptionsChange={setAttributeOptions}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Sección de Componentes (solo para producto bundle) */}
          {productType === 'bundle' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-200/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-pink-200/40">
                Componentes del Bundle
              </h3>
              <BundleManager
                components={bundleComponents}
                onComponentsChange={setBundleComponents}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Precios */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Precios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  {isVariable ? 'Precio Detal (Referencia)' : 'Precio Detal'}
                  {productType === 'bundle' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  name="precio_detal"
                  value={formData.precio_detal}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
                  required={productType === 'simple' || productType === 'bundle'}
                  disabled={isSubmitting}
                />
                {isVariable && (
                  <p className="text-xs text-gray-500 mt-1.5">Opcional. Se usará como referencia al crear variaciones.</p>
                )}
                {productType === 'bundle' && (
                  <p className="text-xs text-gray-500 mt-1.5">Precio independiente del bundle (puede ser menor que la suma de componentes).</p>
                )}
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  {isVariable ? 'Precio Mayor (Referencia)' : 'Precio Mayor'}
                  {productType === 'bundle' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  type="number"
                  name="precio_mayor"
                  value={formData.precio_mayor}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
                  required={productType === 'simple' || productType === 'bundle'}
                  disabled={isSubmitting}
                />
                {isVariable && (
                  <p className="text-xs text-gray-500 mt-1.5">Opcional. Se usará como referencia al crear variaciones.</p>
                )}
                {productType === 'bundle' && (
                  <p className="text-xs text-gray-500 mt-1.5">Precio mayorista del bundle completo.</p>
                )}
              </div>
            </div>
          </div>
          {/* Código WooCommerce - solo para producto simple */}
          {productType === 'simple' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
                Integración WooCommerce
              </h3>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Código WooCommerce</label>
                <input
                  type="text"
                  name="art_woo_id"
                  value={formData.art_woo_id}
                  onChange={handleChange}
                  onBlur={handleBlurArtWoo}
                  placeholder="Ingrese código WooCommerce (opcional)"
                  className={`w-full px-4 py-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${errorArtWoo ? 'border-red-400 focus:border-red-400 bg-red-50/30' : 'border-[#f5cad4]/60'}`}
                  disabled={isSubmitting}
                />
                {errorArtWoo && (
                  <div className="mt-2 flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorArtWoo}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Imágenes */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Galería de Imágenes
            </h3>
            <div className="border-2 border-dashed border-[#f5cad4]/60 rounded-xl p-6 text-center bg-[#fffafe]">
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
                className="bg-[#f7b3c2]/30 hover:bg-[#f58ea3] text-[#f58ea3] hover:text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 mx-auto font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                <FaUpload />
                Seleccionar Imágenes
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Formatos permitidos: JPG, JPEG, PNG, WEBP. Máximo 4 imágenes.
              </p>
            </div>
            {/* Previsualización de imágenes */}
            {previewUrls.length > 0 && (
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Previsualización ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border border-[#f5cad4]/60 bg-[#fffafe] shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-[#f58ea3] text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      title="Eliminar imagen"
                      disabled={isSubmitting}
                    >
                      <FaTrash size="0.75em" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info para producto variable */}
          {isVariable && (
            <div className="bg-purple-50/60 border border-purple-200/60 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-purple-800">
                <strong>💡 Nota:</strong> Después de crear el producto variable, serás redirigido a la pantalla de edición donde podrás crear las variaciones individuales con sus precios y stock.
              </p>
            </div>
          )}

          {/* Info para producto bundle */}
          {productType === 'bundle' && bundleComponents.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-sm text-amber-800">
                <strong>💡 Recordatorio:</strong> Este bundle se creará con los {bundleComponents.length} componentes seleccionados.
                El stock del bundle es independiente y debe gestionarse manualmente. Al vender un bundle, se descontará automáticamente el stock de cada componente.
              </p>
            </div>
          )}
        </form>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f5cad4]/40 p-4 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            {errorArtCod || errorArtWoo ? (
              <span className="text-red-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Corrige los errores antes de continuar
              </span>
            ) : (
              <span>
                {productType === 'simple' && 'Producto Simple'}
                {productType === 'variable' && 'Producto Variable'}
                {productType === 'bundle' && `Bundle con ${bundleComponents.length} componentes`}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-5 py-2.5 border border-[#f5cad4]/80 text-gray-700 rounded-xl bg-white hover:bg-[#f7b3c2]/20 transition font-medium shadow-sm"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('form').requestSubmit();
              }}
              disabled={isSubmitting || errorArtCod || (productType === 'simple' && errorArtWoo)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:shadow-lg hover:from-[#e87d92] hover:to-[#f6a2b1] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  {productType === 'variable' ? 'Crear Producto Variable' :
                  productType === 'bundle' ? 'Crear Bundle/Combo' :
                  'Crear Producto'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProduct;
