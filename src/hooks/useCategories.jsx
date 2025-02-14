// src/hooks/useCategories.js
import { useState, useEffect } from 'react';
import axios from 'axios';

const useCategories = () => {
  const [categories, setCategories] = useState([]);

  const fetchCategories = () => {
    axios
      .get('http://192.168.1.7:3000/api/categorias')
      .then((response) => {
        const data = response.data;
        if (data.success && data.result && data.result.data) {
          const mappedCategories = data.result.data.map((cat) => ({
            id: cat.inv_gru_cod,
            name: cat.inv_gru_nom,
          }));
          setCategories([{ id: "todas", name: "Todas" }, ...mappedCategories]);
        }
      })
      .catch((error) => console.error('Error al obtener categorías:', error));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories };
};

export default useCategories;
