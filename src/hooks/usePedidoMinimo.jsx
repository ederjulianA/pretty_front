// src/hooks/usePedidoMinimo.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const usePedidoMinimo = () => {
  const [pedidoMinimo, setPedidoMinimo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`${API_URL}/parametros/pedido-minimo`)
      .then((response) => {
        const data = response.data;
        if (data.success) {
          setPedidoMinimo(data.pedido_minimo);
        }
      })
      .catch((err) => {
        console.error('Error al obtener pedido mínimo:', err);
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { pedidoMinimo, isLoading, error };
};

export default usePedidoMinimo;
