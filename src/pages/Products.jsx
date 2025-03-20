import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import useProducts from '../hooks/useProducts';
import ProductAdminCard from '../components/ProductAdminCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Products = () => {
  const navigate = useNavigate(); // Inicializa useNavigate
  const [filterCodigo, setFilterCodigo] = useState('');
  const [filterNombre, setFilterNombre] = useState('');
  const { products, fetchProducts, pageNumber, hasMore, isLoading } = useProducts(
    { filterCodigo, filterNombre, filterExistencia: '' },
    "todas"
  );

  const containerRef = useRef(null);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5 && !isLoading && hasMore) {
      fetchProducts(pageNumber + 1);
    }
  };

  const handleEdit = (product) => {
    // Navegar a la página de edición con el ID del producto
    navigate(`/products/edit/${product.id}`);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      <div className="p-4 bg-white shadow">
        <h2 className="text-2xl font-bold mb-4">Listado de Productos</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text"
              value={filterCodigo}
              onChange={(e) => setFilterCodigo(e.target.value)}
              placeholder="Código"
              className="p-2 border rounded cursor-pointer"
            />
            <input 
              type="text"
              value={filterNombre}
              onChange={(e) => setFilterNombre(e.target.value)}
              placeholder="Nombre"
              className="p-2 border rounded cursor-pointer"
            />
          </div>
          <div className="mt-4 md:mt-0">
            {/* Al hacer click se navega a la ruta /products/new */}
            <button 
              onClick={() => navigate('/products/new')}
              className="bg-[#f58ea3] text-white px-4 py-2 rounded hover:bg-[#a5762f] transition cursor-pointer"
            >
              Agregar Nuevo Producto
            </button>
          </div>
        </div>
      </div>
      <div 
        ref={containerRef} 
        onScroll={handleScroll} 
        className="flex-1 p-4 overflow-y-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {products.map(product => (
            <ProductAdminCard 
              key={product.art_cod || product.id} 
              product={product} 
              onEdit={handleEdit} 
            />
          ))}
          {isLoading && (
            <div className="col-span-full flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
