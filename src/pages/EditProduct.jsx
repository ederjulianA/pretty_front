// src/pages/EditProduct.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProductPhotoGallery from '../components/product/ProductPhotoGallery';
import VariationsTable from '../components/product/VariationsTable';
import CreateVariationModal from '../components/product/CreateVariationModal';
import { FaLayerGroup } from 'react-icons/fa';

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

  // Estados para producto variable
  const [productWooType, setProductWooType] = useState(null); // 'simple', 'variable', 'variation'
  const [variations, setVariations] = useState([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [parentAttributes, setParentAttributes] = useState([]); // [{name: "Tono", options: [...]}]
  const [isSyncingAttributes, setIsSyncingAttributes] = useState(false);

  // Cargar variaciones del producto variable
  const fetchVariations = useCallback(async () => {
    setIsLoadingVariations(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.get(`${API_URL}/articulos/variable/${id}/variations`, {
        headers: { 'x-access-token': token }
      });
      if (response.data.success) {
        setVariations(response.data.data || []);
        return response.data;
      }
    } catch (error) {
      console.error('Error al cargar variaciones:', error);
    } finally {
      setIsLoadingVariations(false);
    }
    return null;
  }, [id]);

  // Sincronizar atributos con WooCommerce
  const handleSyncAttributes = async () => {
    setIsSyncingAttributes(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.put(
        `${API_URL}/articulos/variable/${id}/sync-attributes`,
        {},
        { headers: { 'x-access-token': token } }
      );
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Sincronización exitosa',
          text: response.data.message || 'Atributos sincronizados con WooCommerce.',
          confirmButtonColor: '#f58ea3'
        });
        fetchVariations();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al sincronizar atributos.',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      console.error('Error al sincronizar atributos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al sincronizar atributos con WooCommerce.',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSyncingAttributes(false);
    }
  };

  // Función para parsear atributos de forma segura
  const parseAttributes = (attrs) => {
    try {
      const parsed = typeof attrs === 'string' ? JSON.parse(attrs) : attrs;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Cargar datos del producto a editar
  useEffect(() => {
    setIsLoadingProduct(true);
    axios.get(`${API_URL}/articulos/${id}`)
      .then(async (response) => {
        const data = response.data;
        if(data.success && data.articulo) {
          const prod = data.articulo;
          setFormData({
            art_cod: prod.art_cod || '',
            art_nom: prod.art_nom || '',
            categoria: prod.inv_gru_cod || '',
            subcategoria: prod.inv_sub_gru_cod || 0,
            precio_detal: prod.precio_detal_original || prod.precio_detal || '',
            precio_mayor: prod.precio_mayor_original || prod.precio_mayor || '',
            art_woo_id: prod.art_woo_id || '',
            actualiza_fecha: prod.actualiza_fecha || 'N'
          });
          setInitialArtCod(prod.art_cod || '');
          setInitialArtWooId(prod.art_woo_id || '');

          // Detectar tipo de producto
          // Prioridad: art_woo_type > art_variable > fallback por variaciones
          const wooType = prod.art_woo_type;
          const isVariable = prod.art_variable === 'S';

          if (wooType === 'variable' || wooType === 'variation') {
            setProductWooType(wooType);
            if (wooType === 'variable' && prod.attributes) {
              setParentAttributes(parseAttributes(prod.attributes));
            }
          } else if (isVariable) {
            setProductWooType('variable');
            if (prod.attributes) {
              setParentAttributes(parseAttributes(prod.attributes));
            }
          } else {
            // El backend puede no devolver art_woo_type aún
            // Intentar detectar consultando el endpoint de variaciones
            try {
              const token = localStorage.getItem('pedidos_pretty_token');
              const varResponse = await axios.get(`${API_URL}/articulos/variable/${id}/variations`, {
                headers: { 'x-access-token': token }
              });
              if (varResponse.data.success && varResponse.data.data) {
                // Es un producto variable - tiene variaciones
                setProductWooType('variable');
                setVariations(varResponse.data.data);
                // Inferir atributos desde las variaciones existentes
                if (varResponse.data.data.length > 0) {
                  const firstVar = varResponse.data.data[0];
                  if (firstVar.art_variation_attributes) {
                    const attrName = Object.keys(firstVar.art_variation_attributes)[0];
                    const usedOptions = varResponse.data.data
                      .map(v => v.art_variation_attributes ? Object.values(v.art_variation_attributes)[0] : null)
                      .filter(Boolean);
                    setParentAttributes([{ name: attrName, options: usedOptions }]);
                  }
                }
              } else {
                setProductWooType('simple');
              }
            } catch {
              // Si el endpoint falla (404, etc.), es un producto simple
              setProductWooType('simple');
            }
          }
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

  // Cargar variaciones cuando se detecte que es variable (si no se cargaron ya)
  useEffect(() => {
    if (productWooType === 'variable' && variations.length === 0 && !isLoadingVariations) {
      fetchVariations();
    }
  }, [productWooType, fetchVariations, variations.length, isLoadingVariations]);

  // Cargar categorías
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

  // Cargar subcategorías al cambiar la categoría seleccionada
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (formData.categoria) {
        setIsLoadingSubcategorias(true);
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
          setIsLoadingSubcategorias(false);
        }
      } else {
        setSubcategories([]);
        setFormData(prev => ({ ...prev, subcategoria: '' }));
      }
    };

    fetchSubcategories();
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

  // Calcular opciones disponibles para nueva variación
  const getAvailableOptions = () => {
    if (!parentAttributes.length) return [];
    const attr = parentAttributes[0]; // Solo soportamos un atributo
    const allOptions = attr.options || [];
    const usedOptions = variations
      .map(v => {
        if (v.art_variation_attributes) {
          return Object.values(v.art_variation_attributes)[0];
        }
        return null;
      })
      .filter(Boolean);
    return allOptions.filter(opt => !usedOptions.includes(opt));
  };

  if(isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf3f9]">
        <p className="text-lg text-[#f58ea3] font-semibold">Cargando producto...</p>
      </div>
    );
  }

  const isVariable = productWooType === 'variable';
  const isVariation = productWooType === 'variation';

  return (
    <div className="min-h-screen bg-[#edf3f9] p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl mx-auto bg-white/80 shadow-xl rounded-2xl p-6 sm:p-10 border border-[#f5cad4] backdrop-blur-md">
        <h2 className="text-3xl font-bold mb-2 text-center text-gray-800 tracking-tight">Editar Producto</h2>

        {/* Badge de tipo de producto */}
        {(isVariable || isVariation) && (
          <div className="flex justify-center mb-6">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
              isVariable
                ? 'bg-purple-100 text-purple-700'
                : 'bg-indigo-100 text-indigo-700'
            }`}>
              <FaLayerGroup className="w-3 h-3" />
              {isVariable ? 'Producto Variable' : 'Variación'}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Código</label>
            <input
              type="text"
              name="art_cod"
              value={formData.art_cod}
              onChange={handleChange}
              onBlur={handleBlurArtCod}
              placeholder="Ingrese código"
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
              disabled={isVariation}
            />
            {errorArtCod && <p className="text-[#f58ea3] text-xs mt-1">{errorArtCod}</p>}
            {isVariation && <p className="text-xs text-gray-400 mt-1">El código de variaciones es generado automáticamente.</p>}
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
            />
          </div>
          {/* Categoría */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Categoría</label>
            {isLoadingCategories ? (
              <p className="text-[#f58ea3]">Cargando categorías...</p>
            ) : (
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
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
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Subcategoría</label>
            {isLoadingSubcategorias ? (
              <p className="text-[#f58ea3]">Cargando subcategorías...</p>
            ) : (
              <select
                name="subcategoria"
                value={formData.subcategoria}
                onChange={handleChange}
                className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
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
                required
              />
              {isVariable && (
                <p className="text-xs text-gray-400 mt-1">Precio de referencia para las variaciones.</p>
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
                required
              />
              {isVariable && (
                <p className="text-xs text-gray-400 mt-1">Precio de referencia para las variaciones.</p>
              )}
            </div>
          </div>
          {/* Código WooCommerce */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Código WooCommerce</label>
            <input
              type="text"
              name="art_woo_id"
              value={formData.art_woo_id}
              onChange={handleChange}
              onBlur={handleBlurArtWoo}
              placeholder="Ingrese código WooCommerce"
              className="w-full p-3 border border-[#f5cad4] rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
              required
            />
            {errorArtWoo && <p className="text-[#f58ea3] text-xs mt-1">{errorArtWoo}</p>}
          </div>
          {/* Actualizar Fecha Woo */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="actualiza_fecha"
                checked={formData.actualiza_fecha === 'S'}
                onChange={handleChange}
                className="h-4 w-4 text-[#f58ea3] focus:ring-[#f58ea3] border-[#f5cad4] rounded"
              />
              <span className="text-gray-700">Actualizar Fecha Woo</span>
            </label>
          </div>
          {/* Sección de Fotos */}
          <div>
            <label className="block text-gray-700 mb-2 font-medium">Fotos del Producto</label>
            <ProductPhotoGallery productId={id} />
          </div>
          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-2 border border-[#f58ea3] text-[#f58ea3] rounded-xl bg-[#fffafe] hover:bg-[#f7b3c2]/40 hover:text-[#a5762f] transition font-semibold shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || errorArtCod || errorArtWoo}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:from-[#a5762f] hover:to-[#f7b3c2] transition cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? "Editando..." : "Editar Producto"}
            </button>
          </div>
        </form>
      </div>

      {/* Sección de Variaciones - solo para producto variable */}
      {isVariable && (
        <div className="w-full max-w-2xl mx-auto">
          <VariationsTable
            variations={variations}
            isLoading={isLoadingVariations}
            onAddVariation={() => setIsVariationModalOpen(true)}
            onSyncAttributes={handleSyncAttributes}
            isSyncing={isSyncingAttributes}
            parentName={formData.art_nom}
          />
        </div>
      )}

      {/* Modal para crear variación */}
      {isVariable && (
        <CreateVariationModal
          isOpen={isVariationModalOpen}
          onClose={() => setIsVariationModalOpen(false)}
          parentArtSec={id}
          parentName={formData.art_nom}
          attributeType={parentAttributes[0]?.name || 'Tono'}
          availableOptions={getAvailableOptions()}
          referencePrices={{
            detal: formData.precio_detal,
            mayor: formData.precio_mayor,
          }}
          onVariationCreated={fetchVariations}
        />
      )}
    </div>
  );
};

export default EditProduct;
