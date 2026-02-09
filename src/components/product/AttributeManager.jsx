import React, { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';

const AttributeManager = ({ attributeType, onAttributeTypeChange, options, onOptionsChange, disabled = false }) => {
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    const trimmed = newOption.trim();
    if (!trimmed) return;
    if (options.includes(trimmed)) return;
    onOptionsChange([...options, trimmed]);
    setNewOption('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleRemoveOption = (index) => {
    onOptionsChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-[#fffafe] border border-[#f5cad4] rounded-xl">
      <h3 className="text-gray-700 font-medium">Atributos del Producto</h3>

      {/* Tipo de atributo */}
      <div>
        <label className="block text-gray-600 mb-1 text-sm">Tipo de atributo</label>
        <select
          value={attributeType}
          onChange={(e) => onAttributeTypeChange(e.target.value)}
          className="w-full p-3 border border-[#f5cad4] rounded-xl bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
          disabled={disabled}
        >
          <option value="Tono">Tono</option>
          <option value="Color">Color</option>
        </select>
      </div>

      {/* Input para agregar opciones */}
      <div>
        <label className="block text-gray-600 mb-1 text-sm">Opciones de {attributeType.toLowerCase()}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ej: Rojo Pasión, Rosa Nude...`}
            className="flex-1 p-3 border border-[#f5cad4] rounded-xl bg-white focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] outline-none transition"
            disabled={disabled}
          />
          <button
            type="button"
            onClick={handleAddOption}
            disabled={disabled || !newOption.trim()}
            className="px-4 py-3 bg-[#f58ea3] hover:bg-[#f7b3c2] text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <FaPlus className="w-3 h-3" />
            <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>
      </div>

      {/* Chips de opciones */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fff5f7] border border-[#f5cad4] rounded-full text-sm text-gray-700"
            >
              {option}
              <button
                type="button"
                onClick={() => handleRemoveOption(index)}
                disabled={disabled}
                className="text-[#f58ea3] hover:text-red-500 transition disabled:cursor-not-allowed"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {options.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          Agrega al menos una opción de {attributeType.toLowerCase()} para crear el producto variable.
        </p>
      )}
    </div>
  );
};

export default AttributeManager;
