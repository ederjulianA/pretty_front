import React from 'react';
import ProductCard from './ProductCard';

const ProductsGrid = ({ products, onAdd, isLoading, order }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
    {products.map((product) => {
      const orderItem = order.find(item => item.id === product.id);
      const orderQuantity = orderItem ? orderItem.quantity : 0;
      return (
        <ProductCard 
          key={product.id} 
          product={product} 
          onAdd={onAdd} 
          orderQuantity={orderQuantity} 
        />
      );
    })}
    {isLoading && (
      <div className="col-span-2 sm:col-span-3 lg:col-span-4 text-center py-4 cursor-pointer">
        <span className="text-gray-500">Cargando...</span>
      </div>
    )}
  </div>
);

export default ProductsGrid;
