import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { FaPlus, FaEdit, FaSearch, FaTimes, FaFolderOpen, FaLayerGroup, FaCheckCircle, FaChevronRight, FaBox } from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
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

  // Calcular estadísticas
  const syncedCategories = categories.filter(cat => cat.inv_gru_woo_id).length;
  const syncedSubcategories = subcategories.filter(sub => sub.inv_sub_gru_woo_id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef5f8] via-[#fef9fb] to-[#fff] p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header con glassmorphism */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl mb-6 p-4 sm:p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] bg-clip-text text-transparent flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#f58ea3] to-[#f7b3c2] p-3 rounded-xl shadow-lg">
                  <FaFolderOpen className="w-6 h-6 text-white" />
                </div>
                Gestión de Categorías
              </h1>
              <p className="text-sm text-gray-600 mt-2 ml-1">Administra las categorías y subcategorías de productos</p>
            </div>
            <button
              onClick={handleCreateCategory}
              className="group bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] hover:from-[#f7b3c2] hover:to-[#f58ea3] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <FaPlus className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Nueva Categoría
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-purple-600 uppercase tracking-wide">Total Categorías</p>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{pagination?.totalRecords || 0}</p>
                </div>
                <div className="bg-purple-500 p-3 rounded-lg">
                  <FaFolderOpen className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Subcategorías</p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{subPagination?.totalRecords || 0}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <FaLayerGroup className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Sincronizadas</p>
                  <p className="text-2xl font-bold text-green-900 mt-1">{syncedCategories + syncedSubcategories}</p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <FaCheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Search mejorado */}
          <div className="mt-6 relative group">
            <input
              type="text"
              placeholder="Buscar categoría por nombre..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full p-4 pl-12 pr-12 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#f58ea3] focus:border-[#f58ea3] transition-all outline-none bg-white/50 backdrop-blur-sm hover:border-[#f7b3c2] group-hover:shadow-md"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-[#f58ea3] transition-colors" />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#f58ea3] hover:bg-[#fff5f7] p-2 rounded-lg transition-all"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumb visual cuando hay categoría seleccionada */}
        {selectedCategory && (
          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-md mb-4 p-4 border border-white/20 animate-fadeIn">
            <div className="flex items-center gap-2 text-sm">
              <FaBox className="text-[#f58ea3]" />
              <span className="text-gray-600">Navegación:</span>
              <span className="font-semibold text-gray-800">{selectedCategory.inv_gru_nom}</span>
              <FaChevronRight className="text-gray-400 text-xs" />
              <span className="text-[#f58ea3] font-medium">
                {subcategories.length} subcategoría{subcategories.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Layout de 2 columnas con glassmorphism */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel Categorías */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 transition-all hover:shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#f58ea3] to-[#f7b3c2] rounded-full"></div>
                Categorías
              </h2>
              {pagination && (
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                  {pagination.totalRecords} total
                </div>
              )}
            </div>

            {isLoading && page === 1 ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#fffafe] to-[#fff5f7] rounded-2xl border-2 border-dashed border-[#f5cad4]">
                <div className="bg-gradient-to-br from-[#f58ea3]/10 to-[#f7b3c2]/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaFolderOpen className="w-10 h-10 text-[#f58ea3]" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">No hay categorías disponibles</p>
                <p className="text-gray-500 text-sm mt-2">Crea tu primera categoría para comenzar</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((category) => (
                    <div
                      key={category.inv_gru_cod}
                      onClick={() => handleSelectCategory(category)}
                      className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer transform hover:scale-[1.02] ${
                        selectedCategory?.inv_gru_cod === category.inv_gru_cod
                          ? 'bg-gradient-to-br from-[#fff5f7] to-[#fffafe] border-[#f58ea3] shadow-lg ring-2 ring-[#f58ea3]/20'
                          : 'bg-white/70 backdrop-blur-sm border-gray-200 hover:border-[#f7b3c2] hover:shadow-md'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#f58ea3] transition-colors">
                              {category.inv_gru_nom}
                            </h3>
                            {category.inv_gru_woo_id && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg animate-pulse">
                                <FaCheckCircle className="w-3 h-3" />
                                <span className="text-xs font-medium">Sync</span>
                              </div>
                            )}
                          </div>
                          {category.inv_gru_des && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{category.inv_gru_des}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-semibold border border-purple-200">
                              #{category.inv_gru_cod}
                            </span>
                            {category.inv_gru_woo_id && (
                              <span className="text-xs bg-gradient-to-r from-green-100 to-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold border border-green-200">
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
                          className="p-3 text-[#f58ea3] hover:bg-[#fff5f7] rounded-xl transition-all ml-3 hover:scale-110 active:scale-95"
                          title="Editar"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination mejorada */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-3">
                    <button
                      onClick={() => fetchCategories(page - 1, searchTerm)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f58ea3] hover:to-[#f7b3c2] hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Anterior
                    </button>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">
                        {pagination.currentPage} <span className="text-gray-400">de</span> {pagination.totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchCategories(page + 1, searchTerm)}
                      disabled={!pagination.hasNextPage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f58ea3] hover:to-[#f7b3c2] hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel Subcategorías */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 border border-white/20 transition-all hover:shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#f58ea3] to-[#f7b3c2] rounded-full"></div>
                <FaLayerGroup className="text-[#f58ea3]" />
                Subcategorías
              </h2>
              {selectedCategory && (
                <button
                  onClick={handleCreateSubcategory}
                  className="group bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] hover:from-[#f7b3c2] hover:to-[#f58ea3] text-white font-semibold py-2 px-4 rounded-xl flex items-center text-sm transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                >
                  <FaPlus className="mr-2 w-3 h-3 group-hover:rotate-90 transition-transform duration-300" />
                  Nueva
                </button>
              )}
            </div>

            {!selectedCategory ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#fffafe] to-[#fff5f7] rounded-2xl border-2 border-dashed border-[#f5cad4]">
                <div className="bg-gradient-to-br from-[#f58ea3]/10 to-[#f7b3c2]/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <FaLayerGroup className="w-10 h-10 text-[#f58ea3]" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">Selecciona una categoría</p>
                <p className="text-gray-500 text-sm mt-2">para ver y gestionar sus subcategorías</p>
              </div>
            ) : isLoadingSubcategories ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : subcategories.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-[#fffafe] to-[#fff5f7] rounded-2xl border-2 border-dashed border-[#f5cad4]">
                <div className="bg-gradient-to-br from-[#f58ea3]/10 to-[#f7b3c2]/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FaLayerGroup className="w-10 h-10 text-[#f58ea3]" />
                </div>
                <p className="text-gray-700 font-semibold text-lg">No hay subcategorías</p>
                <p className="text-gray-500 text-sm mt-2">en "{selectedCategory.inv_gru_nom}"</p>
                <button
                  onClick={handleCreateSubcategory}
                  className="mt-4 bg-gradient-to-r from-[#f58ea3] to-[#f7b3c2] text-white font-semibold py-2 px-4 rounded-xl hover:scale-105 transition-all shadow-md"
                >
                  Crear primera subcategoría
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-800 font-semibold flex items-center gap-2">
                    <FaFolderOpen className="text-purple-600" />
                    Categoría: {selectedCategory.inv_gru_nom}
                  </p>
                </div>
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-2 custom-scrollbar">
                  {subcategories.map((subcategory) => (
                    <div
                      key={subcategory.inv_sub_gru_cod}
                      className="group p-5 rounded-2xl border-2 border-gray-200 bg-white/70 backdrop-blur-sm hover:border-[#f7b3c2] hover:shadow-md transition-all transform hover:scale-[1.02]"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 text-base group-hover:text-[#f58ea3] transition-colors">
                              {subcategory.inv_sub_gru_nom}
                            </h3>
                            {subcategory.inv_sub_gru_woo_id && (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-lg animate-pulse">
                                <FaCheckCircle className="w-3 h-3" />
                                <span className="text-xs font-medium">Sync</span>
                              </div>
                            )}
                          </div>
                          {subcategory.inv_sub_gru_des && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{subcategory.inv_sub_gru_des}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold border border-blue-200">
                              #{subcategory.inv_sub_gru_cod}
                            </span>
                            {subcategory.inv_sub_gru_woo_id && (
                              <span className="text-xs bg-gradient-to-r from-green-100 to-green-50 text-green-700 px-3 py-1.5 rounded-lg font-semibold border border-green-200">
                                WooCommerce: {subcategory.inv_sub_gru_woo_id}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditSubcategory(subcategory)}
                          className="p-3 text-[#f58ea3] hover:bg-[#fff5f7] rounded-xl transition-all ml-3 hover:scale-110 active:scale-95"
                          title="Editar"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subcategories Pagination mejorada */}
                {subPagination && subPagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-3">
                    <button
                      onClick={() => fetchSubcategories(selectedCategory.inv_gru_cod, subPage - 1)}
                      disabled={!subPagination.hasPreviousPage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f58ea3] hover:to-[#f7b3c2] hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                    >
                      Anterior
                    </button>
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                      <span className="text-sm font-semibold text-gray-700">
                        {subPagination.currentPage} <span className="text-gray-400">de</span> {subPagination.totalPages}
                      </span>
                    </div>
                    <button
                      onClick={() => fetchSubcategories(selectedCategory.inv_gru_cod, subPage + 1)}
                      disabled={!subPagination.hasNextPage}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#f58ea3] hover:to-[#f7b3c2] hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f58ea3, #f7b3c2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #f7b3c2, #f58ea3);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Categories;
