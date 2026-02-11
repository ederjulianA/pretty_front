// src/hooks/useProducts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import axiosInstance from '../axiosConfig'; // Importa la instancia configurada


const useProducts = (filters, selectedCategory, selectedSubcategory) => {
  const { filterCodigo, filterNombre, filterExistencia } = filters;
  const [products, setProducts] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const fetchProducts = useCallback((page = 1) => {
    const token = localStorage.getItem('pedidos_pretty_token');
  
    setIsLoading(true);
    let tieneExistenciaParam;
    if (filterExistencia === 'con_stock') tieneExistenciaParam = 1;
    else if (filterExistencia === 'sin_stock') tieneExistenciaParam = 0;

    const params = {
      codigo: filterCodigo,
      nombre: filterNombre,
      PageNumber: page,
      PageSize: pageSize,
      ...(selectedCategory !== "todas" && { inv_gru_cod: selectedCategory }),
      ...(selectedSubcategory && { inv_sub_gru_cod: selectedSubcategory }),
      ...(filterExistencia === 'con_stock' && { tieneExistencia: 1 }),
      ...(filterExistencia === 'sin_stock' && { tieneExistencia: 0 }),
    };

    axiosInstance
      .get('articulos', {
        headers: {
          'x-access-token': token,
        },
        params,
      })
      .then((response) => {
        const data = response.data;
        if (data.success) {
          const mappedProducts = data.articulos.map((articulo) => ({
            id: articulo.art_sec,
            codigo: articulo.art_cod,
            name: articulo.art_nom,
            price: articulo.precio_mayor,
            price_detal: articulo.precio_detal,
            category: articulo.categoria + " - " + articulo.sub_categoria,
            sub_categoria: articulo.sub_categoria,
            existencia: articulo.existencia,
            art_woo_id: articulo.art_woo_id,
            imgUrl: articulo.art_url_img_servi,
            // Información de promociones
            tiene_oferta: articulo.tiene_oferta,
            precio_oferta: articulo.precio_oferta,
            descuento_porcentaje: articulo.descuento_porcentaje,
            pro_fecha_inicio: articulo.pro_fecha_inicio,
            pro_fecha_fin: articulo.pro_fecha_fin,
            codigo_promocion: articulo.codigo_promocion,
            descripcion_promocion: articulo.descripcion_promocion,
            precio_detal_original: articulo.precio_detal_original,
            precio_mayor_original: articulo.precio_mayor_original,
            // Bundle
            art_bundle: articulo.art_bundle,
          }));
          
          if (page === 1) {
            setProducts(mappedProducts);
          } else {
            setProducts((prev) => [...prev, ...mappedProducts]);
          }

          const hasMoreProducts = mappedProducts.length === pageSize;
          setHasMore(hasMoreProducts);
          setPageNumber(page);
        } else {
          setHasMore(false);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error al obtener productos:', error);
        setIsLoading(false);
        setHasMore(false);
      });
  }, [filterCodigo, filterNombre, filterExistencia, selectedCategory, selectedSubcategory, pageSize]);

  useEffect(() => {
    setProducts([]);
    setPageNumber(1);
    setHasMore(true);
    fetchProducts(1);
  }, [filterCodigo, filterNombre, filterExistencia, selectedCategory, selectedSubcategory, fetchProducts]);

  return { products, fetchProducts, pageNumber, hasMore, isLoading, setProducts };
};

export default useProducts;
