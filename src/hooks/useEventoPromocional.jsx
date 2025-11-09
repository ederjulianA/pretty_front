// src/hooks/useEventoPromocional.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const useEventoPromocional = () => {
  const [evento, setEvento] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEventoActivo = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/eventos-promocionales/activo`, {
          headers: { 'x-access-token': localStorage.getItem('pedidos_pretty_token') }
        });
        
        if (response.data.success && response.data.evento) {
          setEvento(response.data.evento);
        } else {
          setEvento(null);
        }
      } catch (error) {
        console.error('Error al obtener evento promocional activo:', error);
        setEvento(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventoActivo();
  }, []);

  return { evento, isLoading };
};

export default useEventoPromocional;

