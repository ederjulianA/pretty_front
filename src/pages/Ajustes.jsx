// src/pages/Ajustes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AjusteDetailModal from '../components/AjusteDetailModal'; // Componente de detalle (debe existir o ser creado)
import { FaPlus, FaEdit, FaTrash, FaEye, FaBroom } from 'react-icons/fa'; // Iconos actualizados
import debounce from 'lodash/debounce';
import AnularDocumentoModal from '../components/AnularDocumentoModal';

const AjusteCard = ({ ajuste, onClick }) => {
  return (
    <div
      onClick={() => onClick && onClick(ajuste)}
      className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
    >
      <div className="mb-2">
        <p className="text-sm text-gray-700">
          <strong>Fecha:</strong> {format(new Date(ajuste.fac_fec), 'dd/MM/yyyy')}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-700">
          <strong>Nro Ajuste:</strong> {ajuste.fac_nro}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-700">
          <strong>NIT:</strong> {ajuste.nit_ide}
        </p>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-700">
          <strong>Proveedor:</strong> {ajuste.nit_nom}
        </p>
      </div>
      <div>
        <p className="text-sm text-gray-700">
          <strong>Estado:</strong> {ajuste.fac_est_fac}
        </p>
      </div>
    </div>
  );
};

// Define el número de ajustes por página
const PAGE_SIZE = 15;
const LOCAL_STORAGE_KEY = 'ajustes_filters'; // Clave para localStorage

const Ajustes = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // --- Función auxiliar para cargar filtros ---
  const loadFilters = () => {
    const savedFilters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error("Failed to parse saved filters:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpiar si está corrupto
        return {}; // Devolver objeto vacío si falla el parseo
      }
    }
    return {}; // Devolver objeto vacío si no hay nada guardado
  };

  // --- Inicializar estado desde localStorage o defaults ---
  const initialFilters = loadFilters();
  const [fechaDesde, setFechaDesde] = useState(initialFilters.fechaDesde || today);
  const [fechaHasta, setFechaHasta] = useState(initialFilters.fechaHasta || today);
  const [facNro, setFacNro] = useState(initialFilters.facNro || '');
  const [nitIde, setNitIde] = useState(initialFilters.nitIde || '');
  const [nitNom, setNitNom] = useState(initialFilters.nitNom || '');
  const [facEstFac, setFacEstFac] = useState(initialFilters.facEstFac || '');

  // Estados de Datos y Paginación
  const [ajustes, setAjustes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Estados de Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAjuste, setSelectedAjuste] = useState(null);
  const [showAnularModal, setShowAnularModal] = useState(false);

  // Función para obtener ajustes
  const fetchAjustes = useCallback(async (page, currentAjustes = []) => {
    if (!hasMore && page > 1) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ordenes`, {
        params: {
          FechaDesde: fechaDesde,
          FechaHasta: fechaHasta,
          fac_nro: facNro || '',
          nit_ide: nitIde || '',
          nit_nom: nitNom || '',
          fac_est_fac: facEstFac || '',
          PageNumber: page,
          PageSize: PAGE_SIZE,
          fue_cod: '5'
        },
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      // Ajusta según la respuesta real de tu API (ej. response.data.ordenes)
      const newAjustes = response.data.ordenes || [];

      setAjustes(page === 1 ? newAjustes : [...currentAjustes, ...newAjustes]);
      setHasMore(newAjustes.length === PAGE_SIZE);
      setPageNumber(page);

    } catch (error) {
      console.error("Error fetching ajustes:", error);
      setAjustes(page === 1 ? [] : currentAjustes); // Limpiar si es pág 1, sino mantener
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [fechaDesde, fechaHasta, facNro, nitIde, nitNom, facEstFac, hasMore]);

  // --- Efecto para guardar filtros en localStorage cuando cambian ---
  useEffect(() => {
    const filtersToSave = {
      fechaDesde,
      fechaHasta,
      facNro,
      nitIde,
      nitNom,
      facEstFac
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [fechaDesde, fechaHasta, facNro, nitIde, nitNom, facEstFac]);

  // --- Debounce para la búsqueda al cambiar filtros ---
  // La dependencia en fetchAjustes es necesaria aquí para que use la versión actualizada
  // de fetchAjustes que tiene los últimos valores de los filtros del estado.
  const debouncedFetch = useCallback(debounce(() => {
    // Siempre busca desde la página 1 cuando el debounce se dispara
    fetchAjustes(1);
  }, 500), [fetchAjustes]);

  // --- Efecto para re-buscar cuando cambian los filtros (debounced) ---
  useEffect(() => {
    // Resetear paginación y limpiar resultados inmediatamente al cambiar filtros
    setPageNumber(1);
    setHasMore(true);
    setAjustes([]); // Limpia resultados para indicar nueva búsqueda

    // Llama a la función debounced. Esta usará la versión más reciente de fetchAjustes
    // porque debouncedFetch se recrea cuando fetchAjustes cambia.
    debouncedFetch();

    // Función de limpieza para cancelar el debounce si los filtros cambian de nuevo
    // antes de que se ejecute, o si el componente se desmonta.
    return () => {
      debouncedFetch.cancel();
    };
    // *** Corrección Clave: Solo depender de los filtros ***
    // No incluir debouncedFetch aquí para evitar el ciclo infinito.
  }, [fechaDesde, fechaHasta, facNro, nitIde, nitNom, facEstFac]);

  // Función para cargar más resultados
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchAjustes(pageNumber + 1, ajustes);
    }
  };

  // Función para ver detalles (modal)
  const handleViewDetail = (ajuste) => {
    setSelectedAjuste(ajuste);
    setShowDetailModal(true);
  };

  // Función para editar (navegar)
  const handleEdit = (nroAjuste) => {
    navigate(`/ajustes/editar/${nroAjuste}`);
  };

  // Función para eliminar (placeholder)
  const handleDelete = async (id) => {
    // Implementar lógica de borrado con confirmación (Swal)
    console.log("Borrar ajuste:", id);
    // Ejemplo:
    // Swal.fire({ title: '¿Eliminar ajuste?', ... }).then((result) => { if (result.isConfirmed) { ... llamada API ... } });
  };

  // Función para limpiar filtros
  const handleClearFilters = () => {
    setFechaDesde(today);
    setFechaHasta(today);
    setFacNro('');
    setNitIde('');
    setNitNom('');
    setFacEstFac('');
    localStorage.removeItem(LOCAL_STORAGE_KEY); // Limpiar localStorage
    // El useEffect que observa los filtros se encargará de llamar a debouncedFetch
  };

  const handleAnularClick = (ajuste) => {
    setSelectedAjuste(ajuste);
    setShowAnularModal(true);
  };

  const handleAnularSuccess = (response) => {
    // Actualizar el estado del ajuste en la lista
    setAjustes(ajustes.map(ajuste =>
      ajuste.fac_nro === response.fac_nro
        ? { ...ajuste, fac_est_fac: response.fac_est_fac }
        : ajuste
    ));
  };

  const canEditOrAnular = (estado) => {
    return ['A', 'P'].includes(estado);
  };

  return (
    <div className="p-2 sm:p-4">
      {/* --- Header --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Gestión de Ajustes</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleClearFilters}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-3 rounded flex items-center justify-center text-sm sm:text-base"
            title="Limpiar Filtros"
          >
            <FaBroom />
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center text-sm sm:text-base flex-grow"
            onClick={() => navigate('/ajustes/nuevo')}
          >
            <FaPlus className="mr-2" /> Nuevo Ajuste
          </button>
        </div>
      </div>

      {/* --- Filtros --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 mb-4 p-2 sm:p-4 bg-white rounded shadow">
        {/* Columna Fecha Desde */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Desde</label>
          <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} className="p-2 border rounded text-sm bg-white" />
        </div>
        {/* Columna Fecha Hasta */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Hasta</label>
          <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} className="p-2 border rounded text-sm bg-white" />
        </div>
        {/* Columna Nro Ajuste */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Nro Ajuste</label>
          <input type="text" placeholder="Número..." value={facNro} onChange={e => setFacNro(e.target.value)} className="p-2 border rounded text-sm" />
        </div>
        {/* Columna NIT */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">NIT</label>
          <input type="text" placeholder="NIT..." value={nitIde} onChange={e => setNitIde(e.target.value)} className="p-2 border rounded text-sm" />
        </div>
        {/* Columna Proveedor */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Proveedor</label>
          <input type="text" placeholder="Nombre..." value={nitNom} onChange={e => setNitNom(e.target.value)} className="p-2 border rounded text-sm" />
        </div>
        {/* Columna Estado */}
        <div className="flex flex-col">
          <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select value={facEstFac} onChange={e => setFacEstFac(e.target.value)} className="p-2 border rounded text-sm bg-white">
            <option value="">Todos</option>
            <option value="A">Activo</option>
            {/* Añadir otros estados si existen */}
            <option value="P">Pendiente</option>
            <option value="I">Inactivo</option>
          </select>
        </div>
      </div>

      {/* --- Vista de Lista/Tabla --- */}
      <div>
        {/* Vista Móvil (Tarjetas) */}
        <div className="block sm:hidden space-y-3">
          {isLoading && pageNumber === 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
          {!isLoading && ajustes.length === 0 && pageNumber === 1 && (
            <p className="text-center py-4 text-gray-500">No hay ajustes para mostrar.</p>
          )}
          {ajustes.map((ajuste) => (
            <div key={ajuste.fac_sec} className="bg-white p-3 rounded shadow border border-gray-200" onClick={() => handleViewDetail(ajuste)}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm">{ajuste.fac_nro}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ajuste.fac_est_fac === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {ajuste.fac_est_fac || 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Fecha: {format(new Date(ajuste.fac_fec), 'dd/MM/yyyy')}</p>
                  <p className="text-sm text-gray-800 break-words">{ajuste.nit_nom}</p>
                  <p className="text-xs text-gray-500">{ajuste.nit_ide}</p>
                </div>
                {/* Acciones en móvil */}
                <div className="flex flex-col space-y-1 flex-shrink-0">
                  {canEditOrAnular(ajuste.fac_est_fac) && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(ajuste.fac_nro); }} className="text-indigo-600 hover:text-indigo-900 p-1" title="Editar"><FaEdit size="1.1em" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleAnularClick(ajuste); }} className="text-red-600 hover:text-red-900 p-1" title="Anular"><FaTrash size="1.0em" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && pageNumber > 1 && <div className="text-center py-4"><LoadingSpinner /></div>}
        </div>

        {/* Vista Desktop (Tabla) */}
        <div className="hidden sm:block overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nro Ajuste</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">NIT</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Proveedor</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && pageNumber === 1 && (
                <tr><td colSpan="6" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
              {!isLoading && ajustes.length === 0 && pageNumber === 1 && (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No hay ajustes para mostrar.</td></tr>
              )}
              {ajustes.map((ajuste) => (
                <tr key={ajuste.fac_sec} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetail(ajuste)}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{format(new Date(ajuste.fac_fec), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{ajuste.fac_nro}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{ajuste.nit_ide}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800">{ajuste.nit_nom}</td>
                  <td className="px-2 py-2 whitespace-nowrap text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ajuste.fac_est_fac === 'A' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {ajuste.fac_est_fac || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">
                    {canEditOrAnular(ajuste.fac_est_fac) && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(ajuste.fac_nro); }} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Editar"><FaEdit /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleAnularClick(ajuste); }} className="text-red-600 hover:text-red-900" title="Anular"><FaTrash /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {isLoading && pageNumber > 1 && (
                <tr><td colSpan="6" className="text-center py-4"><LoadingSpinner /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón Cargar Más */}
      {hasMore && !isLoading && (
        <div className="mt-4 text-center">
          <button
            onClick={handleLoadMore}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded w-full sm:w-auto text-sm sm:text-base"
          >
            Cargar Más Ajustes
          </button>
        </div>
      )}

      {/* Modal */}
      {showDetailModal && selectedAjuste && (
        <AjusteDetailModal
          ajuste={selectedAjuste}
          onClose={() => setShowDetailModal(false)}
        />
      )}

      {/* Modal de Anulación */}
      {showAnularModal && selectedAjuste && (
        <AnularDocumentoModal
          isOpen={showAnularModal}
          onClose={() => setShowAnularModal(false)}
          fac_nro={selectedAjuste.fac_nro}
          fac_tip_cod={selectedAjuste.fac_tip_cod}
          onSuccess={handleAnularSuccess}
        />
      )}
    </div>
  );
};

export default Ajustes;
