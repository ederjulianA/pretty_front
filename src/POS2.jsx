// src/POS.js
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { API_URL } from './config';
import Swal from 'sweetalert2';
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

const POS = () => {
  // Persistimos la orden y el cliente seleccionado en localStorage
  const [order, setOrder] = usePersistentState('order', []);
  const [selectedClient, setSelectedClient] = usePersistentState('selectedClient', null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const { printOrder } = usePrintOrder();

  // Estados de filtros para productos y categoría
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [filterExistencia, setFilterExistencia] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("todas");

   // [NUEVO] Estado para seleccionar el tipo de precio a usar en el carrito (mayor o detal)
   const [selectedPriceType, setSelectedPriceType] = useState("mayor");

  // Estado para mostrar el drawer del resumen en mobile
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  // Estado para mostrar el overlay de carga mientras se guarda la orden
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referencias para scroll
  const containerRef = useRef(null);
  const categoriesRef = useRef(null);

  // Usamos los custom hooks
  const { products, fetchProducts, pageNumber, hasMore, isLoading } = useProducts(
    { filterCodigo, filterNombre, filterExistencia },
    selectedCategory
  );
  const { categories } = useCategories();
  const { clientResults, fetchClients } = useClients();

    // Hook para obtener el pedido mínimo
  const { pedidoMinimo, isLoading: isLoadingPedidoMinimo } = usePedidoMinimo();

  // Funciones para agregar y quitar productos de la orden
  const addToOrder = (product) => {
    if (product.existencia <= 0) return;
    setOrder((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        if (exists.quantity >= product.existencia) return prev;
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromOrder = (productId) => {
    setOrder((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };


// [NUEVO] Calcular total usando el precio efectivo para cada ítem
const wholesaleTotal = order.reduce((sum, item) => sum + item.price * item.quantity, 0);
const retailTotal = order.reduce(
  (sum, item) => sum + (item.price_detal || item.price) * item.quantity,
  0
);
const useRetail = selectedPriceType === "detal";
const totalValue = useRetail ? retailTotal : wholesaleTotal;

  // Función para manejar el scroll infinito en la sección de productos
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMore) {
      fetchProducts(pageNumber + 1);
    }
  };

  // Funciones para el drag horizontal en el listado de categorías usando pointer events
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

  // Función para realizar el pedido, ahora mostrando un overlay de carga
  const handlePlaceOrder = () => {
    if (order.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe agregar al menos un artículo al pedido.',
        confirmButtonColor: '#f58ea3',
        cursor: 'pointer',
      });
      return;
    }
    if (!selectedClient) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debe seleccionar un cliente para el pedido.',
        confirmButtonColor: '#f58ea3',
        cursor: 'pointer',
      });
      return;
    }
    const fac_usu_cod = localStorage.getItem('user_pretty');
    const payload = {
      nit_sec: selectedClient.nit_sec,
      fac_usu_cod_cre: fac_usu_cod,
      fac_tip_cod: "COT",
      detalles: order.map(item => ({
        art_sec: item.id,
        kar_uni: item.quantity,
        kar_pre_pub: selectedPriceType === "detal" && item.price_detal ? item.price_detal : item.price,
      })),
    };
    setIsSubmitting(true);
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
          }).then(() => {
            // Acción cuando se cierra el mensaje (si se desea)
          });
          const printButton = Swal.getHtmlContainer()?.querySelector('#printOrder');
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
            cursor: 'pointer',
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
          cursor: 'pointer',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
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
        <aside className="hidden md:block w-full md:w-1/3 bg-white rounded-l-lg shadow p-6 cursor-pointer">

     
            {/* Se pasa selectedPriceType a OrderSummary */}
  <OrderSummary 
    order={order} 
    onRemove={removeFromOrder} 
    onAdd={addToOrder} 
    totalValue={totalValue} 
    selectedPriceType={selectedPriceType} // [NUEVO]
  />
            {/* Información de Pedido Mínimo */}
                   {pedidoMinimo !== null && (
            <p className="text-sm text-gray-700 text-center mb-4 cursor-pointer">
              Pedido Mínimo: ${formatValue(pedidoMinimo)}
            </p>
          )}

        {/* [NUEVO] Combo para elegir el tipo de precio */}
        <div className="mb-4">
        <label className="block text-sm text-gray-700 mb-1 cursor-pointer">
          Seleccione tipo de precio:
        </label>
        <select
          value={selectedPriceType}
          onChange={(e) => setSelectedPriceType(e.target.value)}
          className="w-full p-2 border rounded cursor-pointer"
        >
          <option value="mayor">Precios al Mayor</option>
          <option value="detal">Precios al Detal</option>
        </select>
        </div>

          <div className="mb-4 p-4 border rounded-lg cursor-pointer">
            <p className="text-sm text-gray-600 mb-1 cursor-pointer">Cliente:</p>
            {selectedClient ? (
              <div className="flex justify-between items-center cursor-pointer">
                <div className="cursor-pointer">
                  <p className="font-medium cursor-pointer">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                  <p className="text-xs text-gray-500 cursor-pointer">{selectedClient.nit_ide}</p>
                  <p className="text-xs text-gray-500 cursor-pointer">{selectedClient.nit_tel}</p>
                  <p className="text-xs text-gray-500 cursor-pointer">{selectedClient.nit_dir}</p>
                </div>
                <button onClick={() => setShowClientModal(true)} className="text-blue-600 underline text-sm cursor-pointer">
                  Cambiar
                </button>
              </div>
            ) : (
              <button onClick={() => setShowClientModal(true)} className="w-full bg-[#f7b3c2] text-white py-2 rounded-md cursor-pointer">
                Seleccionar Cliente
              </button>
            )}
          </div>
          <div className="mt-6 border-t pt-4 cursor-pointer">
            <p className="text-lg font-bold text-gray-800 cursor-pointer">Total: ${formatValue(totalValue)}</p>
            <button onClick={handlePlaceOrder} className="w-full bg-[#f58ea3] text-white px-4 py-2 rounded-md shadow-lg hover:bg-[#a5762f] mt-4 cursor-pointer">
              Realizar Pedido
            </button>
          </div>
        </aside>

        {/* Botón fijo para Mobile */}
        <button
          onClick={() => setShowOrderDrawer(true)}
          className="fixed bottom-4 left-4 z-80 md:hidden bg-[#f58ea3] text-white p-4 rounded-full shadow-lg cursor-pointer"
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
          onPlaceOrder={handlePlaceOrder}
          selectedPriceType={selectedPriceType} // [NUEVO]
          onPriceTypeChange={(e) => setSelectedPriceType(e.target.value)} // [NUEVO]
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
      </div>
    </>
  );
};

export default POS;
