// src/components/Filters.js
import React, { useState, useEffect } from 'react';
import { FaSearch, FaBarcode, FaBox, FaBoxes, FaSpinner } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../config';
import Swal from 'sweetalert2';

const Filters = ({
  filterCodigo,
  setFilterCodigo,
  filterNombre,
  setFilterNombre,
  filterExistencia,
  setFilterExistencia,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  onSearch
}) => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);

  // Cargar listado de categorías
  useEffect(() => {
    setIsLoadingCategories(true);
    axios.get(`${API_URL}/categorias`)
      .then(response => {
        const data = response.data;
        if (data.success && data.result && data.result.data) {
          setCategories(data.result.data);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar las categorías.',
            confirmButtonColor: '#f58ea3'
          });
        }
      })
      .catch(error => {
        console.error("Error al obtener categorías:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al cargar las categorías.',
          confirmButtonColor: '#f58ea3'
        });
      })
      .finally(() => setIsLoadingCategories(false));
  }, []);

  // Cargar subcategorías cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategory) {
      setIsLoadingSubcategories(true);
      axios.get(`${API_URL}/subcategorias`, { params: { inv_gru_cod: selectedCategory } })
        .then(response => {
          const data = response.data;
          if (data.success && data.subcategorias) {
            setSubcategories(data.subcategorias);
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudieron cargar las subcategorías.',
              confirmButtonColor: '#f58ea3'
            });
          }
        })
        .catch(error => {
          console.error("Error al obtener subcategorías:", error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al cargar las subcategorías.',
            confirmButtonColor: '#f58ea3'
          });
        })
        .finally(() => setIsLoadingSubcategories(false));
    } else {
      setSubcategories([]);
      setSelectedSubcategory("");
    }
  }, [selectedCategory]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro de código */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código
          </label>
          <input
            type="text"
            value={filterCodigo}
            onChange={(e) => setFilterCodigo(e.target.value)}
            placeholder="Buscar por código"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filtro de nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
            placeholder="Buscar por nombre"
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* Filtro de existencia */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Existencia
          </label>
          <select
            value={filterExistencia}
            onChange={(e) => setFilterExistencia(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
          >
            <option value="">Todas</option>
            <option value="con_stock">Con Stock</option>
            <option value="sin_stock">Sin Stock</option>
          </select>
        </div>
      </div>

      {/* Filtros de categoría y subcategoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          {isLoadingCategories ? (
            <div className="flex items-center gap-2 text-gray-500">
              <FaSpinner className="animate-spin" />
              <span>Cargando categorías...</span>
            </div>
          ) : (
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                onSearch();
              }}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.inv_gru_cod} value={cat.inv_gru_cod}>
                  {cat.inv_gru_nom}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Subcategoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategoría
          </label>
          {isLoadingSubcategories ? (
            <div className="flex items-center gap-2 text-gray-500">
              <FaSpinner className="animate-spin" />
              <span>Cargando subcategorías...</span>
            </div>
          ) : (
            <select
              value={selectedSubcategory}
              onChange={(e) => {
                setSelectedSubcategory(e.target.value);
                onSearch();
              }}
              className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#f58ea3] focus:border-transparent transition-all duration-200"
              disabled={!selectedCategory}
            >
              <option value="">Todas las subcategorías</option>
              {subcategories.map(sub => (
                <option key={sub.inv_sub_gru_cod} value={sub.inv_sub_gru_cod}>
                  {sub.inv_sub_gru_nom}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filters;
