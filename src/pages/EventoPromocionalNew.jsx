// src/pages/EventoPromocionalNew.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSpinner, FaCalendarAlt, FaPercentage, FaDollarSign } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';

const EventoPromocionalNew = () => {
  const navigate = useNavigate();
  const { eve_sec } = useParams();
  const isEditing = Boolean(eve_sec);

  // Estado para el evento promocional
  const [eventoData, setEventoData] = useState({
    nombre: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    hora_inicio: '00:00',
    fecha_fin: new Date().toISOString().split('T')[0],
    hora_fin: '23:59',
    descuento_detal: '',
    descuento_mayor: '',
    monto_mayorista_minimo: '',
    activo: 'S',
    observaciones: ''
  });

  // Estados para loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos del evento si estamos en modo edición
  useEffect(() => {
    if (isEditing) {
      const fetchEvento = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`${API_URL}/eventos-promocionales/${eve_sec}`, {
            headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
          });

          if (response.data.success && response.data.evento) {
            const evento = response.data.evento;
            
            // Parsear fechas ISO a fecha y hora separadas
            const fechaInicio = new Date(evento.eve_fecha_inicio);
            const fechaFin = new Date(evento.eve_fecha_fin);
            
            setEventoData({
              nombre: evento.eve_nombre || '',
              fecha_inicio: fechaInicio.toISOString().split('T')[0],
              hora_inicio: fechaInicio.toTimeString().slice(0, 5), // HH:mm
              fecha_fin: fechaFin.toISOString().split('T')[0],
              hora_fin: fechaFin.toTimeString().slice(0, 5), // HH:mm
              descuento_detal: evento.eve_descuento_detal !== null && evento.eve_descuento_detal !== undefined ? evento.eve_descuento_detal : '',
              descuento_mayor: evento.eve_descuento_mayor !== null && evento.eve_descuento_mayor !== undefined ? evento.eve_descuento_mayor : '',
              monto_mayorista_minimo: evento.eve_monto_mayorista_minimo !== null && evento.eve_monto_mayorista_minimo !== undefined ? evento.eve_monto_mayorista_minimo : '',
              activo: evento.eve_activo || 'S',
              observaciones: evento.eve_observaciones || ''
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo cargar el evento promocional',
              confirmButtonColor: '#f58ea3'
            });
          }
        } catch (error) {
          console.error('Error al cargar el evento:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el evento promocional para edición',
            confirmButtonColor: '#f58ea3'
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchEvento();
    }
  }, [eve_sec, isEditing]);

  // Función para convertir fecha y hora a ISO string
  const combineDateTime = (fecha, hora) => {
    if (!fecha) return null;
    const [hours, minutes] = hora.split(':');
    const date = new Date(fecha);
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date.toISOString();
  };

  // Función para guardar evento
  const handleGuardar = async () => {
    setIsSubmitting(true);
    
    try {
      // Validaciones
      if (!eventoData.nombre.trim()) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El nombre del evento es requerido',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      const fechaInicioISO = combineDateTime(eventoData.fecha_inicio, eventoData.hora_inicio);
      const fechaFinISO = combineDateTime(eventoData.fecha_fin, eventoData.hora_fin);

      if (!fechaInicioISO || !fechaFinISO) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'Las fechas son requeridas',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (new Date(fechaInicioISO) >= new Date(fechaFinISO)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'La fecha de inicio debe ser menor a la fecha de fin',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (eventoData.descuento_detal && (isNaN(eventoData.descuento_detal) || eventoData.descuento_detal < 0 || eventoData.descuento_detal > 100)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El descuento al detal debe ser un número entre 0 y 100',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      if (eventoData.descuento_mayor && (isNaN(eventoData.descuento_mayor) || eventoData.descuento_mayor < 0 || eventoData.descuento_mayor > 100)) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: 'El descuento al mayor debe ser un número entre 0 y 100',
          confirmButtonColor: '#f58ea3'
        });
        setIsSubmitting(false);
        return;
      }

      let payload;
      let response;
      
      if (isEditing) {
        // Para actualización (PUT), solo enviar los campos permitidos
        payload = {
          nombre: eventoData.nombre.trim(),
          descuento_detal: eventoData.descuento_detal ? Number(eventoData.descuento_detal) : 0,
          descuento_mayor: eventoData.descuento_mayor ? Number(eventoData.descuento_mayor) : 0,
          monto_mayorista_minimo: eventoData.monto_mayorista_minimo ? Number(eventoData.monto_mayorista_minimo) : null
        };
        
        response = await axios.put(`${API_URL}/eventos-promocionales/${eve_sec}`, payload, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
      } else {
        // Para creación (POST), enviar todos los campos
        payload = {
          nombre: eventoData.nombre.trim(),
          fecha_inicio: fechaInicioISO,
          fecha_fin: fechaFinISO,
          descuento_detal: eventoData.descuento_detal ? Number(eventoData.descuento_detal) : 0,
          descuento_mayor: eventoData.descuento_mayor ? Number(eventoData.descuento_mayor) : 0,
          monto_mayorista_minimo: eventoData.monto_mayorista_minimo ? Number(eventoData.monto_mayorista_minimo) : null,
          activo: eventoData.activo,
          observaciones: eventoData.observaciones.trim()
        };
        
        response = await axios.post(`${API_URL}/eventos-promocionales`, payload, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
      }

      if (response.data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Evento guardado',
          text: `El evento promocional "${eventoData.nombre}" ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente`,
          confirmButtonColor: '#f58ea3'
        });

        navigate('/eventos-promocionales');
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.error || 'Error al guardar el evento promocional',
          confirmButtonColor: '#f58ea3'
        });
      }
    } catch (error) {
      console.error('Error al guardar evento:', error);
      
      // Extraer mensaje de error del backend
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Error al guardar el evento promocional';
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        confirmButtonColor: '#f58ea3'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para cancelar
  const handleCancelar = () => {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Perderá todos los cambios realizados",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f58ea3',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'No, continuar'
    }).then((result) => {
      if (result.isConfirmed) {
        navigate('/eventos-promocionales');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
          <p className="text-lg text-gray-600">Cargando evento promocional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-2 sm:p-6">
      {/* Overlay de carga */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center z-50">
          <FaSpinner className="animate-spin text-4xl text-[#f58ea3] mb-4" />
          <p className="text-gray-600 font-medium">Guardando evento promocional...</p>
          <p className="text-sm text-gray-500 mt-2">Por favor espere mientras procesamos su solicitud</p>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-[#f58ea3] text-2xl" />
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditing ? `Editar Evento Promocional` : 'Nuevo Evento Promocional'}
              </h1>
            </div>
            <button
              onClick={() => navigate('/eventos-promocionales')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="text-xl">←</span> Volver
            </button>
          </div>
        </div>

        {/* Sección de Información General */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FaCalendarAlt className="text-[#f58ea3]" />
            <h2 className="text-xl font-bold text-gray-800">Información del Evento</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Evento *
              </label>
              <input
                type="text"
                value={eventoData.nombre}
                onChange={(e) => setEventoData({...eventoData, nombre: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="Ej: Black Friday PrettyMakeup 2025"
                required
              />
            </div>

            {/* Fecha y Hora de Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" />
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={eventoData.fecha_inicio}
                onChange={(e) => setEventoData({...eventoData, fecha_inicio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors mb-2"
                required
              />
              <input
                type="time"
                value={eventoData.hora_inicio}
                onChange={(e) => setEventoData({...eventoData, hora_inicio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                required
              />
            </div>

            {/* Fecha y Hora de Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCalendarAlt className="inline mr-1" />
                Fecha de Fin *
              </label>
              <input
                type="date"
                value={eventoData.fecha_fin}
                onChange={(e) => setEventoData({...eventoData, fecha_fin: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors mb-2"
                required
              />
              <input
                type="time"
                value={eventoData.hora_fin}
                onChange={(e) => setEventoData({...eventoData, hora_fin: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                required
              />
            </div>

            {/* Descuento Detal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaPercentage className="inline mr-1" />
                Descuento al Detal (%)
              </label>
              <input
                type="number"
                value={eventoData.descuento_detal}
                onChange={(e) => setEventoData({...eventoData, descuento_detal: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* Descuento Mayor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaPercentage className="inline mr-1" />
                Descuento al Mayor (%)
              </label>
              <input
                type="number"
                value={eventoData.descuento_mayor}
                onChange={(e) => setEventoData({...eventoData, descuento_mayor: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            {/* Monto Mayorista Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaDollarSign className="inline mr-1" />
                Monto Mayorista Mínimo
              </label>
              <input
                type="number"
                value={eventoData.monto_mayorista_minimo}
                onChange={(e) => setEventoData({...eventoData, monto_mayorista_minimo: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Deje vacío si no aplica</p>
            </div>

            {/* Estado Activo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={eventoData.activo}
                onChange={(e) => setEventoData({...eventoData, activo: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
              >
                <option value="S">Activo</option>
                <option value="N">Inactivo</option>
              </select>
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={eventoData.observaciones}
                onChange={(e) => setEventoData({...eventoData, observaciones: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
                rows={3}
                placeholder="Observaciones adicionales sobre el evento..."
              />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <button
            onClick={handleCancelar}
            className="px-6 py-3 border border-[#f58ea3] text-[#f58ea3] rounded-lg hover:bg-[#fff5f7] transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="px-6 py-3 bg-[#f58ea3] text-white rounded-lg hover:bg-[#f7b3c2] transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FaCalendarAlt />
                {isEditing ? 'Actualizar Evento' : 'Crear Evento'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventoPromocionalNew;
