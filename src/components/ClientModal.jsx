// src/components/ClientModal.js
import React from 'react';

const ClientModal = ({
  clientSearch,
  setClientSearch,
  clientResults,
  onSelectClient,
  onClose,
  onSearchClients
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 cursor-pointer">
    <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 cursor-pointer">
      <div className="flex justify-between items-center mb-4 cursor-pointer">
        <h3 className="text-xl font-bold cursor-pointer">Seleccionar Cliente</h3>
        <button onClick={onClose} className="text-gray-600 text-2xl cursor-pointer">
          &times;
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o identificación"
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          className="w-full p-2 border rounded cursor-pointer"
        />
        <button
          onClick={() => onSearchClients(1)}
          className="mt-2 w-full bg-[#f58ea3] text-white py-2 rounded cursor-pointer"
        >
          Buscar
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto cursor-pointer">
        {clientResults.length === 0 ? (
          <p className="text-gray-500 cursor-pointer">No se encontraron clientes.</p>
        ) : (
          <ul className="divide-y divide-gray-200 cursor-pointer">
            {clientResults.map((client) => (
              <li
                key={client.nit_sec}
                onClick={() => onSelectClient(client)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                <p className="font-medium cursor-pointer">
                  {client.nit_nom.trim() || "Sin nombre"} - {client.nit_ide}
                </p>
                <p className="text-sm text-gray-500 cursor-pointer">
                  {client.nit_tel} {client.nit_email}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  </div>
);

export default ClientModal;
