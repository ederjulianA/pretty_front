// src/pages/CreateProduct.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaCloudUploadAlt, FaTrash } from 'react-icons/fa';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    art_cod: '',
    art_nom: '',
    categoria: '',
    subcategoria: '',
    precio_detal: '',
    precio_mayor: '',
    art_woo_id: '',
    imagenes: []
  });
  const [imagesPreviews, setImagesPreviews] = useState([]);
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
    if(e.target.name === 'art_cod') setErrorArtCod('');
    if(e.target.name === 'art_woo_id') setErrorArtWoo('');
  };

  // Función para validar el código único
  const validateUnique = async (field, value) => {
    try {
      const response = await axios.get(`${API_URL}/articulos/validar`, {
        params: { [field]: value }
      });
      if(response.data.success && response.data.exists) {
        return true; // Existe
      }
    } catch (error) {
      console.error("Error validando", field, error);
    }
    return false;
  };

  const handleBlurArtCod = async () => {
    if(formData.art_cod) {
      const exists = await validateUnique('art_cod', formData.art_cod);
      if(exists) {
        setErrorArtCod('El código ya existe.');
      }
    }
  };

  const handleBlurArtWoo = async () => {
    if(formData.art_woo_id) {
      const exists = await validateUnique('art_woo_id', formData.art_woo_id);
      if(exists) {
        setErrorArtWoo('El código de WooCommerce ya existe.');
      }
    }
  };

  // Añadir después de handleBlurArtWoo
const handleImageChange = (e) => {
  const files = Array.from(e.target.files);
  
  const validFiles = files.filter(file => {
    const isValid = file.type.startsWith('image/');
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB máximo
    
    if (!isValid) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo no válido',
        text: `${file.name} no es una imagen válida.`,
        confirmButtonColor: '#f58ea3'
      });
    }
    if (!isValidSize) {
      Swal.fire({
        icon: 'error',
        title: 'Archivo muy grande',
        text: `${file.name} excede el tamaño máximo de 5MB.`,
        confirmButtonColor: '#f58ea3'
      });
    }
    
    return isValid && isValidSize;
  });

  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagesPreviews(prev => [...prev, { file, preview: reader.result }]);
    };
    reader.readAsDataURL(file);
  });

  setFormData(prev => ({
    ...prev,
    imagenes: [...prev.imagenes, ...validFiles]
  }));
};

const handleRemoveImage = (index) => {
  setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  setFormData(prev => ({
    ...prev,
    imagenes: prev.imagenes.filter((_, i) => i !== index)
  }));
};
  

const handleSubmit = async (e) => {
  e.preventDefault();
  if(errorArtCod || errorArtWoo) {
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
    // Primero, crear el objeto de datos básicos
    const productData = {
      art_cod: formData.art_cod,
      art_nom: formData.art_nom,
      categoria: formData.categoria,
      subcategoria: formData.subcategoria,
      art_woo_id: formData.art_woo_id,
      precio_detal: formData.precio_detal,
      precio_mayor: formData.precio_mayor,
      imagenes: [] // Inicialmente vacío
    };

    // Si hay imágenes, convertirlas a base64
    if (formData.imagenes.length > 0) {
      const formDataImages = new FormData();
      
      if (formData.imagenes.length === 1) {
        // Si hay una sola imagen
        formDataImages.append('image', formData.imagenes[0]);
        const uploadResponse = await axios.post(`${API_URL}/upload-single`, formDataImages, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        productData.imagenes = [{
          nombre: formData.imagenes[0].name,
          tipo: formData.imagenes[0].type,
          fullUrl: uploadResponse.data.image.fullUrl
        }];
      } else {
        // Si hay múltiples imágenes
        formData.imagenes.forEach(file => {
          formDataImages.append('image', file);
        });

        const uploadResponse = await axios.post(`${API_URL}/upload-multiple`, formDataImages, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        productData.imagenes = uploadResponse.data.images.map((image, index) => ({
          nombre: formData.imagenes[index].name,
          tipo: formData.imagenes[index].type,
          fullUrl: image.fullUrl
        }));
      }
    }

    // Enviar los datos como JSON
    const response = await axios.post(`${API_URL}/crearArticulo`, productData, {
      headers: {
        'Content-Type': 'application/json'
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
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("Error completo:", error);
    console.error("Respuesta del servidor:", error.response?.data);
    
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.response?.data?.error || error.message || 'Error al crear el producto',
      confirmButtonColor: '#f58ea3'
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Crear Nuevo Producto</h2>
        <form onSubmit={handleSubmit}>
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
              className="w-full p-2 border rounded"
              required
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
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {/* Categoría */}
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Categoría</label>
            {isLoadingCategories ? (
              <p>Cargando categorías...</p>
            ) : (
              <select 
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
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
              <p>Cargando subcategorías...</p>
            ) : (
              <select 
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
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
                className="w-full p-2 border rounded"
                required
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
                className="w-full p-2 border rounded"
                required
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
              placeholder="Ingrese código WooCommerce"
              className="w-full p-2 border rounded"
              required
            />
            {errorArtWoo && <p className="text-red-500 text-xs mt-1">{errorArtWoo}</p>}
          </div>

            {/* Nuevo campo para imágenes */}
<div className="mb-6">
  <label className="block text-gray-700 mb-2">Imágenes del Producto</label>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={handleImageChange}
      className="hidden"
      id="image-upload"
    />
    <label
      htmlFor="image-upload"
      className="flex flex-col items-center justify-center cursor-pointer"
    >
      <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
      <span className="text-gray-500">Click para seleccionar imágenes</span>
      <span className="text-xs text-gray-400 mt-1">
        Máximo 5MB por imagen. Formatos: JPG, PNG, GIF
      </span>
    </label>
  </div>

  {/* Previsualización de imágenes */}
  {imagesPreviews.length > 0 && (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
      {imagesPreviews.map((image, index) => (
        <div key={index} className="relative group">
          <img
            src={image.preview}
            alt={`Preview ${index + 1}`}
            className="w-full h-32 object-cover rounded"
          />
          <button
            type="button"
            onClick={() => handleRemoveImage(index)}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FaTrash size="0.875rem" />
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
              className="px-4 py-2 border rounded hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || errorArtCod || errorArtWoo}
              className="px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#a5762f] transition"
            >
              {isSubmitting ? "Creando..." : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProduct;
