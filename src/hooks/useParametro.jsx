// src/hooks/useParametro.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const useParametro = (paramCod) => {
  const [valor, setValor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParametro = useCallback(async () => {
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
  }, [paramCod]);

  useEffect(() => {
    if (paramCod) {
      fetchParametro();
    }
  }, [paramCod, fetchParametro]);

  return { valor, isLoading, refresh: fetchParametro };
};

export default useParametro;

