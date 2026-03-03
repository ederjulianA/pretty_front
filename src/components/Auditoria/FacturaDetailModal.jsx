import React, { useEffect } from 'react';
import { FaTimes, FaSpinner, FaBox, FaDollarSign, FaChartLine } from 'react-icons/fa';
import useAuditoriaFacturas from '../../hooks/useAuditoriaFacturas';

const FacturaDetailModal = ({ isOpen, onClose, facSec }) => {
    const { detalleFactura, isLoadingDetalle, errorDetalle, fetchDetalle } = useAuditoriaFacturas();

    useEffect(() => {
        if (isOpen && facSec) {
            fetchDetalle(facSec);
        }
    }, [isOpen, facSec, fetchDetalle]);

    if (!isOpen) return null;

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

    const formatPercent = (value) => {
        if (!value && value !== 0) return '0%';
        return `${parseFloat(value).toFixed(1)}%`;
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FaBox className="text-pink-500" />
                            Detalle de Factura
                        </h2>
                        {detalleFactura?.encabezado && (
                            <p className="text-sm text-gray-500 mt-1">
                                {detalleFactura.encabezado.numero_factura} • Pedido WC: {detalleFactura.encabezado.numero_pedido_woocommerce || 'N/A'}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {isLoadingDetalle ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <FaSpinner className="w-10 h-10 text-pink-500 animate-spin mb-4" />
                            <p className="text-gray-500">Cargando detalles de la factura...</p>
                        </div>
                    ) : errorDetalle ? (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center justify-center h-32">
                            {errorDetalle}
                        </div>
                    ) : detalleFactura ? (
                        <div className="space-y-6">

                            {/* Info General & Cliente */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Datos del Cliente</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500 w-24 inline-block">Cliente:</span> <span className="font-medium text-gray-900">{detalleFactura.encabezado.nombre_cliente}</span></p>
                                        <p><span className="text-gray-500 w-24 inline-block">Documento:</span> <span className="font-medium text-gray-900">{detalleFactura.encabezado.identificacion_cliente}</span></p>
                                        {detalleFactura.encabezado.email_cliente && (
                                            <p><span className="text-gray-500 w-24 inline-block">Email:</span> <span className="text-gray-900">{detalleFactura.encabezado.email_cliente}</span></p>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Información Operativa</h3>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500 w-24 inline-block">Fecha:</span> <span className="font-medium text-gray-900">{new Date(detalleFactura.encabezado.fecha_factura).toLocaleString('es-CO')}</span></p>
                                        <p><span className="text-gray-500 w-24 inline-block">Estado WC:</span>
                                            <span className={`px-2 py-0.5 ml-1 rounded text-xs font-medium uppercase ${detalleFactura.encabezado.estado_woocommerce === 'completed' ? 'bg-green-100 text-green-800' :
                                                detalleFactura.encabezado.estado_woocommerce === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {detalleFactura.encabezado.estado_woocommerce || 'N/A'}
                                            </span>
                                        </p>
                                        {detalleFactura.encabezado.observaciones && (
                                            <p><span className="text-gray-500 w-24 inline-block">Obs:</span> <span className="text-gray-600 italic">{detalleFactura.encabezado.observaciones}</span></p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Card */}
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700">Artículos Facturados</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-white border-b border-gray-100 text-gray-600">
                                                <th className="text-left py-3 px-4 font-semibold">Producto</th>
                                                <th className="text-center py-3 px-4 font-semibold">Cant.</th>
                                                <th className="text-right py-3 px-4 font-semibold">Precio Unit.</th>
                                                <th className="text-right py-3 px-4 font-semibold">Costo Unit.</th>
                                                <th className="text-right py-3 px-4 font-semibold">Total Venta</th>
                                                <th className="text-right py-3 px-4 font-semibold">Rentabilidad</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {detalleFactura.lineas.map((linea, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <p className="font-medium text-gray-900">{linea.nombre_articulo}</p>
                                                        <p className="text-xs text-gray-500">{linea.codigo_articulo}</p>
                                                    </td>
                                                    <td className="py-3 px-4 text-center font-medium bg-gray-50/50">{linea.cantidad}</td>
                                                    <td className="py-3 px-4 text-right">{formatCurrency(linea.precio_unitario)}</td>
                                                    <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(linea.costo_unitario)}</td>
                                                    <td className="py-3 px-4 text-right font-medium">{formatCurrency(linea.total_linea)}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        {linea.rentabilidad_porcentaje !== null ? (
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${linea.rentabilidad_porcentaje >= 30 ? 'bg-green-100 text-green-800' :
                                                                linea.rentabilidad_porcentaje >= 15 ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                                }`}>
                                                                {formatPercent(linea.rentabilidad_porcentaje)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totales Resumen */}
                            <div className="flex justify-end">
                                <div className="w-full max-w-sm bg-pink-50 rounded-xl p-5 border border-pink-100 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Total Unidades:</span>
                                        <span className="font-medium">{detalleFactura.totales.cantidad_unidades}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Total Costos:</span>
                                        <span className="font-medium text-gray-600">{formatCurrency(detalleFactura.totales.total_costo)}</span>
                                    </div>
                                    {detalleFactura.encabezado.descuento_general > 0 && (
                                        <div className="flex justify-between items-center text-sm text-red-500">
                                            <span>Descuento Aplicado:</span>
                                            <span>-{formatCurrency(detalleFactura.encabezado.descuento_general)}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 border-t border-pink-200 flex justify-between items-center">
                                        <span className="font-bold text-gray-900">Total Venta:</span>
                                        <span className="text-xl font-black text-pink-600">{formatCurrency(detalleFactura.totales.total_ventas)}</span>
                                    </div>
                                    <div className="pt-2 flex justify-between items-center text-sm bg-white/50 p-2 rounded-lg">
                                        <span className="text-green-700 font-medium flex items-center gap-1"><FaChartLine /> Utilidad Bruta:</span>
                                        <span className="font-bold text-green-700">{formatCurrency(detalleFactura.totales.total_utilidad)}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default FacturaDetailModal;
