// src/components/Filters.js
import React from 'react';
import { FaSearch } from 'react-icons/fa';

const Filters = ({
  filterCodigo,
  setFilterCodigo,
  filterNombre,
  setFilterNombre,
  filterExistencia,
  setFilterExistencia,
  onSearch,
}) => (
  <div className="mt-4 bg-white rounded-lg shadow p-4 cursor-pointer">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 cursor-pointer">Código</label>
        <input
          type="text"
          placeholder="Código"
          value={filterCodigo}
          onChange={(e) => setFilterCodigo(e.target.value)}
          className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 cursor-pointer">Nombre</label>
        <input
          type="text"
          placeholder="Nombre"
          value={filterNombre}
          onChange={(e) => setFilterNombre(e.target.value)}
          className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 cursor-pointer">Existencia</label>
        <select
          value={filterExistencia}
          onChange={(e) => setFilterExistencia(e.target.value)}
          className="mt-1 block w-full h-10 bg-white p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f58ea3] cursor-pointer"
        >
          <option value="">Ninguno</option>
          <option value="1">Con Existencia</option>
          <option value="0">Sin Existencia</option>
        </select>
      </div>
    </div>
    <div className="mt-2 flex justify-end">
      <button
        onClick={onSearch}
        className="h-10 bg-[#f58ea3] text-white px-4 rounded-md flex items-center justify-center hover:bg-[#a5762f] cursor-pointer"
      >
        <FaSearch />
      </button>
    </div>
  </div>
);

export default Filters;
