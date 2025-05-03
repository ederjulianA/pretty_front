// src/pages/EditProduct.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const EditProduct = () => {
  const { id } = useParams(); // id del producto (usamos art_sec como id)
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    art_cod: '',
    art_nom: '',
    categoria: '',
    subcategoria: '',
    precio_detal: '',
    precio_mayor: '',
    art_woo_id: '',
    actualiza_fecha: 'N'
  });
  
  // [NUEVO] Guardar los valores iniciales para excluirlos de la validación
  const [initialArtCod, setInitialArtCod] = useState('');
  const [initialArtWooId, setInitialArtWooId] = useState('');
  
  // Estados para errores de validación
  const [errorArtCod, setErrorArtCod] = useState('');
  const [errorArtWoo, setErrorArtWoo] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategorias, setIsLoadingSubcategorias] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del producto a editar
  useEffect(() => {
    setIsLoadingProduct(true);
    axios.get(`${API_URL}/articulos/${id}`)
      .then(response => {
        const data = response.data;
        if(data.success && data.articulo) {
          const prod = data.articulo;
          setFormData({
            art_cod: prod.art_cod || '',
            art_nom: prod.art_nom || '',
            categoria: prod.inv_gru_cod || '',
            subcategoria: prod.inv_sub_gru_cod || 0,
            precio_detal: prod.precio_detal || '',
            precio_mayor: prod.precio_mayor || '',
            art_woo_id: prod.art_woo_id || '',
            actualiza_fecha: prod.actualiza_fecha || 'N'
          });
          // [NUEVO] Guardar los valores iniciales para excluirlos de la validación
          setInitialArtCod(prod.art_cod || '');
          setInitialArtWooId(prod.art_woo_id || '');
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el producto.',
            confirmButtonColor: '#f58ea3'
          });
        }
      })
      .catch(error => {
        console.error("Error al cargar producto:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar el producto, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => setIsLoadingProduct(false));
  }, [id]);

  // Cargar categorías
  useEffect(() => {
    setIsLoadingCategories(true);
    axios.get(`${API_URL}/categorias`)
      .then(response => {
        const data = response.data;
        if(data.success && data.result && data.result.data) {
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

  // Cargar subcategorías al cambiar la categoría seleccionada
  useEffect(() => {
    if(formData.categoria) {
      setIsLoadingSubcategorias(true);
      axios.get(`${API_URL}/subcategorias`, { params: { categoria: formData.categoria } })
        .then(response => {
          const data = response.data;
          if(data.success && data.subcategorias) {
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
        .finally(() => setIsLoadingSubcategorias(false));
    } else {
      setSubcategories([]);
      setFormData(prev => ({ ...prev, subcategoria: '' }));
    }
  }, [formData.categoria]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? (e.target.checked ? 'S' : 'N') : e.target.value;
    setFormData({...formData, [e.target.name]: value});
    // Reiniciar mensaje de error al editar
    if(e.target.name === 'art_cod') setErrorArtCod('');
    if(e.target.name === 'art_woo_id') setErrorArtWoo('');
  };

  // Función para validar la unicidad
  const validateUnique = async (field, value) => {
    try {
      const response = await axios.get(`${API_URL}/articulos/validar`, {
        params: { [field]: value }
      });
      if(response.data.success && response.data.exists) {
        return true;
      }
    } catch (error) {
      console.error(`Error validando ${field}:`, error);
    }
    return false;
  };

  // Validar en línea para art_cod, excluyendo el valor inicial
  const handleBlurArtCod = async () => {
    if(formData.art_cod && formData.art_cod !== initialArtCod) {
      const exists = await validateUnique('art_cod', formData.art_cod);
      if(exists) {
        setErrorArtCod('El código ya existe.');
      }
    }
  };

  // Validar en línea para art_woo_id, excluyendo el valor inicial
  const handleBlurArtWoo = async () => {
    if(formData.art_woo_id && formData.art_woo_id !== initialArtWooId) {
      const exists = await validateUnique('art_woo_id', formData.art_woo_id);
      if(exists) {
        setErrorArtWoo('El código de WooCommerce ya existe.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Si existen errores, no se envía
    if(errorArtCod || errorArtWoo) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'Corrija los errores en el formulario antes de enviar.',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }
    setIsSubmitting(true);
    
    const dataToSend = {
      ...formData,
      subcategoria: formData.subcategoria || 0,
      precio_detal: Number(formData.precio_detal),
      precio_mayor: Number(formData.precio_mayor)
    };
    console.log(dataToSend);
    axios.put(`${API_URL}/editarArticulo/${id}`, dataToSend)

      .then(response => {
        const data = response.data;
        if(data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Producto editado',
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
        console.error("Error al editar producto:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al editar el producto, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if(isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Editar Producto</h2>
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
            {isLoadingSubcategorias ? (
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
          {/* Actualizar Fecha Woo */}
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="actualiza_fecha"
                checked={formData.actualiza_fecha === 'S'}
                onChange={handleChange}
                className="h-4 w-4 text-[#f58ea3] focus:ring-[#f58ea3] border-gray-300 rounded"
              />
              <span className="text-gray-700">Actualizar Fecha Woo</span>
            </label>
          </div>
          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => navigate('/products')}
              className="px-4 py-2 border rounded hover:bg-gray-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || errorArtCod || errorArtWoo}
              className="px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#a5762f] transition cursor-pointer"
            >
              {isSubmitting ? "Editando..." : "Editar Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
