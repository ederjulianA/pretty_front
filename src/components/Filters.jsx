// src/components/Filters.js
import React from 'react';
import { FaSearch, FaBarcode, FaBox, FaBoxes } from 'react-icons/fa';

const Filters = ({
  filterCodigo,
  setFilterCodigo,
  filterNombre,
  setFilterNombre,
  filterExistencia,
  setFilterExistencia,
  onSearch,
}) => (
  <div className="bg-white rounded-xl shadow-md p-3 md:p-6 w-full md:max-w-none md:mx-0 md:rounded-lg md:mb-0">
    <form
      className="flex flex-col gap-2 md:grid md:grid-cols-3 md:gap-4 items-end"
      onSubmit={e => e.preventDefault()}
    >
      <div className="mb-2 md:mb-0 w-full">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Código</label>
        <div className="relative">
          <FaBarcode className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por código"
            value={filterCodigo}
            onChange={e => { setFilterCodigo(e.target.value); onSearch(); }}
            className="w-full pl-8 pr-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-all"
          />
        </div>
      </div>
      <div className="mb-2 md:mb-0 w-full">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre</label>
        <div className="relative">
          <FaBox className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre"
            value={filterNombre}
            onChange={e => { setFilterNombre(e.target.value); onSearch(); }}
            className="w-full pl-8 pr-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-all"
          />
        </div>
      </div>
      <div className="mb-2 md:mb-0 w-full">
        <label className="block text-xs font-semibold text-gray-600 mb-1">Existencia</label>
        <div className="relative">
          <FaBoxes className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <select
            value={filterExistencia}
            onChange={e => { setFilterExistencia(e.target.value); onSearch(); }}
            className="w-full pl-8 pr-2 py-2 rounded-lg border border-gray-200 text-xs focus:ring-1 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-all"
          >
            <option value="">Todos los productos</option>
            <option value="con_stock">Solo con stock</option>
            <option value="sin_stock">Solo sin stock</option>
          </select>
        </div>
      </div>
    </form>
  </div>
);

export default Filters;
