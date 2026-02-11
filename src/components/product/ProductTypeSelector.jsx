import React from 'react';
import { FaBox, FaLayerGroup, FaBoxOpen } from 'react-icons/fa';

const ProductTypeSelector = ({ productType, onTypeChange, disabled = false }) => {
  const types = [
    {
      value: 'simple',
      label: 'Simple',
      description: 'Producto único con un solo SKU',
      icon: FaBox,
    },
    {
      value: 'variable',
      label: 'Variable',
      description: 'Con variaciones (tonos/colores)',
      icon: FaLayerGroup,
    },
    {
      value: 'bundle',
      label: 'Combo/Bundle',
      description: 'Producto pre-armado con componentes',
      icon: FaBoxOpen,
    },
  ];

  return (
    <div>
      <label className="block text-gray-700 mb-2 font-medium">Tipo de Producto</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {types.map((type) => {
          const Icon = type.icon;
          const isSelected = productType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              onClick={() => !disabled && onTypeChange(type.value)}
              disabled={disabled}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
                ${isSelected
                  ? 'border-[#f58ea3] bg-pink-50 shadow-md'
                  : 'border-gray-200 hover:border-[#f7b3c2] bg-white'
                }
                ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#f58ea3] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-semibold text-sm ${isSelected ? 'text-[#f58ea3]' : 'text-gray-700'}`}>
                  {type.label}
                </p>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductTypeSelector;
