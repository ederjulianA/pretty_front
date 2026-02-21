// src/pages/EditProduct.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ProductPhotoGallery from '../components/product/ProductPhotoGallery';
import VariationsTable from '../components/product/VariationsTable';
import CreateVariationModal from '../components/product/CreateVariationModal';
import BundleManager from '../components/product/BundleManager';
import ProfitMarginDisplay from '../components/product/ProfitMarginDisplay';
import useRentabilidad from '../hooks/useRentabilidad';
import { FaLayerGroup, FaBoxOpen, FaSpinner } from 'react-icons/fa';

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
  const [productWooType, setProductWooType] = useState(null); // 'simple', 'variable', 'variation', 'bundle'
  const [variations, setVariations] = useState([]);
  const [isLoadingVariations, setIsLoadingVariations] = useState(false);
  const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
  const [parentAttributes, setParentAttributes] = useState([]); // [{name: "Tono", options: [...]}]
  const [isSyncingAttributes, setIsSyncingAttributes] = useState(false);

  // Estados para producto bundle
  const [bundleComponents, setBundleComponents] = useState([]);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);

  // Estados para conversión simple → variable
  const [convertAttributeName, setConvertAttributeName] = useState('Tono');
  const [convertAttributeOptions, setConvertAttributeOptions] = useState([]);
  const [convertOptionInput, setConvertOptionInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  
  // Estado para costo promedio del producto
  const [costoPromedio, setCostoPromedio] = useState(0);
  
  // Estado para datos de rentabilidad del backend
  const [rentabilidadData, setRentabilidadData] = useState({
    rentabilidadDetal: null,
    margenGananciaDetal: null,
    utilidadBrutaDetal: null,
    clasificacionRentabilidad: null,
    rentabilidadMayor: null
  });
  
  // Hook para obtener datos de rentabilidad actualizados del backend
  const { rentabilidadData: rentabilidadBackend, refetch: refetchRentabilidad } = useRentabilidad(id, true);
  
  // Actualizar costo promedio si el hook lo devuelve y el costo actual es 0
  // (Solo como fallback si el endpoint de detalle no lo devuelve por alguna razón)
  useEffect(() => {
    if (rentabilidadBackend.costoPromedio && rentabilidadBackend.costoPromedio > 0 && costoPromedio === 0) {
      console.log('✅ Costo promedio actualizado desde hook de rentabilidad:', rentabilidadBackend.costoPromedio);
      setCostoPromedio(rentabilidadBackend.costoPromedio);
    }
  }, [rentabilidadBackend.costoPromedio, costoPromedio]);

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

  // Convertir producto simple a variable (endpoint backend v2.1)
  const handleConvertToVariable = async () => {
    const options = convertAttributeOptions.filter(Boolean).map(o => o.trim());
    if (options.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Opciones requeridas',
        text: 'Agrega al menos una opción para el atributo (ej: Rojo, Azul).',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }
    setIsConverting(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.post(
        `${API_URL}/articulos/variable/${id}/convert-to-variable`,
        {
          attributes: [{ name: convertAttributeName, options }],
          categoria: formData.categoria || undefined
        },
        { headers: { 'x-access-token': token } }
      );
      if (response.data.success) {
        const data = response.data.data;
        setProductWooType('variable');
        setParentAttributes(data.attributes || [{ name: convertAttributeName, options }]);
        setConvertAttributeOptions([]);
        setConvertOptionInput('');
        await fetchVariations();
        const hasWooError = response.data.errors?.wooCommerce;
        Swal.fire({
          icon: hasWooError ? 'warning' : 'success',
          title: hasWooError ? 'Convertido con advertencia' : 'Convertido a variable',
          text: hasWooError
            ? 'El producto es variable en el sistema. La sincronización con WooCommerce falló; puedes sincronizar después.'
            : 'Ahora puedes agregar variaciones desde la sección inferior.',
          confirmButtonColor: '#f58ea3'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'No se pudo convertir el producto.',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Error al convertir a producto variable.';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsConverting(false);
    }
  };

  const addConvertOption = () => {
    const val = convertOptionInput.trim();
    if (val && !convertAttributeOptions.includes(val)) {
      setConvertAttributeOptions(prev => [...prev, val]);
      setConvertOptionInput('');
    }
  };

  const removeConvertOption = (index) => {
    setConvertAttributeOptions(prev => prev.filter((_, i) => i !== index));
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
          
          // Obtener costo promedio del producto
          // Usar la misma lógica que Products.jsx para mantener consistencia
          // El backend ahora devuelve todos los campos de costo promedio en el endpoint de detalle
          const getCostoPromedio = (articulo) =>
            articulo.costo_promedio ??
            articulo.costo_promedio_ponderado ??
            articulo.costo_promedio_actual ??
            articulo.kar_cos_pro ??
            articulo.art_bod_cos_cat ??
            null;
          
          const costoCalculado = getCostoPromedio(prod);
          
          if (costoCalculado !== null && costoCalculado !== undefined) {
            console.log('✅ Costo promedio obtenido del endpoint /articulos/:id:', costoCalculado);
            setCostoPromedio(parseFloat(costoCalculado));
          } else {
            console.log('⚠️ Costo promedio no disponible en el endpoint de detalle. Se intentará obtener desde hook de rentabilidad o variaciones.');
            setCostoPromedio(0);
          }
          
          // Guardar datos de rentabilidad del backend para pasarlos al componente
          // Combinar datos de la respuesta inicial con datos del hook (si están disponibles)
          setRentabilidadData({
            rentabilidadDetal: prod.rentabilidad_detal ?? prod.rentabilidad ?? null,
            margenGananciaDetal: prod.margen_ganancia_detal ?? prod.margen_ganancia ?? null,
            utilidadBrutaDetal: prod.utilidad_bruta_detal ?? prod.utilidad_bruta ?? null,
            clasificacionRentabilidad: prod.clasificacion_rentabilidad ?? null,
            rentabilidadMayor: prod.rentabilidad_mayor ?? null
          });

          // Detectar tipo de producto
          // Prioridad: art_bundle > art_woo_type > art_variable > fallback por variaciones
          const wooType = prod.art_woo_type;
          const isVariable = prod.art_variable === 'S';
          const isBundle = prod.art_bundle === 'S';

          if (isBundle) {
            // Es un bundle - cargar componentes
            setProductWooType('bundle');
            try {
              const token = localStorage.getItem('pedidos_pretty_token');
              const bundleResponse = await axios.get(`${API_URL}/bundles/${id}/componentes`, {
                headers: { 'x-access-token': token }
              });
              if (bundleResponse.data.success && bundleResponse.data.data) {
                const componentes = bundleResponse.data.data.componentes || [];
                
                // El backend ahora devuelve directamente precio_detal, precio_mayor y costo_promedio
                setBundleComponents(componentes.map(c => ({
                  art_sec: c.art_sec,
                  art_cod: c.art_cod,
                  art_nom: c.art_nom,
                  cantidad: c.cantidad,
                  stock: c.stock_disponible || 0,
                  precio_detal: c.precio_detal || 0,
                  precio_mayor: c.precio_mayor || 0,
                  costo_promedio: c.costo_promedio || 0
                })));
              }
            } catch (bundleError) {
              console.error('Error cargando componentes del bundle:', bundleError);
            }
          } else if (wooType === 'variable' || wooType === 'variation') {
            setProductWooType(wooType);
            if (wooType === 'variable' && prod.attributes) {
              setParentAttributes(parseAttributes(prod.attributes));
            }
            // Cargar variaciones si es producto variable
            if (wooType === 'variable') {
              const variationsData = await fetchVariations();
              // Si el costo promedio es 0, intentar obtenerlo del promedio de variaciones
              if (costoCalculado === 0 && variationsData?.data?.length > 0) {
                const getCostoVariacion = (v) =>
                  v.costo_promedio ?? 
                  v.costo_promedio_ponderado ?? 
                  v.costo_promedio_actual ?? 
                  v.art_bod_cos_cat ?? 
                  v.kar_cos_pro ?? 
                  0;
                
                const variacionesConCosto = variationsData.data.filter(v => {
                  const costoVar = getCostoVariacion(v);
                  return costoVar > 0;
                });
                
                if (variacionesConCosto.length > 0) {
                  const costoPromedioVariaciones = variacionesConCosto.reduce((sum, v) => {
                    return sum + parseFloat(getCostoVariacion(v));
                  }, 0) / variacionesConCosto.length;
                  
                  console.log('✅ Costo promedio calculado desde variaciones:', costoPromedioVariaciones);
                  setCostoPromedio(costoPromedioVariaciones);
                } else {
                  console.log('⚠️ Variaciones cargadas pero ninguna tiene costo promedio:', variationsData.data.map(v => ({
                    art_cod: v.art_cod,
                    campos: Object.keys(v).filter(k => k.toLowerCase().includes('costo') || k.toLowerCase().includes('cos'))
                  })));
                }
              }
            }
          } else if (isVariable) {
            setProductWooType('variable');
            if (prod.attributes) {
              setParentAttributes(parseAttributes(prod.attributes));
            }
            // Cargar variaciones
            const variationsData = await fetchVariations();
            // Si el costo promedio es 0, intentar obtenerlo del promedio de variaciones
            if (costoCalculado === 0 && variationsData?.data?.length > 0) {
              const getCostoVariacion = (v) =>
                v.costo_promedio ?? 
                v.costo_promedio_ponderado ?? 
                v.costo_promedio_actual ?? 
                v.art_bod_cos_cat ?? 
                v.kar_cos_pro ?? 
                0;
              
              const variacionesConCosto = variationsData.data.filter(v => {
                const costoVar = getCostoVariacion(v);
                return costoVar > 0;
              });
              
              if (variacionesConCosto.length > 0) {
                const costoPromedioVariaciones = variacionesConCosto.reduce((sum, v) => {
                  return sum + parseFloat(getCostoVariacion(v));
                }, 0) / variacionesConCosto.length;
                
                console.log('✅ Costo promedio calculado desde variaciones:', costoPromedioVariaciones);
                setCostoPromedio(costoPromedioVariaciones);
              } else {
                console.log('⚠️ Variaciones cargadas pero ninguna tiene costo promedio');
              }
            }
          } else {
            // art_woo_type no es 'variable'/'variation' y art_variable no es 'S'
            // Solo considerar variable si el endpoint de variaciones devuelve al menos una variación.
            // Importante: el backend devuelve { success: true, data: [] } para productos sin variaciones;
            // en JS [] es truthy, por eso hay que comprobar data.length > 0 para no marcar simple como variable.
            try {
              const token = localStorage.getItem('pedidos_pretty_token');
              const varResponse = await axios.get(`${API_URL}/articulos/variable/${id}/variations`, {
                headers: { 'x-access-token': token }
              });
              const data = varResponse.data?.data;
              const hasVariations = Array.isArray(data) && data.length > 0;
              if (varResponse.data.success && hasVariations) {
                setProductWooType('variable');
                setVariations(data);
                const firstVar = data[0];
                if (firstVar?.art_variation_attributes) {
                  const attrName = Object.keys(firstVar.art_variation_attributes)[0];
                  const usedOptions = data
                    .map(v => v.art_variation_attributes ? Object.values(v.art_variation_attributes)[0] : null)
                    .filter(Boolean);
                  setParentAttributes([{ name: attrName, options: usedOptions }]);
                }
              } else {
                setProductWooType('simple');
              }
            } catch {
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

  // Cargar categorías
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

  // Cargar subcategorías al cambiar la categoría seleccionada
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (formData.categoria) {
        setIsLoadingSubcategorias(true);
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

  const handleSubmit = async (e) => {
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

    // Validar bundle tiene componentes
    if (productWooType === 'bundle' && bundleComponents.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: 'El bundle debe tener al menos un componente.',
        confirmButtonColor: '#f58ea3'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Manejo especial para bundles
      if (productWooType === 'bundle') {
        const token = localStorage.getItem('pedidos_pretty_token');

        // Actualizar datos básicos del bundle
        await axios.put(`${API_URL}/articulos/${id}`, {
          art_cod: formData.art_cod,
          art_nom: formData.art_nom,
          categoria: formData.categoria,
          subcategoria: formData.subcategoria || 0,
          art_woo_id: formData.art_woo_id,
          precio_detal: Number(formData.precio_detal),
          precio_mayor: Number(formData.precio_mayor),
          actualiza_fecha: formData.actualiza_fecha
        }, {
          headers: { 'x-access-token': token }
        });

        // Actualizar componentes del bundle
        await axios.put(`${API_URL}/bundles/${id}/componentes`, {
          componentes: bundleComponents.map(c => ({
            art_sec: c.art_sec,
            cantidad: c.cantidad
          }))
        }, {
          headers: { 'x-access-token': token }
        });

        Swal.fire({
          icon: 'success',
          title: 'Bundle actualizado',
          text: 'El bundle se ha actualizado correctamente.',
          confirmButtonColor: '#f58ea3'
        }).then(() => {
          navigate('/products');
        });

      } else {
        // Lógica existente para productos simples/variables
        const dataToSend = {
          ...formData,
          subcategoria: formData.subcategoria || 0,
          precio_detal: Number(formData.precio_detal),
          precio_mayor: Number(formData.precio_mayor)
        };

        const response = await axios.put(`${API_URL}/articulos/${id}`, dataToSend);
        const data = response.data;

        if(data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Producto editado',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          }).then(() => {
            navigate('/products');
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message,
            confirmButtonColor: '#f58ea3'
          });
        }
      }
    } catch (error) {
      console.error("Error al editar producto:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Error al editar el producto, por favor intente nuevamente.',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
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
  const isBundle = productWooType === 'bundle';

  return (
    <div className="min-h-screen bg-[#edf3f9] pb-24">
      <div className="w-full max-w-4xl mx-auto p-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-gray-800 truncate">Editar Producto</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {formData.art_cod && `Código: ${formData.art_cod}`}
            </p>
          </div>
          {/* Badge de tipo de producto */}
          {(isVariable || isVariation || isBundle) && (
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                isVariable
                  ? 'bg-purple-100 text-purple-700'
                  : isVariation
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-pink-100 text-pink-700'
              }`}>
                {isVariable ? (
                  <>
                    <FaLayerGroup className="w-3 h-3" />
                    Producto Variable
                  </>
                ) : isVariation ? (
                  <>
                    <FaLayerGroup className="w-3 h-3" />
                    Variación
                  </>
                ) : (
                  <>
                    <FaBoxOpen className="w-3 h-3" />
                    Combo/Bundle
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        <div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Información Básica */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Información Básica
            </h3>
            <div className="space-y-5">
              {/* Código */}
              <div>
                <label className="block text-gray-700 mb-2 font-semibold text-base">Código del Producto</label>
                <input
                  type="text"
                  name="art_cod"
                  value={formData.art_cod}
                  onChange={handleChange}
                  onBlur={handleBlurArtCod}
                  placeholder="Ingrese código único"
                  className={`w-full px-4 py-3.5 text-base border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${errorArtCod ? 'border-red-400 focus:border-red-400 bg-red-50/30' : 'border-[#f5cad4]/60'}`}
                  required
                  disabled={isVariation}
                />
                {errorArtCod && (
                  <div className="mt-2 flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorArtCod}
                  </div>
                )}
                {isVariation && <p className="text-xs text-gray-500 mt-1.5">El código de variaciones es generado automáticamente.</p>}
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
                />
              </div>
            </div>
          </div>

          {/* Clasificación (variaciones heredan del padre, no editable) */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Clasificación
            </h3>
            {isVariation && (
              <p className="text-sm text-gray-500 mb-4">
                La variación hereda la categoría y subcategoría del producto padre; no se pueden modificar aquí.
              </p>
            )}
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
                    disabled={isVariation}
                    className={`w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${isVariation ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#fffafe]'}`}
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
                  <div className="flex items-center gap-2 text-[#f58ea3] py-3">
                    <FaSpinner className="animate-spin" />
                    <span>Cargando subcategorías...</span>
                  </div>
                ) : (
                  <select
                    name="subcategoria"
                    value={formData.subcategoria}
                    onChange={handleChange}
                    disabled={isVariation}
                    className={`w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${isVariation ? 'bg-gray-100 cursor-not-allowed' : 'bg-[#fffafe]'}`}
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
            </div>
          </div>

          {/* Sección de Componentes (solo para bundle) */}
          {isBundle && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-pink-200/50 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-pink-200/40">
                Componentes del Bundle
              </h3>
              <BundleManager
                components={bundleComponents}
                onComponentsChange={setBundleComponents}
                disabled={isSubmitting}
                precioDetalBundle={parseFloat(formData.precio_detal) || 0}
                precioMayorBundle={parseFloat(formData.precio_mayor) || 0}
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
                </label>
                <input
                  type="number"
                  name="precio_detal"
                  value={formData.precio_detal}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
                  required
                />
                {isVariable && (
                  <p className="text-xs text-gray-500 mt-1.5">Precio de referencia para las variaciones.</p>
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
                  placeholder="0.00"
                  className="w-full px-4 py-3 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition"
                  required
                />
                {isVariable && (
                  <p className="text-xs text-gray-500 mt-1.5">Precio de referencia para las variaciones.</p>
                )}
              </div>
            </div>
            
            {/* Mostrar márgenes de rentabilidad para productos simples y variables */}
            {!isBundle && (
              <ProfitMarginDisplay
                precioDetal={parseFloat(formData.precio_detal) || 0}
                precioMayor={parseFloat(formData.precio_mayor) || 0}
                costoPromedio={costoPromedio}
                tipoProducto={isVariable ? 'variable' : 'simple'}
                title="Rentabilidad del Producto"
                // Priorizar datos del hook de rentabilidad (más actualizados)
                rentabilidadDetal={rentabilidadBackend.rentabilidadDetal ?? rentabilidadData.rentabilidadDetal}
                margenGananciaDetal={rentabilidadBackend.margenGananciaDetal ?? rentabilidadData.margenGananciaDetal}
                utilidadBrutaDetal={rentabilidadBackend.utilidadBrutaDetal ?? rentabilidadData.utilidadBrutaDetal}
                clasificacionRentabilidad={rentabilidadBackend.clasificacionRentabilidad ?? rentabilidadData.clasificacionRentabilidad}
                rentabilidadMayor={rentabilidadBackend.rentabilidadMayor ?? rentabilidadData.rentabilidadMayor}
              />
            )}
          </div>

          {/* Integración WooCommerce */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Integración WooCommerce
            </h3>
            <div className="space-y-4">
              {/* Código WooCommerce (productos simples/padre). En variaciones se usa art_woo_variation_id en BD. */}
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  {isVariation ? 'ID WooCommerce (variación)' : 'Código WooCommerce'}
                </label>
                <input
                  type="text"
                  name="art_woo_id"
                  value={formData.art_woo_id}
                  onChange={handleChange}
                  onBlur={handleBlurArtWoo}
                  placeholder={isVariation ? 'ID de variación en WooCommerce' : 'Ingrese código WooCommerce'}
                  className={`w-full px-4 py-3 border rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition ${errorArtWoo ? 'border-red-400 focus:border-red-400 bg-red-50/30' : 'border-[#f5cad4]/60'}`}
                  required={!isVariation}
                />
                {errorArtWoo && (
                  <div className="mt-2 flex items-center text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorArtWoo}
                  </div>
                )}
                {isVariation && !formData.art_woo_id && (
                  <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200/60 rounded-lg px-3 py-2">
                    Esta variación no tiene ID de WooCommerce. Suele ocurrir cuando la variación se creó pero la sincronización con WooCommerce falló (por ejemplo, si el producto padre no estaba convertido a tipo variable en WooCommerce). Revise los logs del backend al crear variaciones.
                  </p>
                )}
              </div>
              {/* Actualizar Fecha Woo */}
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="actualiza_fecha"
                    checked={formData.actualiza_fecha === 'S'}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#f58ea3] focus:ring-[#f58ea3] border-[#f5cad4] rounded"
                  />
                  <span className="text-gray-700 font-medium">Actualizar Fecha Woo</span>
                </label>
          </div>
          </div>
        </div>

          {/* Convertir a producto variable — solo para artículos simples */}
          {productWooType === 'simple' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-purple-200/50 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <FaLayerGroup className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Convertir a producto variable
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Convierte este artículo en un producto variable para gestionar variaciones (por ejemplo tonos o colores) sin perder datos. Luego podrás agregar cada variación desde esta misma página.
                  </p>
                </div>
              </div>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">Atributo de variación</label>
                  <select
                    value={convertAttributeName}
                    onChange={(e) => setConvertAttributeName(e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition text-gray-800"
                  >
                    <option value="Tono">Tono</option>
                    <option value="Color">Color</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2 font-medium text-sm">Opciones del atributo</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {convertAttributeOptions.map((opt, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 text-sm font-medium border border-purple-200/60"
                      >
                        {opt}
                        <button
                          type="button"
                          onClick={() => removeConvertOption(index)}
                          className="ml-0.5 text-purple-500 hover:text-purple-700 focus:outline-none"
                          aria-label="Quitar opción"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={convertOptionInput}
                      onChange={(e) => setConvertOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConvertOption())}
                      placeholder="Ej: Rojo, Azul, Negro..."
                      className="flex-1 min-w-0 px-4 py-2.5 border border-[#f5cad4]/60 rounded-xl bg-[#fffafe] focus:ring-2 focus:ring-[#f58ea3]/50 focus:border-[#f58ea3] outline-none transition text-gray-800"
                    />
                    <button
                      type="button"
                      onClick={addConvertOption}
                      className="px-4 py-2.5 rounded-xl border border-[#f5cad4]/80 text-gray-700 bg-white hover:bg-[#f7b3c2]/20 transition font-medium"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleConvertToVariable}
                  disabled={isConverting || convertAttributeOptions.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-semibold shadow-md hover:bg-purple-700 hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isConverting ? (
                    <>
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      Convirtiendo...
                    </>
                  ) : (
                    <>
                      <FaLayerGroup className="w-4 h-4" />
                      Convertir a producto variable
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Galería de Fotos */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-[#f5cad4]/40 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-[#f5cad4]/30">
              Galería de Imágenes
            </h3>
            <ProductPhotoGallery productId={id} isVariation={isVariation} />
          </div>
        </form>

        {/* Sección de Variaciones - solo para producto variable */}
        {isVariable && (
          <div className="mt-6">
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
                Corrige los errores antes de guardar
              </span>
            ) : (
              <span>
                Editando: {formData.art_nom || 'Producto'}
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
              disabled={isSubmitting || errorArtCod || errorArtWoo}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold shadow-md hover:shadow-lg hover:from-[#e87d92] hover:to-[#f6a2b1] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>

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
