import React from 'react';
import { FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

const SyncWooModal = ({ isOpen, onClose, syncData, isSyncing }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#fff5f7] px-6 py-4 flex justify-between items-center border-b">
          <h3 className="text-lg font-semibold text-[#f58ea3]">Resultado de Sincronización</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isSyncing}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {isSyncing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#f58ea3] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Sincronizando con WooCommerce...</p>
            </div>
          ) : syncData ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#fff5f7] p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-xl font-semibold text-[#f58ea3]">{syncData.summary.totalItems}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Exitosos</p>
                  <p className="text-xl font-semibold text-green-600">{syncData.summary.successCount}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Omitidos</p>
                  <p className="text-xl font-semibold text-yellow-600">{syncData.summary.skippedCount}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-xl font-semibold text-red-600">{syncData.summary.errorCount}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-700 mb-3">Detalles de la Sincronización</h4>
                {syncData.messages.map((message, index) => {
                  const isError = message.toLowerCase().includes('no se encontró') || message.toLowerCase().includes('error');
                  const isSuccess = message.toLowerCase().includes('actualizado');
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        isError ? 'bg-red-50' : isSuccess ? 'bg-green-50' : 'bg-gray-50'
                      }`}
                    >
                      {isError ? (
                        <FaExclamationTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      ) : isSuccess ? (
                        <FaCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FaExclamationTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      )}
                      <p className={`text-sm ${
                        isError ? 'text-red-700' : isSuccess ? 'text-green-700' : 'text-gray-700'
                      }`}>
                        {message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="font-medium">Duración:</p>
                    <p>{syncData.summary.duration}</p>
                  </div>
                  <div>
                    <p className="font-medium">Documento:</p>
                    <p>{syncData.summary.fac_nro}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="w-full bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSyncing}
          >
            {isSyncing ? 'Sincronizando...' : 'Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncWooModal; 