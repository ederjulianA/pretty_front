// src/hooks/usePersistentState.js
import { useState, useEffect } from 'react';

const usePersistentState = (key, initialValue) => {
  // Inicializa el estado leyendo de localStorage si existe
  const [state, setState] = useState(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue);
      } catch (error) {
        console.error(`Error al parsear localStorage para la clave "${key}":`, error);
      }
    }
    return initialValue;
  });

  // Actualiza localStorage cada vez que el estado cambie
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export default usePersistentState;
