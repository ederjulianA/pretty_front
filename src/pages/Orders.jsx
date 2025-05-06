// src/pages/Orders.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import OrderCard from '../components/OrderCard';
import LoadingSpinner from '../components/LoadingSpinner';
import OrderDetailModal from '../components/OrderDetailModal';
import { useNavigate } from 'react-router-dom';
import { formatDate, getCurrentDate } from '../utils/dateUtils';
import usePrintOrder from '../hooks/usePrintOrder';
import { FaPlus, FaEye, FaPrint, FaBroom, FaEdit, FaFileAlt, FaTrash } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import AnularDocumentoModal from '../components/AnularDocumentoModal';

const Orders = () => {
  const navigate = useNavigate();
  const today = getCurrentDate();

  // Función para obtener los filtros guardados
  const getInitialFilters = () => {
    const savedFilters = localStorage.getItem('ordersFilters');
    if (savedFilters) {
      return JSON.parse(savedFilters);
    }
    return {
      fechaDesde: today,
      fechaHasta: today,
      nitIde: '',
      nitNom: '',
      facNro: '',
      facNroWoo: '',
      facEstFac: 'A',
      fueCod: '4'
    };
  };

  // Inicializar estados con los filtros guardados
  const [fechaDesde, setFechaDesde] = useState(getInitialFilters().fechaDesde);
  const [fechaHasta, setFechaHasta] = useState(getInitialFilters().fechaHasta);
  const [nitIde, setNitIde] = useState(getInitialFilters().nitIde);
  const [nitNom, setNitNom] = useState(getInitialFilters().nitNom);
  const [facNro, setFacNro] = useState(getInitialFilters().facNro);
  const [facNroWoo, setFacNroWoo] = useState(getInitialFilters().facNroWoo);
  const [facEstFac, setFacEstFac] = useState(getInitialFilters().facEstFac);
  const [fueCod, setFueCod] = useState(getInitialFilters().fueCod);

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

  // Agregar el hook de impresión
  const { printOrder } = usePrintOrder();

  const [showAnularModal, setShowAnularModal] = useState(false);

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
          fac_nro_woo: facNroWoo,
          fac_est_fac: facEstFac,
          fue_cod: fueCod,
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

  // Función para guardar filtros
  const saveFilters = useCallback(() => {
    const filters = {
      fechaDesde,
      fechaHasta,
      nitIde,
      nitNom,
      facNro,
      facNroWoo,
      facEstFac,
      fueCod
    };
    localStorage.setItem('ordersFilters', JSON.stringify(filters));
  }, [fechaDesde, fechaHasta, nitIde, nitNom, facNro, facNroWoo, facEstFac, fueCod]);

  // Guardar filtros cuando cambien
  useEffect(() => {
    saveFilters();
  }, [saveFilters]);

  // Debounce para la búsqueda al cambiar filtros
  const debouncedFetch = useCallback(debounce(() => {
    fetchOrders(1);
  }, 500), [fechaDesde, fechaHasta, nitIde, nitNom, facNro, facNroWoo, facEstFac, fueCod]);

  // Efecto para re-buscar cuando cambian los filtros (debounced)
  useEffect(() => {
    setPageNumber(1);
    setHasMore(true);
    setOrders([]);
    debouncedFetch();
    return () => {
      debouncedFetch.cancel();
    };
  }, [fechaDesde, fechaHasta, nitIde, nitNom, facNro, facNroWoo, facEstFac, fueCod]);

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFechaDesde(today);
    setFechaHasta(today);
    setNitIde('');
    setNitNom('');
    setFacNro('');
    setFacNroWoo('');
    setFacEstFac('A');
    setFueCod('4');
    localStorage.removeItem('ordersFilters');
  };

  // Acciones para editar pedido
  const handleEditOrder = (order) => {
    navigate(`/pos?fac_nro=${order.fac_nro}`);
  };

  // Acción para visualizar detalle
  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const handleAnularClick = (order) => {
    setSelectedOrder(order);
    setShowAnularModal(true);
  };

  const handleAnularSuccess = (response) => {
    // Actualizar el estado de la orden en la lista
    setOrders(orders.map(order =>
      order.fac_nro === response.fac_nro
        ? { ...order, fac_est_fac: response.fac_est_fac }
        : order
    ));
  };

  const canEditOrAnular = (estado) => {
    return ['A', 'P'].includes(estado);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Card de Header + Filtros */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-[#f58ea3] text-center sm:text-left">Gestión de Órdenes</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleClearFilters}
              className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-3 rounded-lg flex items-center justify-center text-sm sm:text-base border border-[#f58ea3] transition-colors shadow-sm"
              title="Limpiar Filtros"
            >
              <FaBroom className="text-[#f58ea3]" />
            </button>
            <button
              className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center text-sm sm:text-base flex-grow transition-colors shadow-sm"
              onClick={() => navigate('/pos')}
            >
              <FaPlus className="mr-2 text-white" /> Nueva Orden
            </button>
          </div>
        </div>
        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 p-2 sm:p-4 bg-white rounded-xl">
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={facEstFac}
              onChange={e => setFacEstFac(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            >
              <option value="A">Activo</option>
              <option value="P">Pendiente</option>
              <option value="I">Inactivo</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
            <select
              value={fueCod}
              onChange={e => setFueCod(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            >
              <option value="4">COTIZACIONES</option>
              <option value="1">FACTURAS</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">NIT</label>
            <input
              type="text"
              value={nitIde}
              onChange={e => setNitIde(e.target.value)}
              placeholder="Ingrese NIT"
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <input
              type="text"
              value={nitNom}
              onChange={e => setNitNom(e.target.value)}
              placeholder="Ingrese nombre"
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1"># Pedido</label>
            <input
              type="text"
              value={facNro}
              onChange={e => setFacNro(e.target.value)}
              placeholder="Ingrese número"
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1"># Pedido Woo</label>
            <input
              type="text"
              value={facNroWoo}
              onChange={e => setFacNroWoo(e.target.value)}
              placeholder="Ingrese número"
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Vista de Lista/Tabla */}
      <div>
        {/* Vista Móvil (Tarjetas) */}
        <div className="block sm:hidden space-y-3">
          {isLoading && pageNumber === 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
          {!isLoading && orders.length === 0 && pageNumber === 1 && (
            <p className="text-center py-4 text-gray-500">No hay órdenes para mostrar.</p>
          )}
          {orders.map((order) => {
            const isFacturado = order.documentos && order.documentos !== "";
            return (
              <div key={order.fac_sec}
                className={`bg-white p-3 rounded-xl shadow border transition-colors
                     ${isFacturado ? 'border-[#f58ea3] bg-[#fff5f7]' : 'border-gray-200 hover:border-[#f58ea3]'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">{order.fac_nro}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.fac_est_fac === 'A' ? 'bg-[#fff5f7] text-[#f58ea3]' :
                        order.fac_est_fac === 'P' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {order.fac_est_fac || 'N/A'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Fecha: {formatDate(order.fac_fec)}</p>
                    <p className="text-xs text-gray-600 mb-1">WooCommerce: {order.fac_nro_woo || '-'}</p>
                    <p className="text-sm text-gray-800 break-words">{order.nit_nom}</p>
                    <p className="text-xs text-gray-500">{order.nit_ide}</p>
                    {isFacturado && (
                      <p className="text-xs text-green-700 mt-1">
                        Documentos: <span className="font-medium">{order.documentos}</span>
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      Total: ${parseFloat(order.total_pedido).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-1 flex-shrink-0">
                    <button onClick={() => handleViewDetail(order)}
                      className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                      title="Ver Detalle">
                      <FaEye className="w-5 h-5" />
                    </button>
                    <button onClick={() => printOrder(order.fac_nro)}
                      className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                      title="Imprimir">
                      <FaPrint className="w-5 h-5" />
                    </button>
                    {canEditOrAnular(order.fac_est_fac) && (
                      <>
                        <button onClick={() => handleEditOrder(order)}
                          className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                          title="Editar">
                          <FaEdit className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleAnularClick(order)}
                          className="text-[#f58ea3] hover:text-[#f7b3c2] p-1 transition-colors"
                          title="Anular">
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {isLoading && pageNumber > 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#fff5f7]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"># Pedido</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"># WooCommerce</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIT</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Documentos</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && pageNumber === 1 && (
                <tr><td colSpan="9" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
              {!isLoading && orders.length === 0 && pageNumber === 1 && (
                <tr><td colSpan="9" className="text-center py-4 text-gray-500">No hay órdenes para mostrar.</td></tr>
              )}
              {orders.map((order) => {
                const isFacturado = order.documentos && order.documentos !== "";
                return (
                  <tr key={order.fac_sec} className={`hover:bg-[#fff5f7] transition-colors ${isFacturado ? 'bg-[#fff5f7]' : ''}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{formatDate(order.fac_fec)}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{order.fac_nro}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{order.fac_nro_woo || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{order.nit_ide}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 max-w-[180px] truncate overflow-hidden">{order.nit_nom}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 text-right">
                      ${parseFloat(order.total_pedido).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                      {isFacturado ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {order.documentos}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.fac_est_fac === 'A' ? 'bg-green-100 text-green-800' :
                        order.fac_est_fac === 'P' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                        {order.fac_est_fac || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                      <button onClick={() => handleViewDetail(order)}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                        title="Ver Detalle">
                        <FaEye />
                      </button>
                      <button onClick={() => printOrder(order.fac_nro)}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                        title="Imprimir">
                        <FaPrint />
                      </button>
                      {canEditOrAnular(order.fac_est_fac) && (
                        <>
                          <button onClick={() => handleEditOrder(order)}
                            className="text-[#f58ea3] hover:text-[#f7b3c2] mr-3 transition-colors"
                            title="Editar">
                            <FaEdit />
                          </button>
                          <button onClick={() => handleAnularClick(order)}
                            className="text-[#f58ea3] hover:text-[#f7b3c2] transition-colors"
                            title="Anular">
                            <FaTrash />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {isLoading && pageNumber > 1 && (
                <tr><td colSpan="9" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Cargar Más */}
      {hasMore && !isLoading && (
        <div className="mt-4 text-center">
          <button
            onClick={() => fetchOrders(pageNumber + 1)}
            className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-4 rounded w-full sm:w-auto text-sm sm:text-base border border-[#f58ea3] transition-colors"
          >
            Cargar Más Órdenes
          </button>
        </div>
      )}

      {/* Modal */}
      {showDetailModal && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Modal de Anulación */}
      {showAnularModal && selectedOrder && (
        <AnularDocumentoModal
          isOpen={showAnularModal}
          onClose={() => setShowAnularModal(false)}
          fac_nro={selectedOrder.fac_nro}
          fac_tip_cod={selectedOrder.fac_tip_cod}
          onSuccess={handleAnularSuccess}
        />
      )}
    </div>
  );
};

export default Orders;
