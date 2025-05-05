import React, { useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

const ProductsGrid = ({ products, onAdd, isLoading, order, hasMore, onLoadMore }) => {
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    }, options);

    if (loadingRef.current) {
      observerRef.current.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  return (
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
      <div ref={loadingRef} className="col-span-2 sm:col-span-3 lg:col-span-4">
        {isLoading && (
          <div className="flex justify-center items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f58ea3]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsGrid;
