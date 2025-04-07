// src/pages/Ajustes.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AjusteDetailModal from '../components/AjusteDetailModal'; // Componente de detalle (debe existir o ser creado)

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

const Ajustes = () => {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Filtros
  const [FechaDesde, setFechaDesde] = useState(today);
  const [FechaHasta, setFechaHasta] = useState(today);
  const [facNro, setFacNro] = useState('');
  const [nitIde, setNitIde] = useState('');
  const [nitNom, setNitNom] = useState('');
  const [facEstFac, setFacEstFac] = useState(''); // Vacío para "todos" o se puede predefinir

  // Datos y paginación
  const [ajustes, setAjustes] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Modal de detalle de ajuste
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAjuste, setSelectedAjuste] = useState(null);

  const containerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Función para buscar ajustes
  const fetchAjustes = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/ordenes`, {
        params: {
          FechaDesde,
          FechaHasta,
          fac_nro: facNro,
          nit_ide:nitIde,
          nit_nom: nitNom,
          fac_est_fac: facEstFac,
          PageNumber: page,
          PageSize: pageSize,
          fue_cod: '5'
        }, 
      });
      if (response.data.success) {
        const newAjustes = response.data.ordenes;
        if (page === 1) {
          setAjustes(newAjustes);
        } else {
          setAjustes(prev => [...prev, ...newAjustes]);
        }
        setHasMore(newAjustes.length >= pageSize);
        setPageNumber(page);
      }
    } catch (error) {
      console.error("Error al obtener ajustes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setAjustes([]);
    setPageNumber(1);
    setHasMore(true);
    fetchAjustes(1);
  }, [FechaDesde, FechaHasta, facNro, nitIde, nitNom, facEstFac]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchAjustes(pageNumber + 1);
        }
      },
      { threshold: 1.0 }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [hasMore, isLoading, pageNumber]);

  // Acción para ver detalle de ajuste
  const handleViewDetail = (ajuste) => {
    setSelectedAjuste(ajuste);
    setShowDetailModal(true);
  };

  // Acción para limpiar filtros
  const handleClearFilters = () => {
    setFechaDesde(today);
    setFechaHasta(today);
    setFacNro('');
    setNitIde('');
    setNitNom('');
    setFacEstFac('');
    fetchAjustes(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Panel superior: Filtros */}
      <div className="p-4 bg-white shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
          <h2 className="text-2xl font-bold mb-2 md:mb-0">Listado de Ajustes de Inventario</h2>
          <button
            onClick={() => navigate('/ajustes/nuevo')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          >
            Agregar Nuevo Ajuste
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-gray-700 text-sm mb-1">Fecha Inicial</label>
            <input 
              type="date" 
              value={FechaDesde}
              onChange={e => setFechaDesde(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Fecha Final</label>
            <input 
              type="date" 
              value={FechaHasta}
              onChange={e => setFechaHasta(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Nro Ajuste</label>
            <input 
              type="text" 
              value={facNro}
              onChange={e => setFacNro(e.target.value)}
              placeholder="Ingrese nro de ajuste"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">NIT Proveedor</label>
            <input 
              type="text" 
              value={nitIde}
              onChange={e => setNitIde(e.target.value)}
              placeholder="Ingrese NIT"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Proveedor</label>
            <input 
              type="text" 
              value={nitNom}
              onChange={e => setNitNom(e.target.value)}
              placeholder="Ingrese nombre del proveedor"
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm mb-1">Estado</label>
            <select 
              value={facEstFac}
              onChange={e => setFacEstFac(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Todos</option>
              <option value="A">Activo</option>
              <option value="P">Pendiente</option>
              <option value="I">Inactivo</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button 
            onClick={() => fetchAjustes(1)}
            className="bg-[#f58ea3] text-white px-4 py-2 rounded hover:bg-[#a5762f] transition cursor-pointer flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
          <button 
            onClick={handleClearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition cursor-pointer flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Listado de Ajustes */}
      <div ref={containerRef} className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {ajustes.map((ajuste, index) => (
            <AjusteCard key={index} ajuste={ajuste} onClick={handleViewDetail} />
          ))}
        </div>
        <div ref={loadMoreRef} className="py-4 flex justify-center">
          {isLoading && <LoadingSpinner />}
        </div>
      </div>

      {/* Modal de Detalle de Ajuste */}
      {showDetailModal && selectedAjuste && (
        <AjusteDetailModal 
          ajuste={selectedAjuste}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </div>
  );
};

export default Ajustes;
