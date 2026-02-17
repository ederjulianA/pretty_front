// src/pages/DashboardVentas.jsx
import React, { useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import axiosInstance from '../axiosConfig';
import useVentasData from '../hooks/useVentasData';
import { FaSpinner, FaArrowUp, FaArrowDown, FaChartLine, FaShoppingCart, FaUsers, FaDollarSign, FaBox, FaHistory } from 'react-icons/fa';
import ArticleMovementModal from '../components/ArticleMovementModal';

// Registrar componentes de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

/**
 * Dashboard de Ventas con Business Intelligence
 * Interfaz para análisis de ventas, rentabilidad y tendencias operativas
 */
const DashboardVentas = () => {
  const {
    kpisPrincipales,
    crecimiento,
    topProductos,
    ventasPorCategoria,
    ventasPorRentabilidad,
    topClientes,
    ordenesPorEstado,
    ordenesPorCanal,
    tendenciaDiaria,
    ventasPorHora,
    isLoading,
    error,
    periodo,
    actualizarPeriodo,
    refrescarDatos
  } = useVentasData();

  const [periodoPersonalizado, setPeriodoPersonalizado] = useState({
    fechaInicio: '',
    fechaFin: ''
  });

  // Estados para modal de movimientos del artículo
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [selectedArticleCode, setSelectedArticleCode] = useState(null);

  // Formatear moneda colombiana
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Formatear números
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return new Intl.NumberFormat('es-CO').format(value);
  };

  // Formatear porcentaje
  const formatPercent = (value) => {
    if (!value && value !== 0) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  // Manejar cambio de período
  const handlePeriodoChange = (nuevoPeriodo) => {
    actualizarPeriodo(nuevoPeriodo);
  };

  // Manejar período personalizado
  const handlePeriodoPersonalizado = () => {
    if (periodoPersonalizado.fechaInicio && periodoPersonalizado.fechaFin) {
      actualizarPeriodo('personalizado', periodoPersonalizado.fechaInicio, periodoPersonalizado.fechaFin);
    }
  };

  // Preparar datos para gráfico de tendencia diaria
  const datosTendenciaDiaria = {
    labels: tendenciaDiaria.map(item => {
      const fecha = new Date(item.fecha);
      return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    }),
    datasets: [
      {
        label: 'Ventas Totales',
        data: tendenciaDiaria.map(item => item.ventas_totales || 0),
        borderColor: '#f58ea3',
        backgroundColor: 'rgba(245, 142, 163, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Número de Órdenes',
        data: tendenciaDiaria.map(item => item.numero_ordenes || 0),
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  // Preparar datos para gráfico de ventas por hora
  const datosVentasPorHora = {
    labels: ventasPorHora.map(item => `${item.hora}:00`),
    datasets: [
      {
        label: 'Ventas Totales',
        data: ventasPorHora.map(item => item.ventas_totales || 0),
        backgroundColor: 'rgba(245, 142, 163, 0.6)',
        borderColor: '#f58ea3',
        borderWidth: 1
      }
    ]
  };

  // Preparar datos para gráfico de categorías (Pie)
  const datosCategorias = {
    labels: ventasPorCategoria.map(item => item.categoria),
    datasets: [
      {
        data: ventasPorCategoria.map(item => item.ventas_totales || 0),
        backgroundColor: [
          '#f58ea3',
          '#36a2eb',
          '#ffce56',
          '#4bc0c0',
          '#9966ff',
          '#ff9f40',
          '#ff6384',
          '#c9cbcf'
        ],
        borderWidth: 1
      }
    ]
  };

  // Preparar datos para gráfico de rentabilidad (Bar)
  const datosRentabilidad = {
    labels: ventasPorRentabilidad.map(item => item.clasificacion),
    datasets: [
      {
        label: 'Ventas Totales',
        data: ventasPorRentabilidad.map(item => item.ventas_totales || 0),
        backgroundColor: ventasPorRentabilidad.map(item => {
          if (item.clasificacion === 'ALTA') return '#10b981';
          if (item.clasificacion === 'MEDIA') return '#3b82f6';
          if (item.clasificacion === 'BAJA') return '#f59e0b';
          if (item.clasificacion === 'MÍNIMA') return '#ef4444';
          return '#6b7280';
        }),
        borderWidth: 1
      }
    ]
  };

  // Preparar datos para gráfico de órdenes por canal (Pie)
  const datosOrdenesPorCanal = {
    labels: ordenesPorCanal.map(item => item.canal),
    datasets: [
      {
        data: ordenesPorCanal.map(item => item.numero_ordenes || 0),
        backgroundColor: ['#f58ea3', '#36a2eb'],
        borderWidth: 1
      }
    ]
  };

  // Opciones para gráficos
  const opcionesTendencia = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Ventas: ${formatCurrency(context.parsed.y)}`;
            }
            return `Órdenes: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  const opcionesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const opcionesPie = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard de ventas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error al cargar datos</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Ventas</h1>
          <p className="text-sm text-gray-600 mt-1">Análisis de ventas, rentabilidad y tendencias operativas</p>
        </div>
        <button
          onClick={refrescarDatos}
          disabled={isLoading}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <FaSpinner className="w-4 h-4 animate-spin" />
          ) : (
            <FaChartLine className="w-4 h-4" />
          )}
          Actualizar
        </button>
      </div>

      {/* Selector de Período */}
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-gray-700">Período:</label>
          {['hoy', 'ayer', 'ultimos_7_dias', 'ultimos_15_dias', 'ultimos_30_dias', 'semana_actual', 'mes_actual', 'mes_anterior'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodoChange(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodo === p
                  ? 'bg-pink-500 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="date"
              value={periodoPersonalizado.fechaInicio}
              onChange={(e) => setPeriodoPersonalizado(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Desde"
            />
            <input
              type="date"
              value={periodoPersonalizado.fechaFin}
              onChange={(e) => setPeriodoPersonalizado(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              placeholder="Hasta"
            />
            <button
              onClick={handlePeriodoPersonalizado}
              className="px-3 py-1.5 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      {kpisPrincipales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Ventas Totales</span>
              <FaDollarSign className="w-5 h-5 text-pink-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpisPrincipales.ventas_totales)}</p>
            {crecimiento?.crecimiento?.ventas_porcentaje !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {crecimiento.crecimiento.ventas_porcentaje > 0 ? (
                  <FaArrowUp className="w-3 h-3 text-green-500" />
                ) : (
                  <FaArrowDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  crecimiento.crecimiento.ventas_porcentaje > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(Math.abs(crecimiento.crecimiento.ventas_porcentaje))}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Número de Órdenes</span>
              <FaShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(kpisPrincipales.numero_ordenes)}</p>
            {crecimiento?.crecimiento?.ordenes_porcentaje !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {crecimiento.crecimiento.ordenes_porcentaje > 0 ? (
                  <FaArrowUp className="w-3 h-3 text-green-500" />
                ) : (
                  <FaArrowDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  crecimiento.crecimiento.ordenes_porcentaje > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(Math.abs(crecimiento.crecimiento.ordenes_porcentaje))}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Ticket Promedio</span>
              <FaChartLine className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpisPrincipales.ticket_promedio)}</p>
            <p className="text-xs text-gray-500 mt-1">Por orden</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Clientes Únicos</span>
              <FaUsers className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(kpisPrincipales.clientes_unicos)}</p>
            <p className="text-xs text-gray-500 mt-1">Clientes diferentes</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Unidades Vendidas</span>
              <FaBox className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(kpisPrincipales.unidades_vendidas)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Utilidad Bruta</span>
              <FaDollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpisPrincipales.utilidad_bruta_total)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Rentabilidad Promedio</span>
              <FaChartLine className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(kpisPrincipales.rentabilidad_promedio)}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Costo Total Ventas</span>
              <FaDollarSign className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(kpisPrincipales.costo_total_ventas)}</p>
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Diaria */}
        {tendenciaDiaria.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia Diaria</h3>
            <div className="h-64">
              <Line data={datosTendenciaDiaria} options={opcionesTendencia} />
            </div>
          </div>
        )}

        {/* Ventas por Hora */}
        {ventasPorHora.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Hora del Día</h3>
            <div className="h-64">
              <Bar data={datosVentasPorHora} options={opcionesBarra} />
            </div>
          </div>
        )}

        {/* Ventas por Categoría */}
        {ventasPorCategoria.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ventas por Categoría</h3>
            <div className="h-64">
              <Pie data={datosCategorias} options={opcionesPie} />
            </div>
          </div>
        )}

        {/* Distribución por Rentabilidad */}
        {ventasPorRentabilidad.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Distribución por Rentabilidad</h3>
            <div className="h-64">
              <Bar data={datosRentabilidad} options={opcionesBarra} />
            </div>
          </div>
        )}
      </div>

      {/* Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Productos */}
        {topProductos.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Productos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Producto</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Unidades</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Ingresos</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Rentabilidad</th>
                    <th className="text-center py-2 px-3 font-semibold text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {topProductos.slice(0, 10).map((producto, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">{producto.art_nom}</p>
                        <p className="text-xs text-gray-500">{producto.art_cod}</p>
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatNumber(producto.unidades_vendidas)}</td>
                      <td className="text-right py-2 px-3 font-semibold text-gray-900">{formatCurrency(producto.ingresos_totales)}</td>
                      <td className="text-right py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          producto.rentabilidad_promedio >= 40 ? 'bg-green-100 text-green-800' :
                          producto.rentabilidad_promedio >= 20 ? 'bg-blue-100 text-blue-800' :
                          producto.rentabilidad_promedio >= 10 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercent(producto.rentabilidad_promedio)}
                        </span>
                      </td>
                      <td className="text-center py-2 px-3">
                        <button
                          onClick={() => {
                            setSelectedArticleCode(producto.art_cod);
                            setShowMovementModal(true);
                          }}
                          className="p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-colors"
                          title="Ver movimientos del artículo"
                        >
                          <FaHistory className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Clientes */}
        {topClientes.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Clientes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Cliente</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Órdenes</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Valor Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {topClientes.slice(0, 10).map((cliente, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <p className="font-medium text-gray-900">{cliente.nombre || 'Sin nombre'}</p>
                        {cliente.email && <p className="text-xs text-gray-500">{cliente.email}</p>}
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatNumber(cliente.numero_ordenes)}</td>
                      <td className="text-right py-2 px-3 font-semibold text-gray-900">{formatCurrency(cliente.valor_total_compras)}</td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatCurrency(cliente.ticket_promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Órdenes por Estado */}
        {ordenesPorEstado.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Órdenes por Estado</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Estado</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Cantidad</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Valor Total</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Valor Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesPorEstado.map((estado, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                          {estado.estado}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatNumber(estado.numero_ordenes)}</td>
                      <td className="text-right py-2 px-3 font-semibold text-gray-900">{formatCurrency(estado.valor_total)}</td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatCurrency(estado.valor_promedio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Órdenes por Canal */}
        {ordenesPorCanal.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Órdenes por Canal</h3>
            <div className="h-64 mb-4">
              <Pie data={datosOrdenesPorCanal} options={opcionesPie} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-semibold text-gray-700">Canal</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Órdenes</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Ventas</th>
                    <th className="text-right py-2 px-3 font-semibold text-gray-700">Rentabilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenesPorCanal.map((canal, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium text-gray-900">{canal.canal}</td>
                      <td className="text-right py-2 px-3 text-gray-700">{formatNumber(canal.numero_ordenes)}</td>
                      <td className="text-right py-2 px-3 font-semibold text-gray-900">{formatCurrency(canal.ventas_totales)}</td>
                      <td className="text-right py-2 px-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          canal.rentabilidad_promedio >= 30 ? 'bg-green-100 text-green-800' :
                          canal.rentabilidad_promedio >= 20 ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {formatPercent(canal.rentabilidad_promedio)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para ver movimientos del artículo */}
      <ArticleMovementModal
        isOpen={showMovementModal}
        onClose={() => {
          setShowMovementModal(false);
          setSelectedArticleCode(null);
        }}
        articleCode={selectedArticleCode}
      />
    </div>
  );
};

export default DashboardVentas;
