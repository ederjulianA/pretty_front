// src/POS.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import Swal from 'sweetalert2';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Filters from './components/Filters';
import Categories from './components/Categories';
import ProductsGrid from './components/ProductsGrid';
import OrderSummary from './components/OrderSummary';
import ClientModal from './components/ClientModal';
import OrderDrawer from './components/OrderDrawer';
import useProducts from './hooks/useProducts';
import useCategories from './hooks/useCategories';
import useClients from './hooks/useClients';
import usePersistentState from './hooks/usePersistentState';
import usePedidoMinimo from './hooks/usePedidoMinimo';
import { formatValue } from './utils';
import { FaShoppingCart, FaSpinner } from 'react-icons/fa';
import usePrintOrder from './hooks/usePrintOrder';
import LoadingSpinner from './components/LoadingSpinner';
import CreateClientModal from './components/CreateClientModal';
import useEventoPromocional from './hooks/useEventoPromocional';
import PromocionBanner from './components/PromocionBanner';
import useParametro from './hooks/useParametro';

const POS = () => {
  const [searchParams] = useSearchParams();
  const facNroToEdit = searchParams.get('fac_nro');
  const navigate = useNavigate();
  // Persist state for order and selected client
  const [order, setOrder] = usePersistentState('order', []);
  const [selectedClient, setSelectedClient] = usePersistentState('selectedClient', null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const { printOrder } = usePrintOrder();
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);

  // Filters for products and category
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [filterExistencia, setFilterExistencia] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Price type and discount
  const [selectedPriceType, setSelectedPriceType] = useState("mayor");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [facDescuentoGeneral, setFacDescuentoGeneral] = useState(0);

  // Order drawer for mobile
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  // Submitting overlay state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for scroll
  const containerRef = useRef(null);
  const categoriesRef = useRef(null);

  // Custom hooks for products and categories
  const { products, fetchProducts, pageNumber, hasMore, isLoading, setProducts } = useProducts(
    { filterCodigo, filterNombre, filterExistencia },
    selectedCategory,
    selectedSubcategory
  );
  const { categories: categoryList, isLoadingCategories: isLoadingCategoryList } = useCategories();
  const { clientResults, fetchClients } = useClients();
  const { pedidoMinimo, isLoading: isLoadingPedidoMinimo } = usePedidoMinimo();
  const { evento: eventoPromocional } = useEventoPromocional();
  const { valor: montoMayorista } = useParametro('monto_mayorista');

  // Editing mode state
  const [isEditing, setIsEditing] = useState(false);
  const [orderType, setOrderType] = useState(null);

  // Load order for editing if facNroToEdit exists
  useEffect(() => {
    if (facNroToEdit) {
      axios.get(`${API_URL}/order/${facNroToEdit}`, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      })
      .then(response => {
        if (response.data.success) {
          const orderData = response.data.order;
          // Log para ver los datos recibidos del servidor
          console.log("Datos recibidos del servidor:", orderData);
          
          setSelectedClient({
            nit_sec: orderData.header.nit_sec,
            nit_ide: orderData.header.nit_ide,
            nit_nom: orderData.header.nit_nom,
            nit_tel: orderData.header.nit_tel,
            nit_dir: orderData.header.nit_dir,
            fac_nro: orderData.header.fac_nro,
            fac_nro_woo : orderData.header.fac_nro_woo,
          });
          setOrderType(orderData.header.fac_tip_cod);

          // Si el primer ítem trae kar_des_uno, lo usamos
          let initialListaPrecio = "";
          const initialDiscount = orderData.details.length > 0 ? orderData.details[0].kar_des_uno || 0 : 0;
          if(orderData.details[0].kar_lis_pre_cod === 1){
            initialListaPrecio = "detal";
          } else {
            initialListaPrecio = "mayor";
          }
          setDiscountPercent(initialDiscount);
          setSelectedPriceType(initialListaPrecio);
          // Cargar descuento general del header
          setFacDescuentoGeneral(orderData.header.fac_descuento_general || 0);
          // Map details to order items
          const mergedDetails = orderData.details.map(item => {
            // Determinar si el artículo tiene oferta
            const tieneOferta = item.kar_tiene_oferta === 'S';
            
            // Determinar los precios según si tiene oferta o no
            let price, price_detal;
            
            if (tieneOferta) {
              // Si tiene oferta, usar los precios de oferta
              price = item.precio_mayor;
              price_detal = item.precio_detal;
            } else {
              // Si no tiene oferta, usar los precios originales
              price = item.kar_pre_pub_mayor;
              price_detal = item.kar_pre_pub_detal;
            }
            
            return {
              id: item.art_sec,
              codigo: item.art_cod,
              name: item.art_nom,
              price: price,
              price_detal: price_detal,
              quantity: item.kar_uni,
              existencia: item.existencia || 1,
              kar_des_uno: item.kar_des_uno || 0,
              kar_sec: item.kar_sec,
              fac_sec: item.fac_sec,
              imgUrl: item.art_url_img_servi,
              // Información de promociones
              tiene_oferta: item.kar_tiene_oferta,
              precio_oferta: item.kar_precio_oferta,
              descuento_porcentaje: item.kar_descuento_porcentaje,
              codigo_promocion: item.kar_codigo_promocion,
              descripcion_promocion: item.kar_descripcion_promocion,
              precio_detal_original: item.precio_detal_original,
              precio_mayor_original: item.precio_mayor_original
            };
          });
          
          console.log("Detalles procesados:", mergedDetails);
          setOrder(mergedDetails);
          setIsEditing(true);
        }
      })
      .catch(error => console.error("Error al cargar el pedido para edición:", error));
    }
  }, [facNroToEdit]);

  // Calculate totals
  const wholesaleTotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const retailTotal = order.reduce((sum, item) => sum + (item.price_detal || item.price) * item.quantity, 0);
  
  // Lógica de evento promocional y control de lista de precio
  const montoMayoristaNum = montoMayorista ? Number(montoMayorista) : 0;
  const cumpleUmbralMayorista = wholesaleTotal >= montoMayoristaNum;
  const hayEventoActivo = eventoPromocional && eventoPromocional.eve_activo === 'S';
  
  // Determinar tipo de precio según umbral mayorista (siempre automático)
  let precioTypeForzado = selectedPriceType;
  let isPriceTypeDisabled = false;
  
  if (montoMayoristaNum > 0) {
    if (cumpleUmbralMayorista) {
      precioTypeForzado = "mayor";
      isPriceTypeDisabled = true;
    } else {
      precioTypeForzado = "detal";
      isPriceTypeDisabled = true;
    }
  }
  
  // Aplicar el tipo de precio forzado si está deshabilitado
  const precioTypeActual = isPriceTypeDisabled ? precioTypeForzado : selectedPriceType;
  
  const totalValue = precioTypeActual === "detal" ? retailTotal : wholesaleTotal;
  const discountValue = totalValue * (discountPercent / 100);
  
  // Calcular descuento evento según condiciones
  let descuentoEventoCalculado = 0;
  let porcentajeDescuentoEvento = 0;
  if (hayEventoActivo && montoMayoristaNum > 0) {
    // Si cumple umbral mayorista: aplicar descuento mayorista
    if (cumpleUmbralMayorista) {
      porcentajeDescuentoEvento = eventoPromocional.eve_descuento_mayor;
      descuentoEventoCalculado = totalValue * (porcentajeDescuentoEvento / 100);
    } else {
      // Si no cumple umbral: aplicar descuento detal
      porcentajeDescuentoEvento = eventoPromocional.eve_descuento_detal;
      descuentoEventoCalculado = totalValue * (porcentajeDescuentoEvento / 100);
    }
  }
  
  // Usar el descuento evento calculado si hay evento activo, sino usar el del estado (para edición)
  const descuentoEventoFinal = hayEventoActivo ? descuentoEventoCalculado : (facDescuentoGeneral || 0);
  
  const finalTotal = totalValue - discountValue - descuentoEventoFinal;

  // Función para manejar el scroll infinito
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchProducts(pageNumber + 1);
    }
  };

  // Función para manejar el scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom && !isLoading && hasMore) {
      handleLoadMore();
    }
  };

  // Función debounce para la búsqueda
  const debouncedSearch = useCallback((filters) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchProducts(1);
    }, 300); // 300ms de delay
  }, [fetchProducts]);

  // Manejadores de cambio de filtros
  const handleFilterChange = useCallback((type, value) => {
    switch(type) {
      case 'codigo':
        setFilterCodigo(value);
        break;
      case 'nombre':
        setFilterNombre(value);
        break;
      case 'existencia':
        setFilterExistencia(value);
        break;
      default:
        break;
    }
  }, []);

  // Efecto para manejar cambios en los filtros
  useEffect(() => {
    const filters = {
      codigo: filterCodigo.trim(),
      nombre: filterNombre.trim(),
      existencia: filterExistencia.trim(),
      categoria: selectedCategory,
      subcategoria: selectedSubcategory
    };
    
    debouncedSearch(filters);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filterCodigo, filterNombre, filterExistencia, selectedCategory, selectedSubcategory, debouncedSearch]);

  // Pointer events for dragging categories horizontally
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftValue, setScrollLeft] = useState(0);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setStartX(e.clientX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.clientX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesRef.current.scrollLeft = scrollLeftValue - walk;
  };

  const handlePointerUp = () => setIsDragging(false);
  const handlePointerCancel = () => setIsDragging(false);

  // Function to add product to order
  const addToOrder = (product) => {
    if (product.existencia <= 0) return;
    setOrder(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        if (exists.quantity >= product.existencia) return prev;
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId) => {
    setOrder(prev => prev
      .map(item => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item)
      .filter(item => item.quantity > 0)
    );
  };

  // Nuevo Pedido: reset order and client
  const handleNewOrder = () => {
    setOrder([]);
    setSelectedClient(null);
    setFacDescuentoGeneral(0);
    setDiscountPercent(0);
    // Reinicia la URL para eliminar el query param "fac_nro"
    navigate('/pos');
    Swal.fire({
      icon: 'info',
      title: 'Nuevo Pedido',
      text: 'Se ha iniciado un nuevo pedido.',
      confirmButtonColor: '#f58ea3'
    });
  };

  // Función para crear o editar cotización (Realizar Pedido)
  const handlePlaceOrder = () => {
    if (order.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe agregar al menos un artículo al pedido.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }
    if (!selectedClient) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar un cliente para el pedido.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }
    const fac_usu_cod = localStorage.getItem('user_pretty');
    if (!fac_usu_cod) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el código de usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }
    
    const payload = {
      nit_sec: selectedClient.nit_sec,
      fac_usu_cod_cre: fac_usu_cod,
      fac_tip_cod: "COT",
      fac_est_fac: "A",
      descuento: discountPercent,
      fac_descuento_general: descuentoEventoFinal,
      lis_pre_cod: precioTypeActual === "detal" ? 1 : 2,
      fac_nro_woo: selectedClient.fac_nro_woo || null,
      detalles: order.map(item => ({
        art_sec: item.id,
        kar_uni: item.quantity,
        kar_nat:"c",
        kar_pre_pub: precioTypeActual === "detal" && item.price_detal ? item.price_detal : item.price,
        kar_lis_pre_cod: precioTypeActual === "detal" ? 1 : 2,
      })),
    };
    setIsSubmitting(true);
    
    if (isEditing && facNroToEdit) {
      // Modo edición: actualizamos el pedido
      axios.put(`${API_URL}/order/${facNroToEdit}`, payload)
        .then(response => {
          const data = response.data;
          if (data.success) {
            // Usamos el número de cotización del cliente seleccionado ya que es una edición
            const cotizacionNumero = selectedClient.fac_nro;
            Swal.fire({
              icon: 'success',
              title: 'Pedido editado exitosamente',
              html: `<p>Número de pedido: ${cotizacionNumero}</p>
                     <button id="printOrder" class="swal2-styled" style="background-color: #f58ea3; border: none;">Imprimir PDF</button>`,
              showConfirmButton: true,
              confirmButtonText: 'OK',
              confirmButtonColor: '#f58ea3',
              allowOutsideClick: false,
            }).then(() => {
              // Redirigir a la lista de órdenes después de cerrar el modal
              navigate('/orders');
            });

            const container = Swal.getHtmlContainer();
            const printButton = container ? container.querySelector('#printOrder') : null;
            if (printButton) {
              printButton.addEventListener('click', (e) => {
                e.stopPropagation();
                printOrder(cotizacionNumero); // Usamos el número de cotización guardado
              });
            }
            setOrder([]);
            setSelectedClient(null);
            setShowOrderDrawer(false);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al editar el pedido',
              text: data.message || 'Ocurrió un error al editar el pedido',
              confirmButtonColor: '#f58ea3',
            });
          }
        })
        .catch(error => {
          console.error("Error al editar el pedido:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al editar el pedido, por favor intente nuevamente.',
            confirmButtonColor: '#f58ea3',
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      // Crear cotización (pedido)
      axios.post(`${API_URL}/order`, payload)
      .then(response => {
        const data = response.data;
        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Orden creada exitosamente',
            html: `<p>Número de orden: ${data.fac_nro}</p>
                   <button id="printOrder" class="swal2-styled" style="background-color: #f58ea3; border: none;">Imprimir PDF</button>`,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#f58ea3',
            allowOutsideClick: false,
          }).then(() => {});
          const container = Swal.getHtmlContainer();
          const printButton = container ? container.querySelector('#printOrder') : null;
          if (printButton) {
            printButton.addEventListener('click', (e) => {
              e.stopPropagation();
              printOrder(data.fac_nro);
            });
          }
          setOrder([]);
          setSelectedClient(null);
          setShowOrderDrawer(false);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al crear la orden',
            text: data.message,
            confirmButtonColor: '#f58ea3',
          });
        }
      })
      .catch(error => {
        console.error("Error al crear la orden:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al crear la orden, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    }
  };

  // Nueva función para facturar el pedido.
  // Utiliza el mismo flujo de validación que handlePlaceOrder, pero al construir el payload:
  // - fac_tip_cod se establece en "VTA"
  // - En cada detalle se añade kar_nat: "-"
  const handleFacturarOrder = () => {
    if (order.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe agregar al menos un artículo al pedido.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }
    if (!selectedClient) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar un cliente para el pedido.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }

    const fac_usu_cod = localStorage.getItem('user_pretty');
    if (!fac_usu_cod) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el código de usuario. Por favor, inicie sesión nuevamente.',
        confirmButtonColor: '#f58ea3',
      });
      return;
    }

    const payload = {
      nit_sec: selectedClient.nit_sec,
      fac_usu_cod_cre: fac_usu_cod,
      fac_tip_cod: "VTA",
      fac_est_fac: "A",
      descuento: discountPercent,
      fac_descuento_general: descuentoEventoFinal,
      lis_pre_cod: precioTypeActual === "detal" ? 1 : 2,
      fac_nro_woo: selectedClient.fac_nro_woo || null,
      detalles: order.map(item => ({
        art_sec: item.id,
        kar_uni: item.quantity,
        kar_pre_pub: precioTypeActual === "detal" && item.price_detal ? item.price_detal : item.price,
        kar_lis_pre_cod: precioTypeActual === "detal" ? 1 : 2,
        kar_nat: "-",
        kar_kar_sec_ori: item.kar_sec || null,
        kar_fac_sec_ori: item.fac_sec || null
      })),
    };

    setIsSubmitting(true);

    // Si estamos en modo edición y es una factura
    if (isEditing && orderType === "VTA") {
      axios.get(`${API_URL}/order/${selectedClient.fac_nro}`, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      })
      .then(getResponse => {
        if (getResponse.data.success) {
          const currentOrderData = getResponse.data.order;
          
          // Crear un mapa de los detalles actuales para acceder fácilmente a los valores originales
          const detailsMap = {};
          currentOrderData.details.forEach(detail => {
            detailsMap[detail.art_sec] = {
              kar_kar_sec_ori: detail.kar_kar_sec_ori,
              kar_fac_sec_ori: detail.kar_fac_sec_ori
            };
          });
          
          // Ahora modificamos el payload para mantener los valores originales
          const preservedPayload = {
            ...payload,
            detalles: payload.detalles.map(item => {
              const originalDetail = detailsMap[item.art_sec];
              return {
                ...item,
                kar_kar_sec_ori: originalDetail ? originalDetail.kar_kar_sec_ori : item.kar_kar_sec_ori,
                kar_fac_sec_ori: originalDetail ? originalDetail.kar_fac_sec_ori : item.kar_fac_sec_ori
              };
            })
          };
          
          return axios.put(`${API_URL}/order/${selectedClient.fac_nro}`, preservedPayload);
        } else {
          throw new Error("No se pudo obtener la información actual de la factura");
        }
      })
      .then(putResponse => {
        const data = putResponse.data;
        if (data.success) {
          const facturaNumero = selectedClient.fac_nro;
          Swal.fire({
            icon: 'success',
            title: 'Factura actualizada exitosamente',
            html: `<p>Número de factura: ${facturaNumero}</p>
                   <button id="printOrder" class="swal2-styled" style="background-color: #f58ea3; border: none;">Imprimir PDF</button>`,
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#f58ea3',
            allowOutsideClick: false,
          }).then(() => {
            navigate('/orders');
          });

          const container = Swal.getHtmlContainer();
          const printButton = container ? container.querySelector('#printOrder') : null;
          if (printButton) {
            printButton.addEventListener('click', (e) => {
              e.stopPropagation();
              printOrder(facturaNumero);
            });
          }
          setOrder([]);
          setSelectedClient(null);
          setShowOrderDrawer(false);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar la factura',
            text: data.message || 'Ocurrió un error al actualizar la factura',
            confirmButtonColor: '#f58ea3',
          });
        }
      })
      .catch(error => {
        console.error("Error al actualizar la factura:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al actualizar la factura, por favor intente nuevamente.',
          confirmButtonColor: '#f58ea3',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    } else {
      // Crear nueva factura
      axios.post(`${API_URL}/order`, payload)
        .then(response => {
          const data = response.data;
          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Factura creada exitosamente',
              html: `<p>Número de factura: ${data.fac_nro}</p>
                     <button id="printOrder" class="swal2-styled" style="background-color: #f58ea3; border: none;">Imprimir PDF</button>`,
              showConfirmButton: true,
              confirmButtonText: 'OK',
              confirmButtonColor: '#f58ea3',
              allowOutsideClick: false,
            }).then(() => {});
            const container = Swal.getHtmlContainer();
            const printButton = container ? container.querySelector('#printOrder') : null;
            if (printButton) {
              printButton.addEventListener('click', (e) => {
                e.stopPropagation();
                printOrder(data.fac_nro);
              });
            }
            setOrder([]);
            setSelectedClient(null);
            setShowOrderDrawer(false);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error al crear la factura',
              text: data.message,
              confirmButtonColor: '#f58ea3',
            });
          }
        })
        .catch(error => {
          console.error("Error al crear la factura:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al crear la factura, por favor intente nuevamente.',
            confirmButtonColor: '#f58ea3',
          });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    }
  };

  const handleProductUpdate = (productId, updates) => {
    if (setProducts) {
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, ...updates }
            : product
        )
      );
    }
  };

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
    if (selectedCategory) {
      setIsLoadingSubcategories(true);
      axios.get(`${API_URL}/subcategorias`, { params: { inv_gru_cod: selectedCategory } })
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
      setSelectedSubcategory("");
    }
  }, [selectedCategory]);

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
      <div className="h-screen bg-[#fff9e9] flex flex-col md:flex-row">
        <section
          ref={containerRef}
          onScroll={handleScroll}
          className="w-full md:w-2/3 p-6 overflow-y-auto"
        >
          <Header title="Pedidos Pretty" />
          <PromocionBanner evento={eventoPromocional} />
          <Filters
            filterCodigo={filterCodigo}
            setFilterCodigo={setFilterCodigo}
            filterNombre={filterNombre}
            setFilterNombre={setFilterNombre}
            filterExistencia={filterExistencia}
            setFilterExistencia={setFilterExistencia}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={setSelectedSubcategory}
            onSearch={() => fetchProducts(1)}
          />
          
          <ProductsGrid 
            products={products} 
            onAdd={addToOrder} 
            isLoading={isLoading} 
            order={order}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onProductUpdate={handleProductUpdate}
          />
        </section>

        {/* Panel fijo para Desktop */}
        <aside className="hidden md:flex md:flex-col w-full md:w-1/3 bg-white rounded-l-lg shadow-lg">
          {/* Header del Resumen - Fijo */}
          <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] p-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-center text-white">Resumen de Pedido</h2>
            {isEditing && order.length > 0 && (
              <p className="text-center text-sm text-white mt-2 bg-white/20 px-3 py-1 rounded-full inline-block">
                Editando Pedido: {selectedClient.fac_nro || "N/A"}
              </p>
            )}
          </div>

          {/* Contenido del Resumen - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex gap-3">
                <button 
                  onClick={handleNewOrder}
                  className="w-1/2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Pedido
                </button>
                <button 
                  onClick={() => navigate('/orders')}
                  className="w-1/2 bg-[#f58ea3] text-white px-4 py-2.5 rounded-lg hover:bg-[#f7b3c2] transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Volver
                </button>
              </div>

              <OrderSummary 
                order={order} 
                onRemove={removeFromOrder} 
                onAdd={addToOrder} 
                totalValue={totalValue} 
                selectedPriceType={precioTypeActual}
                discountValue={discountValue}
                facDescuentoGeneral={descuentoEventoFinal}
                porcentajeDescuentoEvento={porcentajeDescuentoEvento}
                finalTotal={finalTotal}
                montoMayorista={montoMayorista}
              />

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Precio
                    {isPriceTypeDisabled && (
                      <span className="ml-2 text-xs text-orange-600 font-normal">
                        (Automático según umbral mayorista)
                      </span>
                    )}
                  </label>
                  <select
                    value={precioTypeActual}
                    onChange={(e) => setSelectedPriceType(e.target.value)}
                    disabled={isPriceTypeDisabled}
                    className={`w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200 ${
                      isPriceTypeDisabled ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''
                    }`}
                  >
                    <option value="mayor">Precios al Mayor</option>
                    <option value="detal">Precios al Detal</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descuento (%)
                  </label>
                  <input
                    type="number"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-3">Cliente</p>
                {selectedClient ? (
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <p className="font-medium text-gray-900">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                      <p className="text-sm text-gray-500">{selectedClient.nit_ide}</p>
                      <p className="text-sm text-gray-500">{selectedClient.nit_tel}</p>
                      <p className="text-sm text-gray-500">{selectedClient.nit_dir}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowClientModal(true)} 
                        className="flex-1 bg-[#f58ea3] text-white py-2 rounded-lg hover:bg-[#f7b3c2] transition-all duration-200 text-sm font-medium"
                      >
                        Cambiar Cliente
                      </button>
                      <button 
                        onClick={() => setShowCreateClientModal(true)} 
                        className="flex-1 bg-white border border-[#f58ea3] text-[#f58ea3] py-2 rounded-lg hover:bg-[#f58ea3] hover:text-white transition-all duration-200 text-sm font-medium"
                      >
                        Crear Cliente
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button 
                      onClick={() => setShowClientModal(true)} 
                      className="w-full bg-[#f58ea3] text-white py-2.5 rounded-lg hover:bg-[#f7b3c2] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Seleccionar Cliente
                    </button>
                    <button 
                      onClick={() => setShowCreateClientModal(true)} 
                      className="w-full bg-white border border-[#f58ea3] text-[#f58ea3] py-2.5 rounded-lg hover:bg-[#f58ea3] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear Cliente
                    </button>
                  </div>
                )}
              </div>
              
              {/* Sección de botones para realizar pedido y facturar */}
              <div className="space-y-3">
                <button 
                  onClick={handlePlaceOrder}
                  disabled={isEditing && orderType === "VTA"}
                  className={`w-full px-4 py-3 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    isEditing && orderType === "VTA" 
                      ? "bg-gray-300 cursor-not-allowed" 
                      : "bg-[#f58ea3] text-white hover:bg-[#f7b3c2]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {isEditing ? "Editar Pedido" : "Realizar Pedido"}
                </button>
                <button
                  onClick={handleFacturarOrder}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isEditing && orderType === "VTA" ? "Editar Factura" : "Facturar"}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Botón fijo para Mobile */}
        <button
          onClick={() => setShowOrderDrawer(true)}
          className="fixed bottom-4 left-4 z-80 md:hidden bg-[#f58ea3] text-white p-4 rounded-full shadow-lg hover:bg-[#f7b3c2] transition-all duration-200"
        >
          <FaShoppingCart className="w-6 h-6" />
          {order.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {order.length}
            </span>
          )}
        </button>

        {showOrderDrawer && (
          <OrderDrawer
            order={order}
            onRemove={removeFromOrder}
            onAdd={addToOrder}
            totalValue={totalValue}
            onClose={() => setShowOrderDrawer(false)}
            selectedClient={selectedClient}
            onShowClientModal={() => setShowClientModal(true)}
            onCreateClient={() => setShowCreateClientModal(true)}
            onPlaceOrder={handlePlaceOrder}
            onFacturarOrder={handleFacturarOrder}
            selectedPriceType={precioTypeActual}
            onPriceTypeChange={(e) => setSelectedPriceType(e.target.value)}
            isPriceTypeDisabled={isPriceTypeDisabled}
            hayEventoActivo={hayEventoActivo}
            discountPercent={discountPercent}
            onDiscountChange={(e) => setDiscountPercent(Number(e.target.value))}
            facDescuentoGeneral={descuentoEventoFinal}
            porcentajeDescuentoEvento={porcentajeDescuentoEvento}
            discountValue={discountValue}
            finalTotal={finalTotal}
            montoMayorista={montoMayorista}
            isEditing={isEditing}
            orderType={orderType}
          />
        )}

        {showClientModal && (
          <ClientModal
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            clientResults={clientResults}
            onSelectClient={(client) => {
              if (isEditing && selectedClient?.fac_nro) {
                setSelectedClient({
                  ...client,
                  fac_nro: selectedClient.fac_nro,
                  fac_nro_woo: selectedClient.fac_nro_woo,
                });
              } else {
                setSelectedClient(client);
              }
              setShowClientModal(false);
            }}
            onClose={() => setShowClientModal(false)}
            onSearchClients={(page) => fetchClients(clientSearch, page)}
          />
        )}

        {showCreateClientModal && (
          <CreateClientModal
            onClose={() => setShowCreateClientModal(false)}
            onClientCreated={(newClientData) => {
              if (isEditing && selectedClient?.fac_nro) {
                setSelectedClient({
                  ...newClientData,
                  fac_nro: selectedClient.fac_nro,
                  fac_nro_woo: selectedClient.fac_nro_woo,
                });
              } else {
                setSelectedClient(newClientData);
              }
              setShowCreateClientModal(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default POS;
