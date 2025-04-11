// src/pages/CreateProduct.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CreateProduct = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    art_cod: '',
    art_nom: '',
    categoria: '',
    subcategoria: '',
    precio_detal: '',
    precio_mayor: '',
    art_woo_id: ''
  });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Si existen errores de validación, no se permite enviar
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
    axios.post(`${API_URL}/crearArticulo`, formData)
      .then(response => {
        const data = response.data;
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Producto creado',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          });
          navigate('/products');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          });
        }
      })
      .catch(error => {
        console.error("Error al crear producto:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear el producto, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
