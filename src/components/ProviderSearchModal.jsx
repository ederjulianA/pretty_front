import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaSearch, FaSpinner } from 'react-icons/fa';

const ProviderSearchModal = ({
  isOpen,
  onClose,
  onSelectProvider
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingrese un término de búsqueda');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/proveedores?search=${encodeURIComponent(searchTerm.trim())}`, {
        headers: {
          'x-access-token': localStorage.getItem('pedidos_pretty_token')
        }
      });

      if (response.data && response.data.data) {
        setSearchResults(response.data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      setError('Error al buscar proveedores. Por favor intente nuevamente.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProvider = (provider) => {
    onSelectProvider(provider);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 md:w-1/2 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Seleccionar Proveedor</h3>
          <button 
            onClick={onClose} 
            className="text-gray-600 text-2xl hover:text-gray-800 transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar por nombre o identificación"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-4 py-2 bg-[#f58ea3] text-white rounded hover:bg-[#f7b3c2] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Buscar</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto border rounded">
          {searchResults.length === 0 && !isLoading && !error ? (
            <p className="text-gray-500 p-4 text-center">
              No se encontraron proveedores.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((provider) => (
                <li
                  key={provider.nit_sec}
                  onClick={() => handleSelectProvider(provider)}
                  className="p-3 hover:bg-gray-100 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {provider.nit_nom?.trim() || "Sin nombre"}
                      </p>
                      <p className="text-sm text-gray-600">
                        NIT: {provider.nit_ide}
                      </p>
                      {provider.nit_tel && (
                        <p className="text-sm text-gray-500">
                          Tel: {provider.nit_tel}
                        </p>
                      )}
                      {provider.nit_email && (
                        <p className="text-sm text-gray-500">
                          Email: {provider.nit_email}
                        </p>
                      )}
                      {provider.nit_dir && (
                        <p className="text-sm text-gray-500">
                          Dir: {provider.nit_dir}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderSearchModal; 