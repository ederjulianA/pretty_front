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
import { formatValue } from './utils';
import { FaShoppingCart } from 'react-icons/fa';
import usePrintOrder from './hooks/usePrintOrder';

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

  // Estado para mostrar el drawer del resumen en mobile
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);

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

  const totalValue = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
  const [scrollLeft, setScrollLeft] = useState(0);

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
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  const handlePointerUp = () => setIsDragging(false);
  const handlePointerCancel = () => setIsDragging(false);

  // Función para realizar el pedido, ahora usando SweetAlert2
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
      fac_usu_cod_cre : fac_usu_cod,
      fac_tip_cod: "COT",
      detalles: order.map(item => ({
        art_sec: item.id,
        kar_uni: item.quantity,
        kar_pre_pub: item.price,
      })),
    };
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
          }).then((result) => {
            // Cuando el usuario presione OK, no se hace nada extra.
          });
          // Agregar el listener para el botón de imprimir PDF
          const printButton = Swal.getHtmlContainer()?.querySelector('#printOrder');
          if (printButton) {
            printButton.addEventListener('click', (e) => {
              e.stopPropagation();
              printOrder(data.fac_nro);
            });
          }
          // Limpiar el pedido y el cliente seleccionado para iniciar una nueva orden
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
      });
  };

  return (
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
        <OrderSummary order={order} onRemove={removeFromOrder} onAdd={addToOrder} totalValue={totalValue} />
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
  );
};

export default POS;
