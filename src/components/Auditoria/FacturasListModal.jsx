import React, { useEffect, useState } from 'react';
import { FaTimes, FaSearch, FaFileInvoiceDollar, FaChevronLeft, FaChevronRight, FaSpinner, FaEye } from 'react-icons/fa';
import useAuditoriaFacturas from '../../hooks/useAuditoriaFacturas';
import FacturaDetailModal from './FacturaDetailModal';

const FacturasListModal = ({ isOpen, onClose, periodoActual, fechaInicio, fechaFin }) => {

    const [selectedFacSec, setSelectedFacSec] = useState(null);

    const {
        facturas,
        paginacion,
        isLoadingListado,
        errorListado,
        fetchListado,
        cambiarPagina,
        params,
        actualizarFiltrosFecha
    } = useAuditoriaFacturas({
        periodo: periodoActual,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
    });

    // Sincronizar el periodo del Dashboard con el Modal cuando se abre
    useEffect(() => {
        if (isOpen) {
            if (params.periodo !== periodoActual || params.fecha_inicio !== fechaInicio || params.fecha_fin !== fechaFin) {
                actualizarFiltrosFecha(periodoActual, fechaInicio, fechaFin);
            } else {
                fetchListado();
            }
        }
    }, [isOpen, periodoActual, fechaInicio, fechaFin, actualizarFiltrosFecha, fetchListado]);

    if (!isOpen) return null;

    const formatCurrency = (value) => {
        if (!value && value !== 0) return '$0';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <>
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-gray-50 rounded-2xl w-full max-w-7xl shadow-2xl flex flex-col h-[90vh]">

                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-2xl">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-lg text-pink-500">
                                    <FaFileInvoiceDollar />
                                </div>
                                Auditoría de Facturas
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Visualización detallada de transacciones. Período: <span className="font-semibold text-pink-600">
                                    {params.periodo === 'personalizado'
                                        ? `Del ${params.fecha_inicio} al ${params.fecha_fin}`
                                        : params.periodo?.replace(/_/g, ' ').toUpperCase()
                                    }
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 bg-gray-100 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                            <FaTimes className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-auto p-6">
                        {errorListado ? (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">
                                <p className="font-semibold">Error al cargar listado de facturas</p>
                                <p className="text-sm mt-1">{errorListado}</p>
                                <button onClick={() => fetchListado()} className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200">Reintentar</button>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-full">

                                <div className="overflow-x-auto flex-1 relative min-h-[300px]">
                                    {isLoadingListado && (
                                        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                            <FaSpinner className="w-10 h-10 text-pink-500 animate-spin mb-3" />
                                            <p className="text-gray-500 font-medium">Cargando registros...</p>
                                        </div>
                                    )}

                                    <table className="w-full text-sm text-left whitespace-nowrap">
                                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 sticky top-0 z-0">
                                            <tr>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Fecha</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Factura</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Pedido WC</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Cliente</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Total</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider">Estado WC</th>
                                                <th className="py-3 px-4 font-semibold uppercase text-xs tracking-wider text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {facturas.length > 0 ? facturas.map((fac, idx) => (
                                                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                    <td className="py-3 px-4 text-gray-600">
                                                        {new Date(fac.fecha_factura).toLocaleString('es-CO', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                            hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </td>
                                                    <td className="py-3 px-4 font-medium text-gray-900">{fac.numero_factura}</td>
                                                    <td className="py-3 px-4 text-gray-500">{fac.numero_pedido_woocommerce || '-'}</td>
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium text-gray-800">{fac.nombre_cliente}</p>
                                                        <p className="text-xs text-gray-500">{fac.identificacion_cliente}</p>
                                                    </td>
                                                    <td className="py-3 px-4 font-semibold text-gray-900">{formatCurrency(fac.total_factura)}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${fac.estado_woocommerce === 'completed' ? 'bg-green-100 text-green-800' :
                                                            fac.estado_woocommerce === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                                fac.estado_woocommerce ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {fac.estado_woocommerce || 'No Aplica'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <button
                                                            onClick={() => setSelectedFacSec(fac.fac_sec)}
                                                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-lg transition-colors flex items-center gap-1 mx-auto text-xs font-medium"
                                                            title="Ver Detalle"
                                                        >
                                                            <FaEye /> Ver Detalle
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : !isLoadingListado && (
                                                <tr>
                                                    <td colSpan="7" className="py-12 text-center text-gray-500">
                                                        <FaSearch className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                                        <p className="text-lg font-medium text-gray-600">No se encontraron facturas</p>
                                                        <p className="text-sm">En el período seleccionado no hay transacciones de venta activas.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between mt-auto">
                                    <div className="text-sm text-gray-500">
                                        Mostrando página <span className="font-medium text-gray-900">{paginacion.pagina_actual}</span> de <span className="font-medium text-gray-900">{paginacion.total_paginas}</span>
                                        {" "}(<span className="font-medium text-gray-900">{paginacion.total_registros}</span> registros en total)
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => cambiarPagina(paginacion.pagina_actual - 1)}
                                            disabled={!paginacion.tiene_pagina_anterior || isLoadingListado}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <FaChevronLeft className="w-3 h-3" /> Anterior
                                        </button>
                                        <button
                                            onClick={() => cambiarPagina(paginacion.pagina_actual + 1)}
                                            disabled={!paginacion.tiene_pagina_siguiente || isLoadingListado}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            Siguiente <FaChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Renderizar Modal de Detalle Encima */}
            <FacturaDetailModal
                isOpen={!!selectedFacSec}
                onClose={() => setSelectedFacSec(null)}
                facSec={selectedFacSec}
            />
        </>
    );
};

export default FacturasListModal;
