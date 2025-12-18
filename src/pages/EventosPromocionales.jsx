// src/pages/EventosPromocionales.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBroom, FaCalendarAlt } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import Swal from 'sweetalert2';

const EventoPromocionalCard = ({ evento, onClick }) => {
  const getEstadoBadge = (activo, enCurso) => {
    if (enCurso === 'S') return 'bg-green-100 text-green-800';
    if (activo === 'S') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEstadoTexto = (activo, enCurso) => {
    if (enCurso === 'S') return 'En Curso';
    if (activo === 'S') return 'Activo';
    return 'Inactivo';
  };

  return (
    <div
      onClick={() => onClick && onClick(evento)}
      className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition border border-gray-100 hover:border-[#f58ea3]"
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <FaCalendarAlt className="text-[#f58ea3] w-4 h-4" />
          <p className="text-sm font-bold text-[#f58ea3]">{evento.eve_nombre}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getEstadoBadge(evento.eve_activo, evento.eve_en_curso)}`}>
          {getEstadoTexto(evento.eve_activo, evento.eve_en_curso)}
        </span>
      </div>
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          <strong>Fechas:</strong> {format(new Date(evento.eve_fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(evento.eve_fecha_fin), 'dd/MM/yyyy')}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-xs text-gray-500">
          <strong>Descuento Detal:</strong> {evento.eve_descuento_detal || 0}%
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-500">
          <strong>Descuento Mayor:</strong> {evento.eve_descuento_mayor || 0}%
        </p>
      </div>
    </div>
  );
};

// Define el número de eventos por página
const PAGE_SIZE = 15;
const LOCAL_STORAGE_KEY = 'eventos_promocionales_filters';

const EventosPromocionales = () => {
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
  const [fecha, setFecha] = useState(initialFilters.fecha || '');
  const [fechaInicio, setFechaInicio] = useState(initialFilters.fechaInicio || '');
  const [fechaFin, setFechaFin] = useState(initialFilters.fechaFin || '');
  const [activo, setActivo] = useState(initialFilters.activo || '');
  const [nombre, setNombre] = useState(initialFilters.nombre || '');

  // Estados de Datos y Paginación
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Estados de Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);

  // Función para obtener eventos promocionales
  const fetchEventos = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (activo) {
        params.activo = activo;
      }
      if (fecha) {
        params.fecha = fecha;
      }
      if (fechaInicio) {
        params.fecha_inicio = fechaInicio;
      }
      if (fechaFin) {
        params.fecha_fin = fechaFin;
      }

      const response = await axios.get(`${API_URL}/eventos-promocionales`, {
        params: params,
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        let eventosFiltrados = response.data.eventos || [];
        
        // Filtrar por nombre si está especificado
        if (nombre) {
          eventosFiltrados = eventosFiltrados.filter(evento =>
            evento.eve_nombre?.toLowerCase().includes(nombre.toLowerCase())
          );
        }

        setEventos(eventosFiltrados);
        setTotal(eventosFiltrados.length);
      } else {
        setEventos([]);
        setTotal(0);
      }

    } catch (error) {
      console.error("Error fetching eventos promocionales:", error);
      setEventos([]);
      setTotal(0);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los eventos promocionales',
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsLoading(false);
    }
  }, [fecha, fechaInicio, fechaFin, activo, nombre]);

  // Efecto para guardar filtros en localStorage
  useEffect(() => {
    const filtersToSave = {
      fecha,
      fechaInicio,
      fechaFin,
      activo,
      nombre
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [fecha, fechaInicio, fechaFin, activo, nombre]);

  // Debounce para la búsqueda
  const debouncedFetch = useCallback(debounce(() => {
    fetchEventos();
  }, 500), [fetchEventos]);

  // Efecto para re-buscar cuando cambian los filtros
  useEffect(() => {
    debouncedFetch();

    return () => {
      debouncedFetch.cancel();
    };
  }, [fecha, fechaInicio, fechaFin, activo, nombre]);

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchEventos();
  }, []);

  // Función para ver detalles
  const handleViewDetail = (evento) => {
    setSelectedEvento(evento);
    setShowDetailModal(true);
  };

  // Función para editar
  const handleEdit = (evento) => {
    navigate(`/eventos-promocionales/editar/${evento.eve_sec}`);
  };

  // Función para eliminar
  const handleDelete = async (evento) => {
    const result = await Swal.fire({
      title: '¿Eliminar evento promocional?',
      text: `Se eliminará el evento "${evento.eve_nombre}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        // TODO: Implementar endpoint de eliminación cuando esté disponible
        await axios.delete(`${API_URL}/eventos-promocionales/${evento.eve_sec}`, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });

        setEventos(eventos.filter(e => e.eve_sec !== evento.eve_sec));
        setTotal(total - 1);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'El evento promocional ha sido eliminado exitosamente',
          confirmButtonColor: '#f58ea3'
        });
      } catch (error) {
        console.error("Error eliminando evento:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'No se pudo eliminar el evento promocional',
          confirmButtonColor: '#f58ea3'
        });
      }
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFecha('');
    setFechaInicio('');
    setFechaFin('');
    setActivo('');
    setNombre('');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Función para crear nuevo evento
  const handleNuevoEvento = () => {
    navigate('/eventos-promocionales/nuevo');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Card de Filtros + Header */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-[#f58ea3] text-center sm:text-left flex items-center gap-2">
            <FaCalendarAlt className="text-[#f58ea3]" />
            Gestión de Eventos Promocionales
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
              onClick={handleNuevoEvento}
            >
              <FaPlus className="mr-2 text-white" /> Nuevo Evento
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Fecha Específica */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha Específica</label>
            <input 
              type="date" 
              value={fecha} 
              onChange={e => setFecha(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
              placeholder="Fecha específica..."
            />
          </div>

          {/* Fecha Inicio */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={e => setFechaInicio(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
              placeholder="Fecha inicio..."
            />
          </div>

          {/* Fecha Fin */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
            <input 
              type="date" 
              value={fechaFin} 
              onChange={e => setFechaFin(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
              placeholder="Fecha fin..."
            />
          </div>
          
          {/* Activo */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select 
              value={activo} 
              onChange={e => setActivo(e.target.value)}
              className="p-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            >
              <option value="">Todos</option>
              <option value="S">Activo</option>
              <option value="N">Inactivo</option>
            </select>
          </div>
          
          {/* Nombre */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={nombre} 
              onChange={e => setNombre(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors" 
            />
          </div>
        </div>
      </div>

      {/* Vista de Lista/Tabla */}
      <div>
        {/* Vista Móvil (Tarjetas) */}
        <div className="block sm:hidden space-y-4">
          {isLoading && <div className="text-center py-4"><LoadingSpinner /></div>}
          {!isLoading && eventos.length === 0 && (
            <p className="text-center py-4 text-gray-500">No hay eventos promocionales para mostrar.</p>
          )}
          {eventos.map((evento) => (
            <div key={evento.eve_sec} className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:border-[#f58ea3] transition-colors">
              <EventoPromocionalCard evento={evento} onClick={handleViewDetail} />
              <div className="flex justify-end mt-3 space-x-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleViewDetail(evento); }}
                  className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                  title="Ver Detalles"
                >
                  <FaEye className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(evento); }}
                  className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                  title="Editar"
                >
                  <FaEdit className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(evento); }}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors bg-red-50"
                  title="Eliminar"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#fff5f7]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fechas</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Descuento Detal</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Descuento Mayor</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Monto Mínimo</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr><td colSpan="7" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
              {!isLoading && eventos.length === 0 && (
                <tr><td colSpan="7" className="text-center py-4 text-gray-500">No hay eventos promocionales para mostrar.</td></tr>
              )}
              {eventos.map((evento) => (
                <tr key={evento.eve_sec} className="hover:bg-[#fff5f7] transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-[#f58ea3] font-bold">{evento.eve_nombre}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">
                    {format(new Date(evento.eve_fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(evento.eve_fecha_fin), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-600">
                    {evento.eve_descuento_detal || 0}%
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-600">
                    {evento.eve_descuento_mayor || 0}%
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm text-gray-600">
                    {evento.eve_monto_mayorista_minimo ? `$${Number(evento.eve_monto_mayorista_minimo).toLocaleString('es-CO')}` : '-'}
                  </td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      evento.eve_en_curso === 'S' ? 'bg-green-100 text-green-800' : 
                      evento.eve_activo === 'S' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {evento.eve_en_curso === 'S' ? 'En Curso' : 
                       evento.eve_activo === 'S' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewDetail(evento); }}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                        title="Ver Detalles"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(evento); }}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                        title="Editar"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(evento); }}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg transition-colors bg-red-50"
                        title="Eliminar"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contador de resultados */}
      {!isLoading && eventos.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Mostrando {eventos.length} de {total} evento(s) promocional(es)
        </div>
      )}

      {/* Modal de Detalle */}
      {showDetailModal && selectedEvento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Detalles del Evento Promocional</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEvento(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Información del Encabezado */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong className="text-gray-700">Nombre:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_nombre}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Estado:</strong>
                  <p className="text-gray-900">
                    {selectedEvento.eve_en_curso === 'S' ? 'En Curso' : 
                     selectedEvento.eve_activo === 'S' ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Fecha Inicio:</strong>
                  <p className="text-gray-900">
                    {format(new Date(selectedEvento.eve_fecha_inicio), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Fecha Fin:</strong>
                  <p className="text-gray-900">
                    {format(new Date(selectedEvento.eve_fecha_fin), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Descuento Detal:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_descuento_detal || 0}%</p>
                </div>
                <div>
                  <strong className="text-gray-700">Descuento Mayor:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_descuento_mayor || 0}%</p>
                </div>
                <div>
                  <strong className="text-gray-700">Monto Mayorista Mínimo:</strong>
                  <p className="text-gray-900">
                    {selectedEvento.eve_monto_mayorista_minimo 
                      ? `$${Number(selectedEvento.eve_monto_mayorista_minimo).toLocaleString('es-CO')}` 
                      : 'No aplica'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Usuario Creación:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_usuario_creacion || 'N/A'}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Fecha Creación:</strong>
                  <p className="text-gray-900">
                    {selectedEvento.eve_fecha_creacion 
                      ? format(new Date(selectedEvento.eve_fecha_creacion), 'dd/MM/yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-700">Usuario Modificación:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_usuario_modificacion || 'N/A'}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Fecha Modificación:</strong>
                  <p className="text-gray-900">
                    {selectedEvento.eve_fecha_modificacion 
                      ? format(new Date(selectedEvento.eve_fecha_modificacion), 'dd/MM/yyyy HH:mm')
                      : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <strong className="text-gray-700">Observaciones:</strong>
                  <p className="text-gray-900">{selectedEvento.eve_observaciones || 'Sin observaciones'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventosPromocionales;
