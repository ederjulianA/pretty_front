import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEdit, FaSearch, FaTimes, FaFolderOpen, FaLayerGroup, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import debounce from 'lodash/debounce';
import CategoryModal from '../components/category/CategoryModal';
import SubcategoryModal from '../components/category/SubcategoryModal';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [subPagination, setSubPagination] = useState(null);
  const [subPage, setSubPage] = useState(1);

  // Modales
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubcategory, setEditingSubcategory] = useState(null);

  const limit = 15;

  // Fetch categories
  const fetchCategories = useCallback(async (currentPage = 1, search = '') => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.get(`${API_URL}/categorias`, {
        params: {
          page: currentPage,
          limit,
          inv_gru_nom: search || undefined,
        },
        headers: { 'x-access-token': token }
      });

      if (response.data.success) {
        setCategories(response.data.data || []);
        setPagination(response.data.pagination);
        setPage(currentPage);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch subcategories for selected category
  const fetchSubcategories = useCallback(async (categoryId, currentPage = 1) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    setIsLoadingSubcategories(true);
    try {
      const token = localStorage.getItem('pedidos_pretty_token');
      const response = await axios.get(`${API_URL}/subcategorias`, {
        params: {
          inv_gru_cod: categoryId,
          page: currentPage,
          limit: 10,
        },
        headers: { 'x-access-token': token }
      });

      if (response.data.success) {
        setSubcategories(response.data.data || []);
        setSubPagination(response.data.pagination);
        setSubPage(currentPage);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast.error('Error al cargar subcategorías');
    } finally {
      setIsLoadingSubcategories(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      fetchCategories(1, value);
    }, 500),
    [fetchCategories]
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.inv_gru_cod, 1);
    }
  }, [selectedCategory, fetchSubcategories]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchCategories(1, '');
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCreateSubcategory = () => {
    if (!selectedCategory) {
      toast.warning('Selecciona una categoría primero');
      return;
    }
    setEditingSubcategory(null);
    setIsSubcategoryModalOpen(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setIsSubcategoryModalOpen(true);
  };

  const handleCategorySaved = () => {
    fetchCategories(page, searchTerm);
    setIsCategoryModalOpen(false);
  };

  const handleSubcategorySaved = () => {
    if (selectedCategory) {
      fetchSubcategories(selectedCategory.inv_gru_cod, subPage);
    }
    setIsSubcategoryModalOpen(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#f58ea3] flex items-center gap-2">
                <FaFolderOpen className="w-6 h-6" />
                Gestión de Categorías
              </h1>
              <p className="text-sm text-gray-500 mt-1">Administra las categorías y subcategorías de productos</p>
            </div>
            <button
              onClick={handleCreateCategory}
              className="bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] hover:from-[#f7b3c2] hover:to-[#f58ea3] text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center text-sm transition-all shadow-md hover:shadow-lg"
            >
              <FaPlus className="mr-2" /> Nueva Categoría
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <input
              type="text"
              placeholder="Buscar categoría por nombre..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-3 pl-10 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-colors outline-none"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Layout de 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Panel Categorías */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Categorías</h2>
              {pagination && (
                <span className="text-sm text-gray-500">
                  {pagination.totalRecords} categorías
                </span>
              )}
            </div>

            {isLoading && page === 1 ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12 bg-[#fffafe] rounded-xl border border-dashed border-[#f5cad4]">
                <FaFolderOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay categorías disponibles</p>
                <p className="text-gray-400 text-sm mt-1">Crea tu primera categoría</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {categories.map((category) => (
                    <div
                      key={category.inv_gru_cod}
                      onClick={() => handleSelectCategory(category)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedCategory?.inv_gru_cod === category.inv_gru_cod
                          ? 'bg-[#fff5f7] border-[#f58ea3] shadow-md'
                          : 'bg-white border-gray-200 hover:border-[#f7b3c2] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-800">{category.inv_gru_nom}</h3>
                            {category.inv_gru_woo_id && (
                              <FaCheckCircle className="text-green-500 w-4 h-4" title="Sincronizado con WooCommerce" />
                            )}
                          </div>
                          {category.inv_gru_des && (
                            <p className="text-sm text-gray-600 line-clamp-2">{category.inv_gru_des}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              Código: {category.inv_gru_cod}
                            </span>
                            {category.inv_gru_woo_id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                WooCommerce: {category.inv_gru_woo_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(category);
                          }}
                          className="p-2 text-[#f58ea3] hover:bg-[#fff5f7] rounded-lg transition-colors ml-2"
                          title="Editar"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => fetchCategories(page - 1, searchTerm)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchCategories(page + 1, searchTerm)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel Subcategorías */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaLayerGroup className="w-5 h-5 text-[#f58ea3]" />
                Subcategorías
              </h2>
              {selectedCategory && (
                <button
                  onClick={handleCreateSubcategory}
                  className="bg-[#f58ea3] hover:bg-[#f7b3c2] text-white font-semibold py-1.5 px-3 rounded-lg flex items-center text-sm transition-colors shadow-sm"
                >
                  <FaPlus className="mr-1 w-3 h-3" /> Nueva
                </button>
              )}
            </div>

            {!selectedCategory ? (
              <div className="text-center py-12 bg-[#fffafe] rounded-xl border border-dashed border-[#f5cad4]">
                <FaLayerGroup className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Selecciona una categoría</p>
                <p className="text-gray-400 text-sm mt-1">para ver sus subcategorías</p>
              </div>
            ) : isLoadingSubcategories ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-12 bg-[#fffafe] rounded-xl border border-dashed border-[#f5cad4]">
                <FaLayerGroup className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No hay subcategorías</p>
                <p className="text-gray-400 text-sm mt-1">en "{selectedCategory.inv_gru_nom}"</p>
              </div>
            ) : (
              <>
                <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 font-medium">
                    Categoría: {selectedCategory.inv_gru_nom}
                  </p>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory.inv_sub_gru_cod}
                      className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#f7b3c2] hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800">{subcategory.inv_sub_gru_nom}</h3>
                            {subcategory.inv_sub_gru_woo_id && (
                              <FaCheckCircle className="text-green-500 w-4 h-4" title="Sincronizado con WooCommerce" />
                            )}
                          </div>
                          {subcategory.inv_sub_gru_des && (
                            <p className="text-sm text-gray-600 line-clamp-2">{subcategory.inv_sub_gru_des}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                              Código: {subcategory.inv_sub_gru_cod}
                            </span>
                            {subcategory.inv_sub_gru_woo_id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                WooCommerce: {subcategory.inv_sub_gru_woo_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="p-2 text-[#f58ea3] hover:bg-[#fff5f7] rounded-lg transition-colors ml-2"
                          title="Editar"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subcategories Pagination */}
                {subPagination && subPagination.totalPages > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => fetchSubcategories(selectedCategory.inv_gru_cod, subPage - 1)}
                      disabled={!subPagination.hasPreviousPage}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-600">
                      Página {subPagination.currentPage} de {subPagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchSubcategories(selectedCategory.inv_gru_cod, subPage + 1)}
                      disabled={!subPagination.hasNextPage}
                      className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory}
        onSave={handleCategorySaved}
      />

      <SubcategoryModal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        subcategory={editingSubcategory}
        parentCategory={selectedCategory}
        onSave={handleSubcategorySaved}
      />
    </div>
  );
};

export default Categories;
