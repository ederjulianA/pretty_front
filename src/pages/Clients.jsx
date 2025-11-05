// src/pages/Clients.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FaPlus, FaEdit, FaTrash, FaEye, FaBroom } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import LoadingSpinner from '../components/LoadingSpinner';
import { nitService } from '../services/nitService';
import Swal from 'sweetalert2';

// Define el tamaño de página por defecto
const PAGE_SIZE = 20;
const LOCAL_STORAGE_KEY = 'clients_filters';

// Componente para mostrar una tarjeta de cliente (vista móvil)
const ClientCard = ({ cliente, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 hover:border-[#f58ea3] transition-colors">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-base text-[#f58ea3]">{cliente.nitNom}</span>
            <div className="flex gap-1">
              {cliente.nitIndCli === 'S' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fff5f7] text-[#f58ea3]">
                  Cliente
                </span>
              )}
              {cliente.nitIndPro === 'S' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Proveedor
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-1">NIT: {cliente.nitIde}</p>
          {cliente.nitEmail && (
            <p className="text-xs text-gray-500 mb-1">{cliente.nitEmail}</p>
          )}
          {cliente.nitTel && (
            <p className="text-xs text-gray-500 mb-1">Tel: {cliente.nitTel}</p>
          )}
          {cliente.nitCiudad && (
            <p className="text-xs text-gray-500">{cliente.nitCiudad}</p>
          )}
          {cliente.nitFecCre && (
            <p className="text-xs text-gray-400 mt-1">
              Creado: {format(new Date(cliente.nitFecCre), 'dd/MM/yyyy')}
            </p>
          )}
        </div>
        {/* Acciones en móvil */}
        <div className="flex flex-col space-y-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView && onView(cliente);
            }}
            className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
            title="Ver"
          >
            <FaEye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(cliente);
            }}
            className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
            title="Editar"
          >
            <FaEdit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(cliente);
            }}
            className="text-red-500 hover:text-red-600 p-2 rounded-lg transition-colors bg-red-50"
            title="Eliminar"
          >
            <FaTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Clients = () => {
  const navigate = useNavigate();

  // Función auxiliar para cargar filtros desde localStorage
  const loadFilters = () => {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        return {};
      }
    }
    return {};
  };

  // Inicializar estado desde localStorage o defaults
  const initialFilters = loadFilters();
  const [nombre, setNombre] = useState(initialFilters.nombre || '');
  const [identificacion, setIdentificacion] = useState(initialFilters.identificacion || '');
  const [email, setEmail] = useState(initialFilters.email || '');

  // Estados de Datos y Paginación
  const [clientes, setClientes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    page: 0,
    size: PAGE_SIZE,
    totalElements: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Estados de Modal (para futuras implementaciones)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);

  // Función para obtener clientes
  const fetchClientes = useCallback(async (page = 0) => {
    setIsLoading(true);
    try {
      const params = {
        page,
        size: PAGE_SIZE,
      };

      // Agregar filtros si tienen valor
      if (nombre) params.nombre = nombre;
      if (identificacion) params.identificacion = identificacion;
      if (email) params.email = email;

      // Usar el método unificado que decide qué endpoint usar
      const response = await nitService.obtenerListaNits(params);

      if (response && response.content) {
        setClientes(response.content);
        setPageInfo(response.pageInfo || {
          page: response.page || page,
          size: response.size || PAGE_SIZE,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          hasNext: response.hasNext || false,
          hasPrevious: response.hasPrevious || false,
        });
      }
    } catch (error) {
      console.error('Error fetching clientes:', error);
      
      // Mensaje de error más descriptivo
      let errorMessage = 'Error al obtener los clientes';
      if (error.message) {
        errorMessage = error.message;
      }
      
      // No mostrar alerta si es un error de red (para evitar spam de alertas)
      // Solo mostrar si hay una respuesta del servidor
      if (!error.message?.includes('conexión') && !error.message?.includes('cancelada')) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#f58ea3',
        });
      } else {
        // Para errores de conexión, solo mostrar en consola
        console.warn('Error de conexión:', errorMessage);
      }
      
      setClientes([]);
      setPageInfo({
        page: 0,
        size: PAGE_SIZE,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [nombre, identificacion, email]);

  // Efecto para guardar filtros en localStorage cuando cambian
  useEffect(() => {
    const filtersToSave = {
      nombre,
      identificacion,
      email,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [nombre, identificacion, email]);

  // Debounce para la búsqueda al cambiar filtros
  const debouncedFetch = useCallback(
    debounce(() => {
      fetchClientes(0);
    }, 500),
    [fetchClientes]
  );

  // Efecto para re-buscar cuando cambian los filtros (debounced)
  useEffect(() => {
    setPageInfo((prev) => ({ ...prev, page: 0 }));
    setClientes([]);
    debouncedFetch();

    return () => {
      debouncedFetch.cancel();
    };
  }, [nombre, identificacion, email]);

  // Cargar clientes al montar el componente
  // Nota: fetchClientes se ejecutará también cuando cambien los filtros por el debounce
  // pero aquí cargamos la primera página al montar
  useEffect(() => {
    fetchClientes(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  // Función para cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pageInfo.totalPages) {
      fetchClientes(newPage);
    }
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setNombre('');
    setIdentificacion('');
    setEmail('');
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  // Función para ver detalles (modal)
  const handleViewDetail = (cliente) => {
    setSelectedCliente(cliente);
    setShowDetailModal(true);
  };

  // Función para editar
  const handleEdit = (cliente) => {
    // TODO: Implementar navegación o modal de edición
    console.log('Editar cliente:', cliente);
    Swal.fire({
      icon: 'info',
      title: 'Función en desarrollo',
      text: 'La edición de clientes estará disponible próximamente',
      confirmButtonColor: '#f58ea3',
    });
  };

  // Función para eliminar
  const handleDelete = async (cliente) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Eliminar cliente?',
      text: `¿Está seguro de eliminar a ${cliente.nitNom}?`,
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await nitService.eliminarNit(cliente.nitSec);
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Cliente eliminado correctamente',
          confirmButtonColor: '#f58ea3',
        });
        fetchClientes(pageInfo.page); // Recargar la página actual
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Error al eliminar el cliente',
          confirmButtonColor: '#f58ea3',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Card de Filtros + Header */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <h1 className="text-2xl font-bold text-[#f58ea3] text-center sm:text-left">
            Gestión de Clientes
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
              onClick={() => {
                // TODO: Implementar navegación o modal para crear nuevo cliente
                Swal.fire({
                  icon: 'info',
                  title: 'Función en desarrollo',
                  text: 'La creación de clientes estará disponible próximamente',
                  confirmButtonColor: '#f58ea3',
                });
              }}
            >
              <FaPlus className="mr-2 text-white" /> Nuevo Cliente
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Campo Nombre */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          {/* Campo Identificación */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Identificación
            </label>
            <input
              type="text"
              placeholder="Buscar por NIT..."
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
          {/* Campo Email */}
          <div className="flex flex-col">
            <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="text"
              placeholder="Buscar por email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Vista de Lista/Tabla */}
      <div>
        {/* Vista Móvil (Tarjetas) */}
        <div className="block sm:hidden space-y-4">
          {isLoading && pageInfo.page === 0 && (
            <div className="text-center py-4">
              <LoadingSpinner />
            </div>
          )}
          {!isLoading && clientes.length === 0 && (
            <p className="text-center py-4 text-gray-500">No hay clientes para mostrar.</p>
          )}
          {clientes.map((cliente) => (
            <ClientCard
              key={cliente.nitSec}
              cliente={cliente}
              onView={handleViewDetail}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden sm:block overflow-x-auto bg-white rounded-xl shadow-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#fff5f7]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  NIT
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Ciudad
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && pageInfo.page === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <LoadingSpinner />
                  </td>
                </tr>
              )}
              {!isLoading && clientes.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-4 text-gray-500">
                    No hay clientes para mostrar.
                  </td>
                </tr>
              )}
              {clientes.map((cliente) => (
                <tr key={cliente.nitSec} className="hover:bg-[#fff5f7] transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {cliente.nitNom}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {cliente.nitIde}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {cliente.nitEmail || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {cliente.nitTel || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">
                    {cliente.nitCiudad || '-'}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-1">
                      {cliente.nitIndCli === 'S' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#fff5f7] text-[#f58ea3]">
                          Cliente
                        </span>
                      )}
                      {cliente.nitIndPro === 'S' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Proveedor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(cliente);
                        }}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                        title="Ver"
                      >
                        <FaEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(cliente);
                        }}
                        className="text-[#f58ea3] hover:text-[#f7b3c2] p-2 rounded-lg transition-colors bg-[#fff5f7]"
                        title="Editar"
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cliente);
                        }}
                        className="text-red-500 hover:text-red-600 p-2 rounded-lg transition-colors bg-red-50"
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

      {/* Paginación */}
      {pageInfo.totalPages > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-xl shadow-lg p-4">
          <div className="text-sm text-gray-700">
            Mostrando{' '}
            <span className="font-medium">
              {clientes.length > 0 ? pageInfo.page * pageInfo.size + 1 : 0}
            </span>{' '}
            a{' '}
            <span className="font-medium">
              {Math.min((pageInfo.page + 1) * pageInfo.size, pageInfo.totalElements)}
            </span>{' '}
            de <span className="font-medium">{pageInfo.totalElements}</span> clientes
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pageInfo.page - 1)}
              disabled={!pageInfo.hasPrevious || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !pageInfo.hasPrevious || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
              }`}
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                let pageNum;
                if (pageInfo.totalPages <= 5) {
                  pageNum = i;
                } else if (pageInfo.page < 3) {
                  pageNum = i;
                } else if (pageInfo.page > pageInfo.totalPages - 4) {
                  pageNum = pageInfo.totalPages - 5 + i;
                } else {
                  pageNum = pageInfo.page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      pageNum === pageInfo.page
                        ? 'bg-[#f58ea3] text-white'
                        : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
                    } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(pageInfo.page + 1)}
              disabled={!pageInfo.hasNext || isLoading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !pageInfo.hasNext || isLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-[#fff5f7] text-[#f58ea3] hover:bg-[#fce7eb] border border-[#f58ea3]'
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
