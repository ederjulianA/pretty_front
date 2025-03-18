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
    art_woo_id: ''
  });
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
        if(data.success && data.producto) {
          setFormData({
            art_cod: data.producto.art_cod || '',
            art_nom: data.producto.art_nom || '',
            categoria: data.producto.categoria || '',
            subcategoria: data.producto.sub_categoria || '',
            precio_detal: data.producto.precio_detal || '',
            precio_mayor: data.producto.precio_mayor || '',
            art_woo_id: data.producto.art_woo_id || ''
          });
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
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Realizamos una petición PUT para editar el producto
    axios.put(`${API_URL}/editarArticulo/${id}`, formData)
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
              placeholder="Ingrese código"
              className="w-full p-2 border rounded"
              required
            />
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
              placeholder="Ingrese código WooCommerce"
              className="w-full p-2 border rounded"
              required
            />
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
              disabled={isSubmitting}
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
