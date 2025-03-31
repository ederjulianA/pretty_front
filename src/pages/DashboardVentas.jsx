import React, { useState } from 'react';
import axiosInstance from '../axiosConfig';
import { formatValue } from '../utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardVentas = () => {
  // Estados
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [salesData, setSalesData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Función para calcular los totales
  const calculateTotals = (invoices) => {
    const wooInvoices = invoices.filter(inv => inv.fac_nro_woo);
    const localInvoices = invoices.filter(inv => !inv.fac_nro_woo);
    
    const wooSales = wooInvoices.reduce((sum, inv) => sum + inv.total_pedido, 0);
    const localSales = localInvoices.reduce((sum, inv) => sum + inv.total_pedido, 0);

    return {
      wooSales,
      localSales,
      totalSales: wooSales + localSales,
      wooCount: wooInvoices.length,
      localCount: localInvoices.length,
      totalCount: invoices.length
    };
  };

  // Función para buscar las ventas
  const handleSearch = async () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Por favor seleccione ambas fechas');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.get('/sales', {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }
      });

      if (response.data.success) {
        setSalesData(response.data);
      }
    } catch (err) {
      setError('Error al obtener los datos de ventas');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Evolución de Ventas Diarias'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => `$${formatValue(value)}`
        }
      }
    }
  };

  const chartData = salesData ? {
    labels: salesData.daily_sales.map(sale => 
      format(new Date(sale.fac_fec), 'dd/MM/yyyy')
    ),
    datasets: [{
      label: 'Ventas Diarias',
      data: salesData.daily_sales.map(sale => sale.total_ventas_diarias),
      borderColor: '#f58ea3',
      backgroundColor: 'rgba(245, 142, 163, 0.5)',
      tension: 0.4
    }]
  } : null;

  const totals = salesData ? calculateTotals(salesData.invoices) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Panel de Filtros */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Inicial
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Final
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-pink-300"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className={`
                  w-full p-2 rounded text-white transition-colors
                  ${isLoading ? 'bg-gray-400' : 'bg-[#f58ea3] hover:bg-[#a5762f]'}
                `}
              >
                {isLoading ? 'Cargando...' : 'Buscar'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-red-600 text-sm">{error}</div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f58ea3]"></div>
          </div>
        ) : salesData && totals ? (
          <>
            {/* Cards de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">
                  Ventas WooCommerce
                </h3>
                <p className="text-2xl font-bold text-purple-900">
                  ${formatValue(totals.wooSales)}
                </p>
                <p className="text-sm text-purple-700 mt-2">
                  Total Facturas: {totals.wooCount}
                </p>
              </div>

              <div className="bg-green-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Ventas Locales
                </h3>
                <p className="text-2xl font-bold text-green-900">
                  ${formatValue(totals.localSales)}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  Total Facturas: {totals.localCount}
                </p>
              </div>

              <div className="bg-blue-100 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Total Ventas
                </h3>
                <p className="text-2xl font-bold text-blue-900">
                  ${formatValue(totals.totalSales)}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Total Facturas: {totals.totalCount}
                </p>
              </div>
            </div>

            {/* Gráfico */}
            <div className="bg-white rounded-lg shadow p-6">
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Tabla de Facturas */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Listado de Facturas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        # Factura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesData.invoices.map((invoice, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(invoice.fac_fec), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.fac_nro}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.nit_nom} ({invoice.nit_ide})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${formatValue(invoice.total_pedido)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invoice.fac_nro_woo ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                              WooCommerce
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Local
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default DashboardVentas; 