// src/components/AjusteDetailModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes, FaEdit } from 'react-icons/fa';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AjusteDetailModal = ({ ajuste, onClose }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/ajustes/editar/${ajuste.fac_nro}`);
    onClose();
  };

  if (!ajuste) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Detalle del Ajuste</h2>
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-800"
              title="Editar ajuste"
            >
              <FaEdit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Fecha:</strong> {format(new Date(ajuste.fac_fec), 'dd/MM/yyyy')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Nro Ajuste:</strong> {ajuste.fac_nro}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>NIT Proveedor:</strong> {ajuste.nit_ide}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Proveedor:</strong> {ajuste.nit_nom}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">
              <strong>Estado:</strong> {ajuste.fac_est_fac}
            </p>
          </div>
          {ajuste.observaciones && (
            <div>
              <p className="text-sm text-gray-600">
                <strong>Observaciones:</strong> {ajuste.observaciones}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AjusteDetailModal.propTypes = {
  ajuste: PropTypes.shape({
    fac_fec: PropTypes.string.isRequired,
    fac_nro: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    nit_ide: PropTypes.string.isRequired,
    nit_nom: PropTypes.string.isRequired,
    fac_est_fac: PropTypes.string.isRequired,
    observaciones: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AjusteDetailModal;
