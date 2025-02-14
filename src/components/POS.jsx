import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPlus, FaMinus, FaSearch } from 'react-icons/fa';

// Función para formatear números sin decimales y con separador de miles
const formatValue = (value) =>
  new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// Función para formatear el nombre: primer letra en mayúscula y el resto en minúscula
const formatName = (name) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

const POS = () => {
  // Estados para la orden y productos
  const [order, setOrder] = useState([]);
  const [products, setProducts] = useState([]);

  // Estado para las categorías obtenidas del API y para la categoría seleccionada
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("todas");

  // Estados para los filtros de productos
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const [filterExistencia, setFilterExistencia] = useState('');

  // Estados para la paginación (scroll infinito) de productos
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Referencia para el contenedor de productos (scroll vertical)
  const containerRef = useRef(null);
  // Referencia y estados para el contenedor de categorías (scroll horizontal "drag")
  const categoriesRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Estados para la selección de cliente
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  // Estados para la paginación de clientes
  const [clientPageNumber, setClientPageNumber] = useState(1);
  const clientPageSize = 10;

  // Función para consumir el API de productos (artículos) con paginación y filtros
  // Se envía el parámetro inv_gru_cod si la categoría seleccionada es distinta de "todas"
  const fetchProducts = (page = 1) => {
    setIsLoading(true);
    axios
      .get('http://192.168.1.7:3000/api/articulos', {
        params: {
          codigo: filterCodigo,
          nombre: filterNombre,
          tieneExistencia: filterExistencia,
          pageNumber: page,
          pageSize: pageSize,
          ...(selectedCategory !== "todas" && { inv_gru_cod: selectedCategory }),
        },
      })
      .then((response) => {
        const data = response.data;
        if (data.success) {
          const mappedProducts = data.articulos.map((articulo) => ({
            id: articulo.art_cod,
            name: articulo.art_nom,
            price: articulo.precio_detal,
            // Combina categoría y subcategoría (ajusta según lo requieras)
            category: articulo.categoria + " - " + articulo.sub_categoria,
            existencia: articulo.existencia,
          }));
          if (page === 1) {
            setProducts(mappedProducts);
          } else {
            setProducts((prev) => [...prev, ...mappedProducts]);
          }
          setHasMore(mappedProducts.length >= pageSize);
          setPageNumber(page);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener productos:', error);
        setIsLoading(false);
      });
  };

  // Función para consumir el API de categorías
  const fetchCategories = () => {
    axios
      .get('http://192.168.1.7:3000/api/categorias')
      .then((response) => {
        const data = response.data;
        if (data.success && data.result && data.result.data) {
          const mappedCategories = data.result.data.map((cat) => ({
            id: cat.inv_gru_cod,
            name: cat.inv_gru_nom,
          }));
          setCategories([{ id: "todas", name: "Todas" }, ...mappedCategories]);
        }
      })
      .catch((error) => console.error('Error al obtener categorías:', error));
  };

  // Función para consumir el API de clientes (nits) con búsqueda y paginación
  const fetchClients = (page = 1) => {
    axios
      .get('http://192.168.1.7:3000/api/nits', {
        params: {
          nit_nom: clientSearch,
          pageNumber: page,
          pageSize: clientPageSize,
        },
      })
      .then((response) => {
        const data = response.data;
        if (data.success /*&& data.nits && data.nits.data*/) {
          setClientResults(data.nits);
          setClientPageNumber(page);
        }
      })
      .catch((error) => console.error('Error al obtener clientes:', error));
  };

  // Cargar productos y categorías al montar el componente
  useEffect(() => {
    fetchProducts(1);
    fetchCategories();
  }, []);

  // Cuando cambie la categoría seleccionada, se reinicia la búsqueda de productos
  useEffect(() => {
    setProducts([]);
    setPageNumber(1);
    setHasMore(true);
    fetchProducts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Función para manejar el scroll infinito en la sección de productos
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMore) {
      fetchProducts(pageNumber + 1);
    }
  };

  // Función para reiniciar la búsqueda (por botón de búsqueda)
  const handleSearch = () => {
    setProducts([]);
    setPageNumber(1);
    setHasMore(true);
    fetchProducts(1);
  };

  // Funciones para el "drag" horizontal en el listado de categorías
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeft(categoriesRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - categoriesRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    categoriesRef.current.scrollLeft = scrollLeft - walk;
  };

  // Función para agregar producto a la orden (controla existencia y stock)
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

  // Función para quitar producto de la orden
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

  return (
    <div className="h-screen bg-[#fff9e9] flex flex-col md:flex-row">
      {/* Sección de productos con scroll interno */}
      <section
        ref={containerRef}
        onScroll={handleScroll}
        className="w-full md:w-2/3 p-6 overflow-y-auto"
      >
        <header className="bg-[#f58ea3] shadow-md p-4 flex items-center justify-between rounded-md cursor-pointer">
          <h1 className="text-xl font-bold text-white">Pedidos Pretty</h1>
        </header>

        {/* Sección de filtros */}
        <div className="mt-4 bg-white rounded-lg shadow p-4 cursor-pointer">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Filtro Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">Código</label>
              <input
                type="text"
                placeholder="Código"
                value={filterCodigo}
                onChange={(e) => setFilterCodigo(e.target.value)}
                className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
              />
            </div>
            {/* Filtro Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">Nombre</label>
              <input
                type="text"
                placeholder="Nombre"
                value={filterNombre}
                onChange={(e) => setFilterNombre(e.target.value)}
                className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
              />
            </div>
            {/* Filtro Existencia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">Existencia</label>
              <select
                value={filterExistencia}
                onChange={(e) => setFilterExistencia(e.target.value)}
                className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
              >
                <option value="">Ninguno</option>
                <option value="1">Con Existencia</option>
                <option value="0">Sin Existencia</option>
              </select>
            </div>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSearch}
              className="h-10 bg-[#f58ea3] text-white px-4 rounded-md flex items-center justify-center hover:bg-[#a5762f] cursor-pointer"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Sección de Categorías (scroll horizontal sin scrollbar y con funcionalidad de arrastre) */}
        <div className="mt-4">
          <h2 className="text-lg font-bold text-gray-800 mb-2">Categorías</h2>
          <div
            ref={categoriesRef}
            className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar select-none cursor-pointer"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            {categories.map((categoria) => (
              <div
                key={categoria.id}
                onClick={() => setSelectedCategory(categoria.id)}
                className={`min-w-[150px] flex-shrink-0 rounded-lg shadow p-4 border transition cursor-pointer text-center ${
                  categoria.id === selectedCategory
                    ? "bg-[#f58ea3] text-white border-transparent"
                    : "bg-white text-gray-700 hover:shadow-lg"
                }`}
              >
                <p className="font-medium">{categoria.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Grilla de productos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => product.existencia > 0 && addToOrder(product)}
              className={`bg-white rounded-lg shadow p-4 transition flex flex-col relative cursor-pointer ${
                product.existencia <= 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-xl"
              }`}
            >
              {/* Badge de existencias */}
              <span
                className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full cursor-pointer ${
                  product.existencia > 0 ? "bg-blue-500 text-white" : "bg-red-500 text-white"
                }`}
              >
                Existencias: {product.existencia > 0 ? product.existencia : "Sin stock"}
              </span>
              <div className="h-24 bg-gray-200 rounded-md flex items-center justify-center mb-2 cursor-pointer">
                <span className="text-gray-500 text-sm">Imagen</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-800 cursor-pointer">
                {formatName(product.name)}
              </h2>
              <p className="text-gray-500 text-sm cursor-pointer">{product.category}</p>
              <p className="text-[#f58ea3] font-bold mt-auto cursor-pointer">
                ${formatValue(product.price)}
              </p>
            </div>
          ))}
          {isLoading && (
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-4 cursor-pointer">
              <span className="text-gray-500">Cargando...</span>
            </div>
          )}
        </div>
      </section>

      {/* Panel fijo: Resumen de Pedidos y Selección de Cliente */}
      <aside className="w-full md:w-1/3 bg-white rounded-l-lg shadow p-6 md:sticky md:top-0 cursor-pointer">
        {/* Resumen de Pedidos */}
        <div className="bg-[#a5762f] p-4 rounded-md mb-4 cursor-pointer">
          <h2 className="text-xl font-bold text-center text-white cursor-pointer">Resumen de Pedidos</h2>
        </div>
        {order.length === 0 ? (
          <p className="text-gray-500 cursor-pointer">No se han seleccionado artículos.</p>
        ) : (
          <ul className="divide-y divide-gray-200 cursor-pointer">
            {order.map((item) => (
              <li key={item.id} className="py-2 flex justify-between items-center cursor-pointer">
                <div className="cursor-pointer">
                  <p className="font-semibold text-gray-700 cursor-pointer">{formatName(item.name)}</p>
                  <p className="text-sm text-gray-500 cursor-pointer">
                    Cant: {item.quantity} x ${formatValue(item.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2 cursor-pointer">
                  <button
                    onClick={() => removeFromOrder(item.id)}
                    className="bg-[#f7b3c2] text-white p-2 rounded-full hover:bg-[#a5762f] cursor-pointer"
                  >
                    <FaMinus />
                  </button>
                  <span className="font-bold text-gray-800 cursor-pointer">
                    ${formatValue(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => addToOrder(item)}
                    disabled={item.quantity >= item.existencia}
                    className={`bg-[#f7b3c2] text-white p-2 rounded-full transition cursor-pointer ${
                      item.quantity >= item.existencia
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-[#a5762f]"
                    }`}
                  >
                    <FaPlus />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Sección de selección de cliente (colocada antes del botón Realizar Pedido) */}
        <div className="mb-4 p-4 border rounded-lg cursor-pointer">
          <p className="text-sm text-gray-600 mb-1 cursor-pointer">Cliente:</p>
          {selectedClient ? (
            <div className="flex justify-between items-center cursor-pointer">
              <div className="cursor-pointer">
                <p className="font-medium cursor-pointer">{selectedClient.nit_nom.trim() || "Sin nombre"}</p>
                <p className="text-xs text-gray-500 cursor-pointer">{selectedClient.nit_ide}</p>
              </div>
              <button
                onClick={() => setShowClientModal(true)}
                className="text-blue-600 underline text-sm cursor-pointer"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClientModal(true)}
              className="w-full bg-blue-500 text-white py-2 rounded-md cursor-pointer"
            >
              Seleccionar Cliente
            </button>
          )}
        </div>

        {/* Total y botón Realizar Pedido */}
        <div className="mt-6 border-t pt-4 cursor-pointer">
          <p className="text-lg font-bold text-gray-800 cursor-pointer">
            Total: ${formatValue(totalValue)}
          </p>
          <button className="w-full bg-[#f58ea3] text-white px-4 py-2 rounded-md shadow-lg hover:bg-[#a5762f] mt-4 cursor-pointer">
            Realizar Pedido
          </button>
        </div>
      </aside>

      {/* Modal de Clientes */}
      {showClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
          <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 cursor-pointer">
            <div className="flex justify-between items-center mb-4 cursor-pointer">
              <h3 className="text-xl font-bold cursor-pointer">Seleccionar Cliente</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="text-gray-600 text-2xl cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o identificación"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full p-2 border rounded cursor-pointer"
              />
              <button
                onClick={() => fetchClients(1)}
                className="mt-2 w-full bg-[#f58ea3] text-white py-2 rounded cursor-pointer"
              >
                Buscar
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto cursor-pointer">
              {clientResults.length === 0 ? (
                <p className="text-gray-500 cursor-pointer">No se encontraron clientes.</p>
              ) : (
                <ul className="divide-y divide-gray-200 cursor-pointer">
                  {clientResults.map((client) => (
                    <li
                      key={client.nit_sec}
                      onClick={() => {
                        setSelectedClient(client);
                        setShowClientModal(false);
                      }}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                      <p className="font-medium cursor-pointer">
                        {client.nit_nom.trim() || "Sin nombre"} - {client.nit_ide}
                      </p>
                      <p className="text-sm text-gray-500 cursor-pointer">
                        {client.nit_tel} {client.nit_email}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
