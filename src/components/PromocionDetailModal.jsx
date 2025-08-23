// src/components/PromocionDetailModal.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaTag, FaCalendarAlt, FaUser, FaClock, FaEye, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LoadingSpinner from './LoadingSpinner';

const PromocionDetailModal = ({ isOpen, onClose, promocion, onEdit, onDelete }) => {
  const [detalleCompleto, setDetalleCompleto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && promocion) {
      fetchPromocionDetails();
    }
  }, [isOpen, promocion]);

  const fetchPromocionDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/promociones/${promocion.pro_sec}`, {
        headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
      });

      if (response.data.success) {
        setDetalleCompleto(response.data);
      } else {
        setError('No se pudo cargar el detalle de la promoción');
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setError('Error al cargar los detalles de la promoción');
    } finally {
      setIsLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    switch(estado) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'I': return 'bg-red-100 text-red-800 border-red-200';
      case 'P': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'A': return 'Activa';
      case 'I': return 'Inactiva';
      case 'P': return 'Pendiente';
      default: return 'Sin estado';
    }
  };

  const getEstadoArticulo = (estado) => {
    switch(estado) {
      case 'A': return { text: 'Activo', color: 'text-green-600', icon: '🟢' };
      case 'I': return { text: 'Inactivo', color: 'text-red-600', icon: '🔴' };
      default: return { text: 'Sin estado', color: 'text-gray-600', icon: '⚪' };
    }
  };

  const calcularAhorro = (precioNormal, precioOferta) => {
    if (!precioNormal || !precioOferta) return { monto: 0, porcentaje: 0 };
    const ahorro = precioNormal - precioOferta;
    const porcentaje = (ahorro / precioNormal) * 100;
    return { monto: ahorro, porcentaje: porcentaje.toFixed(2) };
  };

  const canEditOrDelete = (estado) => {
    return ['A', 'P', 'I'].includes(estado);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del Modal */}
        <div className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FaTag className="text-2xl" />
              <div>
                <h2 className="text-2xl font-bold">{promocion.pro_codigo}</h2>
                <p className="text-white/90">{promocion.pro_descripcion}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Contenido del Modal */}
        <div className="p-6">
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <LoadingSpinner />
              <span className="ml-3 text-gray-600">Cargando detalles...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {detalleCompleto && (
            <div className="space-y-6">
              {/* Información General */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaTag className="text-[#f58ea3]" />
                  <h3 className="text-xl font-bold text-gray-800">Información General</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Código</p>
                    <p className="font-semibold text-gray-800">{detalleCompleto.promocion.pro_codigo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tipo</p>
                    <p className="font-semibold text-gray-800">{detalleCompleto.promocion.pro_tipo}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Estado</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoBadge(detalleCompleto.promocion.pro_estado)}`}>
                      {getEstadoTexto(detalleCompleto.promocion.pro_estado)}
                    </span>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      <FaCalendarAlt className="inline mr-1" />
                      Fecha de Inicio
                    </p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(detalleCompleto.promocion.pro_fecha_inicio), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      <FaCalendarAlt className="inline mr-1" />
                      Fecha de Fin
                    </p>
                    <p className="font-semibold text-gray-800">
                      {format(new Date(detalleCompleto.promocion.pro_fecha_fin), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total de Artículos</p>
                    <p className="font-semibold text-gray-800">{detalleCompleto.articulos?.length || 0}</p>
                  </div>
                </div>

                {detalleCompleto.promocion.pro_observaciones && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-1">Observaciones</p>
                    <p className="text-gray-800">{detalleCompleto.promocion.pro_observaciones}</p>
                  </div>
                )}

                {/* Información de Auditoría */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      <FaUser className="inline mr-1" />
                      Creado por
                    </p>
                    <p className="font-semibold text-gray-800">
                      {detalleCompleto.promocion.pro_usuario_creacion || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <FaClock className="inline mr-1" />
                      {detalleCompleto.promocion.pro_fecha_creacion 
                        ? format(new Date(detalleCompleto.promocion.pro_fecha_creacion), 'dd/MM/yyyy HH:mm', { locale: es })
                        : 'N/A'
                      }
                    </p>
                  </div>
                  
                  {detalleCompleto.promocion.pro_usuario_modificacion && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        <FaUser className="inline mr-1" />
                        Modificado por
                      </p>
                      <p className="font-semibold text-gray-800">
                        {detalleCompleto.promocion.pro_usuario_modificacion}
                      </p>
                      <p className="text-sm text-gray-500">
                        <FaClock className="inline mr-1" />
                        {detalleCompleto.promocion.pro_fecha_modificacion 
                          ? format(new Date(detalleCompleto.promocion.pro_fecha_modificacion), 'dd/MM/yyyy HH:mm', { locale: es })
                          : 'N/A'
                        }
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Artículos en Promoción */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaTag className="text-[#f58ea3]" />
                  <h3 className="text-xl font-bold text-gray-800">
                    Artículos en Promoción ({detalleCompleto.articulos?.length || 0})
                  </h3>
                </div>

                {detalleCompleto.articulos && detalleCompleto.articulos.length > 0 ? (
                  <div className="space-y-4">
                    {detalleCompleto.articulos.map((articulo, index) => {
                      const estadoArticulo = getEstadoArticulo(articulo.pro_det_estado);
                      const ahorro = calcularAhorro(articulo.precio_normal, articulo.pro_det_precio_oferta);
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">{estadoArticulo.icon}</span>
                                <div>
                                  <h4 className="font-semibold text-gray-800">{articulo.art_cod} - {articulo.art_nom}</h4>
                                  <p className={`text-sm ${estadoArticulo.color} font-medium`}>
                                    {estadoArticulo.text}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                                <div>
                                  <p className="text-sm text-gray-500">Precio Normal</p>
                                  <p className="font-semibold text-gray-800">
                                    ${Number(articulo.precio_normal).toLocaleString('es-CO')}
                                  </p>
                                </div>
                                
                                {articulo.pro_det_precio_oferta && (
                                  <div>
                                    <p className="text-sm text-gray-500">Precio Oferta</p>
                                    <p className="font-semibold text-[#f58ea3]">
                                      ${Number(articulo.pro_det_precio_oferta).toLocaleString('es-CO')}
                                    </p>
                                  </div>
                                )}
                                
                                {articulo.pro_det_descuento_porcentaje && (
                                  <div>
                                    <p className="text-sm text-gray-500">Descuento</p>
                                    <p className="font-semibold text-[#f58ea3]">
                                      {Number(articulo.pro_det_descuento_porcentaje).toFixed(2)}%
                                    </p>
                                  </div>
                                )}
                                
                                {ahorro.monto > 0 && (
                                  <div>
                                    <p className="text-sm text-gray-500">Ahorro</p>
                                    <p className="font-semibold text-green-600">
                                      ${Number(ahorro.monto).toLocaleString('es-CO')} ({ahorro.porcentaje}%)
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {articulo.pro_det_observaciones && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                  <p className="text-sm text-gray-500 mb-1">Observaciones</p>
                                  <p className="text-sm text-gray-700">{articulo.pro_det_observaciones}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No hay artículos en esta promoción</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cerrar
            </button>
          </div>
          
          {canEditOrDelete(promocion.pro_estado) && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onEdit && onEdit(promocion);
                  onClose();
                }}
                className="px-4 py-2 bg-[#f58ea3] text-white rounded-lg hover:bg-[#f7b3c2] transition-colors flex items-center gap-2"
              >
                <FaEdit className="w-4 h-4" />
                Editar
              </button>
              
              <button
                onClick={() => {
                  onDelete && onDelete(promocion);
                  onClose();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <FaTrash className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromocionDetailModal; 