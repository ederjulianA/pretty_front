// src/POS.jsx
import React, { useState, useEffect, useRef } from 'react';
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
import { FaShoppingCart } from 'react-icons/fa';
import usePrintOrder from './hooks/usePrintOrder';
import LoadingSpinner from './components/LoadingSpinner';
import CreateClientModal from './components/CreateClientModal';

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
  const [selectedCategory, setSelectedCategory] = useState("todas");

  // Price type and discount
  const [selectedPriceType, setSelectedPriceType] = useState("mayor");
  const [discountPercent, setDiscountPercent] = useState(0);

  // Order drawer for mobile
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  // Submitting overlay state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for scroll
  const containerRef = useRef(null);
  const categoriesRef = useRef(null);

  // Custom hooks for products and categories
  const { products, fetchProducts, pageNumber, hasMore, isLoading } = useProducts(
    { filterCodigo, filterNombre, filterExistencia },
    selectedCategory
  );
  const { categories } = useCategories();
  const { clientResults, fetchClients } = useClients();
  const { pedidoMinimo, isLoading: isLoadingPedidoMinimo } = usePedidoMinimo();

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
          // Map details to order items
          const mergedDetails = orderData.details.map(item => {
            console.log("Item original:", item); // Para debugging
            return {
              id: item.art_sec,
              name: item.art_nom,
              price: item.precio_mayor,
              price_detal: item.precio_detal,
              quantity: item.kar_uni,
              existencia: item.existencia || 1,
              kar_des_uno: item.kar_des_uno || 0,
              kar_sec: item.kar_sec,
              fac_sec: item.fac_sec
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
  const totalValue = selectedPriceType === "detal" ? retailTotal : wholesaleTotal;
  const discountValue = totalValue * (discountPercent / 100);
  const finalTotal = totalValue - discountValue;

  // Scroll infinite for products grid
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMore) {
      fetchProducts(pageNumber + 1);
    }
  };

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
    
    const payload = {
      nit_sec: selectedClient.nit_sec,
      fac_usu_cod_cre: fac_usu_cod,
      fac_tip_cod: "COT",
      fac_est_fac: "A",
      descuento: discountPercent,
      lis_pre_cod: selectedPriceType === "detal" ? 1 : 2,
      fac_nro_woo: selectedClient.fac_nro_woo || null,
      detalles: order.map(item => ({
        art_sec: item.id,
        kar_uni: item.quantity,
        kar_nat:"c",
        kar_pre_pub: selectedPriceType === "detal" && item.price_detal ? item.price_detal : item.price,
        kar_lis_pre_cod: selectedPriceType === "detal" ? 1 : 2,
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

    console.log("Orden actual:", order);
    console.log("Cliente seleccionado:", selectedClient);

    const fac_usu_cod = localStorage.getItem('user_pretty');
    const payload = {
      nit_sec: selectedClient.nit_sec,
      fac_usu_cod_cre: fac_usu_cod,
      fac_tip_cod: "VTA",
      fac_est_fac: "A",
      descuento: discountPercent,
      lis_pre_cod: selectedPriceType === "detal" ? 1 : 2,
      fac_nro_woo: selectedClient.fac_nro_woo || null,
      detalles: order.map(item => {
        // Para debugging, imprimir cada item individualmente
        console.log("Detalle del item:", item);
        
        return {
          art_sec: item.id,
          kar_uni: item.quantity,
          kar_pre_pub: selectedPriceType === "detal" && item.price_detal ? item.price_detal : item.price,
          kar_lis_pre_cod: selectedPriceType === "detal" ? 1 : 2,
          kar_nat: "-",
          kar_kar_sec_ori: item.kar_sec || null,
          kar_fac_sec_ori: item.fac_sec || null
        };
      }),
    };

    // Log para verificar el payload completo
    console.log("Payload a enviar:", payload);
    console.log("Detalles de payload:", payload.detalles);

    setIsSubmitting(true);

    // Si estamos en modo edición y es una factura
    if (isEditing && orderType === "VTA") {
      // Aquí necesitamos preservar los campos originales kar_kar_sec_ori y kar_fac_sec_ori
      // Crear una copia del payload donde mantenemos estos campos iguales
      
      // Primero, hacemos un GET para obtener los datos actuales de la factura
      axios.get(`${API_URL}/order/${selectedClient.fac_nro}`, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      })
      .then(getResponse => {
        if (getResponse.data.success) {
          const currentOrderData = getResponse.data.order;
          console.log("Datos actuales de la factura:", currentOrderData);
          
          // Crear un mapa de los detalles actuales para acceder fácilmente a los valores originales
          const detailsMap = {};
          currentOrderData.details.forEach(detail => {
            // Usamos art_sec como clave para mapear los detalles actuales
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
                // Si existe el detalle original, usamos sus valores, si no, usamos los actuales
                kar_kar_sec_ori: originalDetail ? originalDetail.kar_kar_sec_ori : item.kar_kar_sec_ori,
                kar_fac_sec_ori: originalDetail ? originalDetail.kar_fac_sec_ori : item.kar_fac_sec_ori
              };
            })
          };
          
          console.log("Payload con valores originales preservados:", preservedPayload);
          
          // Ahora enviamos el payload modificado
          return axios.put(`${API_URL}/order/${selectedClient.fac_nro}`, preservedPayload);
        } else {
          throw new Error("No se pudo obtener la información actual de la factura");
        }
      })
      .then(putResponse => {
        console.log("Respuesta del servidor (edición):", putResponse.data);
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
          console.log("Respuesta del servidor (creación):", response.data);
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

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
      <div className="h-screen bg-[#fff9e9] flex flex-col md:flex-row">
        <section ref={containerRef} onScroll={handleScroll} className="w-full md:w-2/3 p-6 overflow-y-auto">
          <Header title="Pedidos Pretty" />
          <Filters
            filterCodigo={filterCodigo}
            setFilterCodigo={setFilterCodigo}
            filterNombre={filterNombre}
            setFilterNombre={setFilterNombre}
            filterExistencia={filterExistencia}
            setFilterExistencia={setFilterExistencia}
            onSearch={() => fetchProducts(1)}
          />
          <Categories
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoriesRef={categoriesRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          />
          <ProductsGrid products={products} onAdd={addToOrder} isLoading={isLoading} order={order} />
        </section>

        {/* Panel fijo para Desktop */}
        <aside className="hidden md:block w-full md:w-1/3 bg-white rounded-l-lg shadow p-6">
        <div className="mb-4 flex gap-2">
          <button 
            onClick={handleNewOrder}
            className="w-1/2 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition cursor-pointer"
          >
            Nuevo Pedido
          </button>
          <button 
            onClick={() => navigate('/orders')}
            className="w-1/2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition cursor-pointer"
          >
            Volver a órdenes
          </button>
        </div>
          <div className="bg-[#a5762f] p-4 rounded-md mb-4">
            <h2 className="text-xl font-bold text-center text-white">Resumen de Pedido</h2>
            {isEditing && order.length > 0 && (
              <p className="text-center text-sm text-white mt-2">
                Editando Pedido: {selectedClient.fac_nro || "N/A"}
              </p>
            )}
          </div>
          <OrderSummary 
            order={order} 
            onRemove={removeFromOrder} 
            onAdd={addToOrder} 
            totalValue={totalValue} 
            selectedPriceType={selectedPriceType}
            discountValue={discountValue}
            finalTotal={finalTotal}
          />
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">
              Seleccione tipo de precio:
            </label>
            <select
              value={selectedPriceType}
              onChange={(e) => setSelectedPriceType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="mayor">Precios al Mayor</option>
              <option value="detal">Precios al Detal</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">
              Descuento (%):
            </label>
            <input
              type="number"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4 p-4 border rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Cliente:</p>
            {selectedClient ? (
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_ide}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_tel}</p>
                  <p className="text-xs text-gray-500">{selectedClient.nit_dir}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => setShowClientModal(true)} className="text-blue-600 underline text-sm">
                    Cambiar
                  </button>
                  <button onClick={() => setShowCreateClientModal(true)} className="text-blue-600 underline text-sm">
                    Crear Cliente
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <button onClick={() => setShowClientModal(true)} className="w-full bg-[#f7b3c2] text-white py-2 rounded">
                  Seleccionar Cliente
                </button>
                <button onClick={() => setShowCreateClientModal(true)} className="w-full bg-[#f58ea3] text-white py-2 rounded">
                  Crear Cliente
                </button>
              </div>
            )}
          </div>
          
          {/* Sección de botones para realizar pedido y facturar */}
          <div className="mt-6 border-t pt-4 flex gap-2">
            <button 
              onClick={handlePlaceOrder}
              disabled={isEditing && orderType === "VTA"}
              className={`w-1/2 px-4 py-2 rounded-md shadow-lg ${
                isEditing && orderType === "VTA" 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-[#f58ea3] text-white hover:bg-[#a5762f] cursor-pointer"
              }`}
            >
              {isEditing ? "Editar Pedido" : "Realizar Pedido"}
            </button>
            <button
              onClick={handleFacturarOrder}
              className="w-1/2 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-green-700 cursor-pointer"
            >
              {isEditing && orderType === "VTA" ? "Editar Factura" : "Facturar"}
            </button>
          </div>
        </aside>

        {/* Botón fijo para Mobile */}
        <button
          onClick={() => setShowOrderDrawer(true)}
          className="fixed bottom-4 left-4 z-80 md:hidden bg-[#f58ea3] text-white p-4 rounded-full shadow-lg"
        >
          <FaShoppingCart /> {order.length}
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
            selectedPriceType={selectedPriceType}
            onPriceTypeChange={(e) => setSelectedPriceType(e.target.value)}
            discountPercent={discountPercent}
            onDiscountChange={(e) => setDiscountPercent(Number(e.target.value))}
            discountValue={discountValue}
            finalTotal={finalTotal}
          />
        )}

        {showClientModal && (
          <ClientModal
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            clientResults={clientResults}
            onSelectClient={(client) => {
              setSelectedClient(client);
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
              setSelectedClient(newClientData);
              setShowCreateClientModal(false);
            }}
          />
        )}
      </div>
    </>
  );
};

export default POS;
