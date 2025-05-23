import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSync, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const DiferenciaInventario = () => {
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [syncMessages, setSyncMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [differences, setDifferences] = useState([]);
  const [isLoadingDifferences, setIsLoadingDifferences] = useState(false);

  // Verificar permisos al montar el componente
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!hasPermission('dashboard', 'view')) {
      toast.error('No tienes permisos para acceder a esta página');
      navigate('/dashboard');
      return;
    }
  }, [user, hasPermission, navigate]);

  // Función para cargar las diferencias de inventario
  const fetchDifferences = async () => {
    if (!hasPermission('dashboard', 'view')) {
      toast.error('No tienes permisos para ver las diferencias de inventario');
      return;
    }

    setIsLoadingDifferences(true);
    try {
      const response = await axios.get(`${API_URL}/inventory-differences/differences`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('pedidos_pretty_token')}`
        }
      });
      if (response.data.success) {
        setDifferences(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar diferencias:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      setSyncMessages([{
        Description: 'Error al cargar diferencias de inventario: ' + error.message,
        Type: 2
      }]);
    } finally {
      setIsLoadingDifferences(false);
    }
  };

  // Cargar diferencias al montar el componente
  useEffect(() => {
    fetchDifferences();
  }, []);

  const handleSync = async () => {
    if (!hasPermission('dashboard', 'edit')) {
      toast.error('No tienes permisos para sincronizar el inventario');
      return;
    }

    setIsLoading(true);
    setSyncMessages([]);
    setStats(null);

    try {
      const response = await axios.post(`${API_URL}/woo/sync`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('pedidos_pretty_token')}`
        }
      });

      if (response.data) {
        // Agregar mensaje de éxito
        setSyncMessages([{
          Description: response.data.message,
          Type: 0
        }]);

        // Guardar estadísticas
        setStats(response.data.stats);

        // Agregar errores si existen
        if (response.data.errors && response.data.errors.length > 0) {
          response.data.errors.forEach(error => {
            setSyncMessages(prev => [...prev, {
              Description: `Error en producto ${error.details.name} (${error.productId}): ${error.error}`,
              Type: 2
            }]);
          });
        }

        // Recargar diferencias después de la sincronización
        await fetchDifferences();
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        navigate('/login');
        return;
      }
      setSyncMessages([{
        Description: 'Error en la sincronización: ' + error.message,
        Type: 2
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para formatear números como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-[#f58ea3]">Sincronización de Inventario WooCommerce</h2>
            <button
              onClick={handleSync}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#f58ea3] hover:bg-[#f7b3c2]'
                } 
                text-white transition-colors
              `}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sincronizando...
                </>
              ) : (
                <>
                  <FaSync className="w-5 h-5" />
                  Sincronizar Inventario
                </>
              )}
            </button>
          </div>

          {/* Panel de Estadísticas */}
          {stats && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Estadísticas de Sincronización</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#fff5f7] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Procesados</p>
                  <p className="text-2xl font-bold text-[#f58ea3]">{stats.totalProcessed}</p>
                </div>
                <div className="bg-[#fff5f7] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Actualizados</p>
                  <p className="text-2xl font-bold text-[#f58ea3]">{stats.totalUpdated}</p>
                </div>
                <div className="bg-[#fff5f7] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Creados</p>
                  <p className="text-2xl font-bold text-[#f58ea3]">{stats.totalCreated}</p>
                </div>
                <div className="bg-[#fff5f7] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Errores</p>
                  <p className="text-2xl font-bold text-[#f58ea3]">{stats.totalErrors}</p>
                </div>
              </div>
            </div>
          )}

          {/* Grilla de Diferencias */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Diferencias de Inventario</h3>
              <span className="text-sm text-gray-500">
                Total: {differences.length} productos
              </span>
            </div>

            {isLoadingDifferences ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#f58ea3]"></div>
              </div>
            ) : differences.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay diferencias</h3>
                <p className="mt-1 text-sm text-gray-500">El inventario está sincronizado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Woo</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Sistema</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Diferencia</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Venta</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Mayorista</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Modificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {differences.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.wooStock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{item.systemStock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.wooStock !== item.systemStock 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {item.wooStock - item.systemStock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(item.retailPrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(item.wholesalePrice)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.lastModified)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Panel de Mensajes */}
          {syncMessages.length > 0 && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-lg font-medium">Resultados de la Sincronización</h3>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {syncMessages.map((message, index) => (
                  <div 
                    key={index}
                    className={`p-3 ${
                      message.Type === 0 ? 'bg-white' :
                      message.Type === 1 ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}
                  >
                    <p className={`text-sm ${
                      message.Type === 0 ? 'text-gray-700' :
                      message.Type === 1 ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {message.Description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiferenciaInventario; 