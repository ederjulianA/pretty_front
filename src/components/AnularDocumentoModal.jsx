import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import Swal from 'sweetalert2';

const AnularDocumentoModal = ({ isOpen, onClose, fac_nro, fac_tip_cod, onSuccess }) => {
    const [fac_obs, setFacObs] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await axios.post(`${API_URL}/ordenes/anular`, {
                fac_nro,
                fac_tip_cod,
                fac_obs
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Documento Anulado',
                    text: response.data.message,
                    confirmButtonColor: '#f58ea3'
                });
                onSuccess(response.data);
                onClose();
            } else {
                throw new Error(response.data.message || 'Error al anular el documento');
            }
        } catch (error) {
            console.error("Error al anular documento:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Error al anular el documento, por favor intente nuevamente.',
                confirmButtonColor: '#f58ea3'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-xl font-bold mb-4 text-center">
                    Confirme anulación de documento: {fac_nro}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">
                            Observaciones
                        </label>
                        <textarea
                            value={fac_obs}
                            onChange={(e) => setFacObs(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows="3"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#a5762f] transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Anulando...' : 'Confirmar Anulación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnularDocumentoModal; 