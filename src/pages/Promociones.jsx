// src/pages/Promociones.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBroom, FaSync, FaTag } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';
// import PromocionDetailModal from '../components/PromocionDetailModal';

const PromocionCard = ({ promocion, onClick }) => {
  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'ACTIVA': return 'bg-green-100 text-green-800';
      case 'INACTIVA': return 'bg-red-100 text-red-800';
      case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'ACTIVA': return 'Activa';
      case 'INACTIVA': return 'Inactiva';
      case 'PENDIENTE': return 'Pendiente';
      default: return 'Sin estado';
    }
  };

  return (
    <div
      onClick={() => onClick && onClick(promocion)}
      className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition border border-gray-100 hover:border-[#f58ea3]"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <FaTag className="text-[#f58ea3] w-4 h-4" />
          <p className="text-sm font-bold text-[#f58ea3]">{promocion.pro_codigo}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getEstadoBadge(promocion.estado_temporal)}`}>
          {getEstadoTexto(promocion.estado_temporal)}
        </span>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-700 font-medium">{promocion.pro_descripcion}</p>
      </div>
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          <strong>Tipo:</strong> {promocion.pro_tipo || 'N/A'}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          <strong>Fechas:</strong> {format(new Date(promocion.pro_fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(promocion.pro_fecha_fin), 'dd/MM/yyyy')}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500">
          <strong>Artículos:</strong> {promocion.total_articulos || 0}
        </p>
      </div>
    </div>
  );
};

// Define el número de promociones por página
const PAGE_SIZE = 15;
const LOCAL_STORAGE_KEY = 'promociones_filters';

const Promociones = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Función auxiliar para cargar filtros
  const loadFilters = () => {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return {};
      }
    }
    return {};
  };

  // Inicializar estado desde localStorage o defaults
  const initialFilters = loadFilters();
  const [fechaDesde, setFechaDesde] = useState(initialFilters.fechaDesde || today);
  const [fechaHasta, setFechaHasta] = useState(initialFilters.fechaHasta || today);
  const [codigo, setCodigo] = useState(initialFilters.codigo || '');
  const [descripcion, setDescripcion] = useState(initialFilters.descripcion || '');
  const [tipo, setTipo] = useState(initialFilters.tipo || '');
  const [estado, setEstado] = useState(initialFilters.estado || '');

  // Estados de Datos y Paginación
  const [promociones, setPromociones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Estados de Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState(null);

  // Función para obtener promociones
  const fetchPromociones = useCallback(async (page, currentPromociones = []) => {
    if (!hasMore && page > 1) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/promociones`, {
        params: {
          fechaDesde: fechaDesde,
          fechaHasta: fechaHasta,
          codigo: codigo || '',
          descripcion: descripcion || '',
          tipo: tipo || '',
          estado: estado || '',
          PageNumber: page,
          PageSize: PAGE_SIZE
        },
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      const newPromociones = response.data.data || [];
      setPromociones(page === 1 ? newPromociones : [...currentPromociones, ...newPromociones]);
      setHasMore(newPromociones.length === PAGE_SIZE);
      setPageNumber(page);

    } catch (error) {
      console.error("Error fetching promociones:", error);
      setPromociones(page === 1 ? [] : currentPromociones);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [fechaDesde, fechaHasta, codigo, descripcion, tipo, estado, hasMore]);

  // Efecto para guardar filtros en localStorage
  useEffect(() => {
    const filtersToSave = {
      fechaDesde,
      fechaHasta,
      codigo,
      descripcion,
      tipo,
      estado
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [fechaDesde, fechaHasta, codigo, descripcion, tipo, estado]);

  // Debounce para la búsqueda
  const debouncedFetch = useCallback(debounce(() => {
    fetchPromociones(1);
  }, 500), [fetchPromociones]);

  // Efecto para re-buscar cuando cambian los filtros
  useEffect(() => {
    setPageNumber(1);
    setHasMore(true);
    setPromociones([]);
    debouncedFetch();

    return () => {
      debouncedFetch.cancel();
    };
  }, [fechaDesde, fechaHasta, codigo, descripcion, tipo, estado]);

  // Función para cargar más resultados
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchPromociones(pageNumber + 1, promociones);
    }
  };

  // Función para ver detalles
  const handleViewDetail = (promocion) => {
    setSelectedPromocion(promocion);
    setShowDetailModal(true);
  };

  // Función para editar
  const handleEdit = (promocion) => {
    navigate(`/promociones/editar/${promocion.pro_sec}`);
  };

  // Función para eliminar
  const handleDelete = async (promocion) => {
    const result = await Swal.fire({
      title: '¿Eliminar promoción?',
      text: `Se eliminará la promoción "${promocion.pro_codigo}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/promociones/${promocion.pro_sec}`, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });

        setPromociones(promociones.filter(p => p.pro_sec !== promocion.pro_sec));
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'La promoción ha sido eliminada exitosamente',
          confirmButtonColor: '#f58ea3'
        });
      } catch (error) {
        console.error("Error eliminando promoción:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la promoción',
          confirmButtonColor: '#f58ea3'
        });
      }
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFechaDesde(today);
    setFechaHasta(today);
    setCodigo('');
    setDescripcion('');
    setTipo('');
    setEstado('');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  const canEditOrDelete = (promocionEstado) => {
    return ['ACTIVA', 'PENDIENTE', 'INACTIVA'].includes(promocionEstado);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Card de Filtros + Header */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-[#f58ea3] text-center sm:text-left flex items-center gap-2">
            <FaTag className="text-[#f58ea3]" />
            Gestión de Promociones
          </h1>
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
              onClick={() => navigate('/promociones/nueva')}
            >
              <FaPlus className="mr-2 text-white" /> Nueva Promoción
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
          {/* Fecha Desde */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={e => setFechaDesde(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
            />
          </div>
          
          {/* Fecha Hasta */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={e => setFechaHasta(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
            />
          </div>
          
          {/* Código */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Código</label>
            <input 
              type="text" 
              placeholder="Código..." 
              value={codigo} 
              onChange={e => setCodigo(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
            />
          </div>
          
          {/* Descripción */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <input 
              type="text" 
              placeholder="Descripción..." 
              value={descripcion} 
              onChange={e => setDescripcion(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
            />
          </div>
          
          {/* Tipo */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={tipo} 
              onChange={e => setTipo(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            >
              <option value="">Todos</option>
              <option value="OFERTA">Oferta</option>
              <option value="DESCUENTO">Descuento</option>
              <option value="BLACK_FRIDAY">Black Friday</option>
              <option value="OFERTA_ESPECIAL">Oferta Especial</option>
            </select>
          </div>
          
          {/* Estado */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select 
              value={estado} 
              onChange={e => setEstado(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            >
              <option value="">Todos</option>
              <option value="A">Activa</option>
              <option value="I">Inactiva</option>
              <option value="P">Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vista de Lista/Tabla */}
      <div>
        {/* Vista Móvil (Tarjetas) */}
        <div className="block sm:hidden space-y-4">
          {isLoading && pageNumber === 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
          {!isLoading && promociones.length === 0 && pageNumber === 1 && (
            <p className="text-center py-4 text-gray-500">No hay promociones para mostrar.</p>
          )}
          {promociones.map((promocion) => (
            <div key={promocion.pro_sec} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:border-[#f58ea3] transition-colors">
              <PromocionCard promocion={promocion} onClick={handleViewDetail} />
              <div className="flex justify-end mt-3 space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleViewDetail(promocion); }}
                  className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                  title="Ver Detalles"
                >
                  <FaEye className="w-4 h-4" />
                </button>
                {canEditOrDelete(promocion.estado_temporal) && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(promocion); }}
                      className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                      title="Editar"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(promocion); }}
                      className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors bg-red-50"
                      title="Eliminar"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {isLoading && pageNumber > 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#fff5f7]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fechas</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Artículos</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && pageNumber === 1 && (
                <tr><td colSpan="7" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
              {!isLoading && promociones.length === 0 && pageNumber === 1 && (
                <tr><td colSpan="7" className="text-center py-4 text-gray-500">No hay promociones para mostrar.</td></tr>
              )}
              {promociones.map((promocion) => (
                <tr key={promocion.pro_sec} className="hover:bg-[#fff5f7] transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-[#f58ea3] font-bold">{promocion.pro_codigo}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{promocion.pro_descripcion}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{promocion.pro_tipo || 'N/A'}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(promocion.pro_fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(promocion.pro_fecha_fin), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      promocion.estado_temporal === 'ACTIVA' ? 'bg-green-100 text-green-800' : 
                      promocion.estado_temporal === 'INACTIVA' ? 'bg-red-100 text-red-800' :
                      promocion.estado_temporal === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {promocion.estado_temporal === 'ACTIVA' ? 'Activa' : 
                       promocion.estado_temporal === 'INACTIVA' ? 'Inactiva' :
                       promocion.estado_temporal === 'PENDIENTE' ? 'Pendiente' : 'N/A'}
                    </span>
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center text-sm text-gray-600">
                    {promocion.total_articulos || 0}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewDetail(promocion); }}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                        title="Ver Detalles"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      {canEditOrDelete(promocion.estado_temporal) && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(promocion); }}
                            className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                            title="Editar"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(promocion); }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors bg-red-50"
                            title="Eliminar"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {isLoading && pageNumber > 1 && (
                <tr><td colSpan="7" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Cargar Más */}
      {hasMore && !isLoading && (
        <div className="mt-6 text-center">
          <button
            onClick={handleLoadMore}
            className="bg-[#fff5f7] hover:bg-[#fce7eb] text-[#f58ea3] font-bold py-2 px-6 rounded-lg w-full sm:w-auto text-sm sm:text-base border border-[#f58ea3] transition-colors shadow-sm"
          >
            Cargar Más Promociones
          </button>
        </div>
      )}

      {/* Modal de Detalle - Temporalmente deshabilitado */}
      {showDetailModal && selectedPromocion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalles de Promoción</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div><strong>Código:</strong> {selectedPromocion.pro_codigo}</div>
              <div><strong>Descripción:</strong> {selectedPromocion.pro_descripcion}</div>
              <div><strong>Tipo:</strong> {selectedPromocion.pro_tipo}</div>
              <div><strong>Fechas:</strong> {format(new Date(selectedPromocion.pro_fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(selectedPromocion.pro_fecha_fin), 'dd/MM/yyyy')}</div>
              <div><strong>Estado:</strong> {selectedPromocion.estado_temporal}</div>
              <div><strong>Artículos:</strong> {selectedPromocion.total_articulos || 0}</div>
              <div><strong>Días Restantes:</strong> {selectedPromocion.dias_restantes || 0}</div>
              <div><strong>Observaciones:</strong> {selectedPromocion.pro_observaciones || 'Sin observaciones'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Promociones; 