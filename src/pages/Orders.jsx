// src/pages/Orders.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderDetailModal from '../components/OrderDetailModal';
import { useNavigate } from 'react-router-dom';

const Orders = () => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  // Estados para filtros
  const [fechaDesde, setFechaDesde] = useState(today);
  const [fechaHasta, setFechaHasta] = useState(today);
  const [nitIde, setNitIde] = useState('');
  const [nitNom, setNitNom] = useState('');
  const [facNro, setFacNro] = useState('');
  const [facEstFac, setFacEstFac] = useState('A');
  // Nuevo filtro: Tipo de documento (fue_cod)
  const [fueCod, setFueCod] = useState('4'); // Por defecto: COTIZACIONES (fue_cod = 4)

  // Estados para datos y paginación
  const [orders, setOrders] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para modal de detalle de pedido
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Referencias para scroll infinito
  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);

  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ordenes`, {
        params: {
          FechaDesde: fechaDesde,
          FechaHasta: fechaHasta,
          nit_ide: nitIde,
          nit_nom: nitNom,
          fac_nro: facNro,
          fac_est_fac: facEstFac,
          fue_cod: fueCod, // Se envía el filtro de tipo de documento
          PageNumber: page,
          PageSize: pageSize,
        },
      });
      if (response.data.success) {
        const newOrders = response.data.ordenes;
        if (page === 1) {
          setOrders(newOrders);
        } else {
          setOrders(prev => [...prev, ...newOrders]);
        }
        setHasMore(newOrders.length >= pageSize);
        setPageNumber(page);
      }
    } catch (error) {
      console.error("Error al obtener órdenes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setOrders([]);
    setPageNumber(1);
    setHasMore(true);
    fetchOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaDesde, fechaHasta, nitIde, nitNom, facNro, facEstFac, fueCod]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchOrders(pageNumber + 1);
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [hasMore, isLoading, pageNumber]);

  // Acciones para editar pedido: redirigir a la pantalla POS con el número de pedido en query string
  const handleEditOrder = (order) => {
    navigate(`/pos?fac_nro=${order.fac_nro}`);
  };

  // Acción para visualizar detalle: abrir modal con la información del pedido
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Panel superior: Título, filtros y botón "Agregar nuevo" */}
      <div className="p-4 bg-white shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Listado de Órdenes</h2>
          <button
            onClick={() => navigate('/pos')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          >
            Agregar nuevo
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Fecha Inicial</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)} 
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Fecha Final</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)} 
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Estado Pedido</label>
            <select 
              value={facEstFac} 
              onChange={e => setFacEstFac(e.target.value)} 
              className="w-full p-2 border rounded"
            >
              <option value="A">Activo</option>
              <option value="P">Pendiente</option>
              <option value="I">Inactivo</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Tipo de documento</label>
            <select
              value={fueCod}
              onChange={e => setFueCod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="4">COTIZACIONES</option>
              <option value="1">FACTURAS</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Identificación Cliente</label>
            <input 
              type="text" 
              value={nitIde} 
              onChange={e => setNitIde(e.target.value)} 
              placeholder="Ingrese identificación"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Nombre Cliente</label>
            <input 
              type="text" 
              value={nitNom} 
              onChange={e => setNitNom(e.target.value)} 
              placeholder="Ingrese nombre"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1"># Pedido</label>
            <input 
              type="text" 
              value={facNro} 
              onChange={e => setFacNro(e.target.value)} 
              placeholder="Ingrese número de pedido"
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => fetchOrders(1)}
            className="bg-[#f58ea3] text-white px-4 py-2 rounded hover:bg-[#a5762f] transition cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>
      
      {/* Listado de órdenes */}
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orders.map((order, index) => {
  const isFacturado = order.documentos && order.documentos !== "";
  return (
    <div key={index} className="bg-white p-4 rounded-lg shadow cursor-pointer">
      <OrderCard order={order} onClick={() => console.log(order)} />
      <div className="mt-2 flex justify-between">
        <button 
          onClick={() => !isFacturado && handleEditOrder(order)}
          disabled={isFacturado}
          className={`px-3 py-1 rounded text-xs transition ${
            isFacturado 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 cursor-pointer text-white"
          }`}
        >
          {fueCod === "4" ? "Editar Cotizaciones" : "Editar Factura"}
        </button>
        <button 
          onClick={() => handleViewDetail(order)}
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition cursor-pointer text-xs"
        >
          Visualizar Detalle
        </button>
      </div>
    </div>
  );
})}

        </div>
        {/* Sentinel para el IntersectionObserver */}
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isLoading && <LoadingSpinner />}
        </div>
      </div>
      
      {/* Modal para visualizar detalle */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default Orders;
