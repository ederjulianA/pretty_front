import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaTimes, FaBoxOpen, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

const ArticleMovementModal = ({ isOpen, onClose, articleCode }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchMovements = async () => {
            if (!isOpen || !articleCode) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`${API_URL}/kardex/${articleCode}`, {
                    headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
                });
                setData(response.data);
            } catch (error) {
                setError(error.response?.data?.message || 'Error al cargar los movimientos');
            } finally {
                setLoading(false);
            }
        };

        fetchMovements();
    }, [isOpen, articleCode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#fff5f7] rounded-t-lg">
                    <div className="flex items-center space-x-2">
                        <FaBoxOpen className="text-[#f58ea3] text-xl" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Movimientos del Artículo
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-500 p-4">
                            {error}
                        </div>
                    ) : data?.success ? (
                        <div className="space-y-6">
                            {/* Article Info */}
                            <div className="bg-[#fff5f7] p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-800 mb-2">Información del Artículo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <span className="text-gray-600 text-sm">Código:</span>
                                        <p className="font-medium">{data.data.article.art_cod}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Nombre:</span>
                                        <p className="font-medium">{data.data.article.art_nom}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 text-sm">Stock Actual:</span>
                                        <p className="font-medium text-[#f58ea3]">{data.data.article.stock_actual}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-600 mb-1">Total Movimientos</h4>
                                    <p className="text-2xl font-bold text-[#f58ea3]">{data.data.summary.totalEntries}</p>
                                </div>
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-600 mb-1">Balance Final</h4>
                                    <p className="text-2xl font-bold text-[#f58ea3]">{data.data.summary.finalBalance}</p>
                                </div>
                            </div>

                            {/* Movements Table */}
                            {data.data.movements.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-[#fff5f7]">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Documento</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Fecha</th>
                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Tipo</th>
                                                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">Movimiento</th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Cantidad</th>
                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {data.data.movements.map((movement, index) => (
                                                <tr key={`${movement.documento}-${index}`} className="hover:bg-[#fff5f7] transition-colors">
                                                    <td className="px-4 py-2 text-sm">{movement.documento}</td>
                                                    <td className="px-4 py-2 text-sm">{new Date(movement.fecha).toLocaleDateString()}</td>
                                                    <td className="px-4 py-2 text-sm">{movement.tipo_documento}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {movement.naturaleza === '+' ? (
                                                            <FaArrowUp className="inline text-green-500" />
                                                        ) : (
                                                            <FaArrowDown className="inline text-red-500" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right">
                                                        <span className={movement.naturaleza === '+' ? 'text-green-500' : 'text-red-500'}>
                                                            {movement.naturaleza === '+' ? '+' : '-'}{movement.cantidad}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm text-right font-medium">{movement.saldo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">
                                    No hay movimientos registrados para este artículo
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 p-4">
                            No se encontró información para este artículo
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArticleMovementModal; 