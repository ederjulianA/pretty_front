// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosInstance from '../axiosConfig'; // Importa la instancia configurada


const useProducts = (filters, selectedCategory) => {
  const { filterCodigo, filterNombre, filterExistencia } = filters;
  const [products, setProducts] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const fetchProducts = useCallback((page = 1) => {
    const token = localStorage.getItem('pedidos_pretty_token');
  
    setIsLoading(true);
    axiosInstance
      .get('articulos', {
        headers: {
          'x-access-token': token,
        },
        params: {
          codigo: filterCodigo,
          nombre: filterNombre,
          tieneExistencia: filterExistencia,
          PageNumber: page,
          PageSize: pageSize,
          ...(selectedCategory !== "todas" && { inv_gru_cod: selectedCategory }),
        },
      })
      .then((response) => {
        const data = response.data;
        if (data.success) {
          const mappedProducts = data.articulos.map((articulo) => ({
            id: articulo.art_sec,
            codigo:articulo.art_cod,
            name: articulo.art_nom,
            price: articulo.precio_mayor,
            price_detal:articulo.precio_detal,
            category: articulo.categoria + " - " + articulo.sub_categoria,
            sub_categoria: articulo.sub_categoria,
            existencia: articulo.existencia,
            art_woo_id:articulo.art_woo_id,
            imgUrl: articulo.art_url_img_servi,
          }));
          if (page === 1) {
            setProducts(mappedProducts);
          } else {
            setProducts((prev) => [...prev, ...mappedProducts]);
          }
          setHasMore(mappedProducts.length >= pageSize);
          setPageNumber(page);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener productos:', error);
        setIsLoading(false);
      });
  }, [filterCodigo, filterNombre, filterExistencia, selectedCategory, pageSize]);

  useEffect(() => {
    // Reinicia la paginación cuando cambian los filtros o la categoría
    setProducts([]);
    setPageNumber(1);
    setHasMore(true);
    fetchProducts(1);
  }, [filterCodigo, filterNombre, filterExistencia, selectedCategory, fetchProducts]);

  return { products, fetchProducts, pageNumber, hasMore, isLoading };
};

export default useProducts;
