// src/hooks/useParametro.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const useParametro = (paramCod) => {
  const [valor, setValor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchParametro = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/parametros/${paramCod}`, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
        
        if (response.data.success && response.data.parametro) {
          setValor(response.data.parametro.par_value);
        } else {
          setValor(null);
        }
      } catch (error) {
        console.error(`Error al obtener parámetro ${paramCod}:`, error);
        setValor(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (paramCod) {
      fetchParametro();
    }
  }, [paramCod]);

  return { valor, isLoading };
};

export default useParametro;

