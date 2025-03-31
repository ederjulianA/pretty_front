// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import axios from 'axios';
import { formatDate } from '../utils/dateUtils';
import { baseUrl } from '../config.js';

const Dashboard = () => {
  // Estados para los filtros
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(100);
  const [wooStatus, setWooStatus] = useState('on-hold');
  
  // Estado para los mensajes de respuesta
  const [syncMessages, setSyncMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Opciones de estado de WooCommerce
  const wooStatusOptions = [
    { value: 'on-hold', label: 'En espera' },
    { value: 'processing', label: 'Procesando' },
    { value: 'completed', label: 'Completado' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'refunded', label: 'Reembolsado' },
    { value: 'failed', label: 'Fallido' },
    { value: 'pending', label: 'Pendiente' }
  ];

  const handleSync = async () => {
    if (!dateFrom || !dateTo) {
      alert('Por favor seleccione las fechas');
      return;
    }

    setIsLoading(true);
    setSyncMessages([]);

    try {
      const endpoint = 'syncpedidos';
      const response = await axios.post(`${baseUrl}/${endpoint}`, {
        per_page: perPage,
        woo_status: wooStatus,
        after: `${dateFrom}T00:00:00`,
        before: `${dateTo}T23:59:59`
      });

      if (response.data && response.data.messages) {
        setSyncMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
      setSyncMessages([{
        Description: 'Error en la sincronización: ' + error.message,
        Type: 2
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-6">Sincronización de Pedidos WooCommerce</h2>
          
          {/* Panel de Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registros por página
              </label>
              <input
                type="number"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                min="1"
                max="100"
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado WooCommerce
              </label>
              <select
                value={wooStatus}
                onChange={(e) => setWooStatus(e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              >
                {wooStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón de Sincronización */}
          <div className="flex justify-end mb-6">
            <button
              onClick={handleSync}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded
                ${isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#f58ea3] hover:bg-[#a5762f]'
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sincronizar Pedidos
                </>
              )}
            </button>
          </div>

          {/* Panel de Mensajes */}
          {syncMessages.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
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

export default Dashboard;
