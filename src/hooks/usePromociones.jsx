// src/hooks/usePromociones.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Swal from 'sweetalert2';

const usePromociones = () => {
  // Estados principales
  const [promociones, setPromociones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Configuración de paginación
  const PAGE_SIZE = 15;
  const LOCAL_STORAGE_KEY = 'promociones_filters';

  // Estados para filtros
  const [filters, setFilters] = useState({
    fechaDesde: '',
    fechaHasta: '',
    codigo: '',
    descripcion: '',
    tipo: '',
    estado: ''
  });

  // Función para cargar filtros desde localStorage
  const loadFilters = useCallback(() => {
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
  }, []);

  // Función para guardar filtros en localStorage
  const saveFilters = useCallback((filtersToSave) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, []);

  // Función principal para obtener promociones
  const fetchPromociones = useCallback(async (page = 1, currentPromociones = []) => {
    if (!hasMore && page > 1) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/promociones`, {
        params: {
          fechaDesde: filters.fechaDesde,
          fechaHasta: filters.fechaHasta,
          codigo: filters.codigo || '',
          descripcion: filters.descripcion || '',
          tipo: filters.tipo || '',
          estado: filters.estado || '',
          PageNumber: page,
          PageSize: PAGE_SIZE
        },
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        const newPromociones = response.data.promociones || [];
        setPromociones(page === 1 ? newPromociones : [...currentPromociones, ...newPromociones]);
        setHasMore(newPromociones.length === PAGE_SIZE);
        setPageNumber(page);
      } else {
        setError(response.data.message || 'Error al cargar promociones');
        setPromociones(page === 1 ? [] : currentPromociones);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching promociones:", error);
      setError(error.response?.data?.message || 'Error al cargar promociones');
      setPromociones(page === 1 ? [] : currentPromociones);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters, hasMore]);

  // Función para obtener una promoción específica
  const fetchPromocionById = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/promociones/${id}`, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        return response.data;
      } else {
        setError(response.data.message || 'Error al cargar la promoción');
        return null;
      }
    } catch (error) {
      console.error("Error fetching promocion:", error);
      setError(error.response?.data?.message || 'Error al cargar la promoción');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para crear una nueva promoción
  const createPromocion = useCallback(async (promocionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/promociones`, promocionData, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        // Actualizar la lista de promociones
        await fetchPromociones(1);
        
        Swal.fire({
          icon: 'success',
          title: 'Promoción creada',
          text: `La promoción "${promocionData.codigo}" ha sido creada exitosamente`,
          confirmButtonColor: '#f58ea3'
        });
        
        return response.data;
      } else {
        setError(response.data.message || 'Error al crear la promoción');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al crear la promoción',
          confirmButtonColor: '#f58ea3'
        });
        return null;
      }
    } catch (error) {
      console.error("Error creating promocion:", error);
      const errorMessage = error.response?.data?.message || 'Error al crear la promoción';
      setError(errorMessage);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#f58ea3'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPromociones]);

  // Función para actualizar una promoción
  const updatePromocion = useCallback(async (id, promocionData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`${API_URL}/promociones/${id}`, promocionData, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        // Actualizar la lista de promociones
        await fetchPromociones(1);
        
        Swal.fire({
          icon: 'success',
          title: 'Promoción actualizada',
          text: `La promoción "${promocionData.codigo}" ha sido actualizada exitosamente`,
          confirmButtonColor: '#f58ea3'
        });
        
        return response.data;
      } else {
        setError(response.data.message || 'Error al actualizar la promoción');
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Error al actualizar la promoción',
          confirmButtonColor: '#f58ea3'
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating promocion:", error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar la promoción';
      setError(errorMessage);
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#f58ea3'
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fetchPromociones]);

  // Función para eliminar una promoción
  const deletePromocion = useCallback(async (promocion) => {
    const result = await Swal.fire({
      title: '¿Eliminar promoción?',
      text: `Se eliminará la promoción "${promocion.pro_codigo}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.delete(`${API_URL}/promociones/${promocion.pro_sec}`, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });

        if (response.data.success) {
          // Remover de la lista local
          setPromociones(prev => prev.filter(p => p.pro_sec !== promocion.pro_sec));
          
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'La promoción ha sido eliminada exitosamente',
            confirmButtonColor: '#f58ea3'
          });
          
          return true;
        } else {
          setError(response.data.message || 'Error al eliminar la promoción');
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.data.message || 'Error al eliminar la promoción',
            confirmButtonColor: '#f58ea3'
          });
          return false;
        }
      } catch (error) {
        console.error("Error deleting promocion:", error);
        const errorMessage = error.response?.data?.message || 'Error al eliminar la promoción';
        setError(errorMessage);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#f58ea3'
        });
        
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    
    return false;
  }, []);

  // Función para cambiar el estado de una promoción
  const togglePromocionEstado = useCallback(async (promocion) => {
    const nuevoEstado = promocion.pro_estado === 'A' ? 'I' : 'A';
    const accion = nuevoEstado === 'A' ? 'activar' : 'desactivar';
    
    const result = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} promoción?`,
      text: `Se ${accion}á la promoción "${promocion.pro_codigo}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.patch(`${API_URL}/promociones/${promocion.pro_sec}/estado`, {
          estado: nuevoEstado
        }, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });

        if (response.data.success) {
          // Actualizar el estado en la lista local
          setPromociones(prev => 
            prev.map(p => 
              p.pro_sec === promocion.pro_sec 
                ? { ...p, pro_estado: nuevoEstado }
                : p
            )
          );
          
          Swal.fire({
            icon: 'success',
            title: 'Estado actualizado',
            text: `La promoción ha sido ${accion}da exitosamente`,
            confirmButtonColor: '#f58ea3'
          });
          
          return true;
        } else {
          setError(response.data.message || 'Error al cambiar el estado');
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: response.data.message || 'Error al cambiar el estado',
            confirmButtonColor: '#f58ea3'
          });
          return false;
        }
      } catch (error) {
        console.error("Error updating promocion estado:", error);
        const errorMessage = error.response?.data?.message || 'Error al cambiar el estado';
        setError(errorMessage);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMessage,
          confirmButtonColor: '#f58ea3'
        });
        
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    
    return false;
  }, []);

  // Función para actualizar filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    saveFilters(newFilters);
    setPageNumber(1);
    setHasMore(true);
  }, [saveFilters]);

  // Función para limpiar filtros
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      fechaDesde: '',
      fechaHasta: '',
      codigo: '',
      descripcion: '',
      tipo: '',
      estado: ''
    };
    setFilters(clearedFilters);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setPageNumber(1);
    setHasMore(true);
  }, []);

  // Función para cargar más promociones
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPromociones(pageNumber + 1, promociones);
    }
  }, [isLoading, hasMore, pageNumber, promociones, fetchPromociones]);

  // Función para refrescar la lista
  const refresh = useCallback(() => {
    setPageNumber(1);
    setHasMore(true);
    fetchPromociones(1);
  }, [fetchPromociones]);

  // Cargar filtros al inicializar
  useEffect(() => {
    const savedFilters = loadFilters();
    if (Object.keys(savedFilters).length > 0) {
      setFilters(savedFilters);
    }
  }, [loadFilters]);

  // Función para validar datos de promoción
  const validatePromocionData = useCallback((data) => {
    const errors = [];

    if (!data.codigo || !data.codigo.trim()) {
      errors.push('El código es requerido');
    }

    if (!data.descripcion || !data.descripcion.trim()) {
      errors.push('La descripción es requerida');
    }

    if (!data.fecha_inicio) {
      errors.push('La fecha de inicio es requerida');
    }

    if (!data.fecha_fin) {
      errors.push('La fecha de fin es requerida');
    }

    if (data.fecha_inicio && data.fecha_fin) {
      if (new Date(data.fecha_inicio) >= new Date(data.fecha_fin)) {
        errors.push('La fecha de inicio debe ser menor a la fecha de fin');
      }
    }

    if (!data.articulos || data.articulos.length === 0) {
      errors.push('Debe agregar al menos un artículo');
    } else {
      const articulosValidos = data.articulos.filter(art => 
        art.art_sec && (art.precio_oferta || art.descuento_porcentaje)
      );
      
      if (articulosValidos.length === 0) {
        errors.push('Debe agregar al menos un artículo con precio de oferta o descuento');
      }
    }

    return errors;
  }, []);

  return {
    // Estados
    promociones,
    isLoading,
    error,
    pageNumber,
    hasMore,
    filters,
    
    // Funciones principales
    fetchPromociones,
    fetchPromocionById,
    createPromocion,
    updatePromocion,
    deletePromocion,
    togglePromocionEstado,
    
    // Funciones de filtros
    updateFilters,
    clearFilters,
    
    // Funciones de utilidad
    loadMore,
    refresh,
    validatePromocionData,
    
    // Configuración
    PAGE_SIZE
  };
};

export default usePromociones; 