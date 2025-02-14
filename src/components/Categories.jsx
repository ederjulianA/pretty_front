// src/components/Categories.js
import React from 'react';

const Categories = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoriesRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel
}) => (
  <div className="mt-4">
    <h2 className="text-lg font-bold text-gray-800 mb-2">Categorías</h2>
    <div
      ref={categoriesRef}
      className="flex space-x-4 overflow-x-auto pb-4 no-scrollbar select-none cursor-pointer"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {categories.map((categoria) => (
        <div
          key={categoria.id}
          onClick={() => onSelectCategory(categoria.id)}
          className={`min-w-[150px] flex-shrink-0 rounded-lg shadow p-4 border transition cursor-pointer text-center ${
            categoria.id === selectedCategory
              ? "bg-[#f58ea3] text-white border-transparent"
              : "bg-white text-gray-700 hover:shadow-lg"
          }`}
        >
          <p className="font-medium">{categoria.name}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Categories;
