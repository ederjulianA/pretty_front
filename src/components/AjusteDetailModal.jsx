// src/components/AjusteDetailModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaTimes } from 'react-icons/fa';
import { format } from 'date-fns';

const AjusteDetailModal = ({ ajuste, onClose }) => {
  if (!ajuste) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800"
          aria-label="Cerrar"
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold mb-4">Detalle del Ajuste</h2>
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
