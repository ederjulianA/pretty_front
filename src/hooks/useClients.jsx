// src/hooks/useClients.js
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
const useClients = () => {
  const [clientResults, setClientResults] = useState([]);
  const [clientPageNumber, setClientPageNumber] = useState(1);
  const clientPageSize = 10;

  const fetchClients = (clientSearch, page = 1) => {
    console.log("buscando "+clientSearch);
    axios
      .get(`${API_URL}/nits`, {
        params: {
          nit_nom: clientSearch,
          pageNumber: page,
          pageSize: clientPageSize,
        },
      })
      .then((response) => {
        const data = response.data;
        if (data.success ) {
          setClientResults(data.nits);
          setClientPageNumber(page);
        }
      })
      .catch((error) => console.error('Error al obtener clientes:', error));
  };

  return { clientResults, fetchClients };
};

export default useClients;
