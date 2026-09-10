import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as cierreMesService from '../services/cierreMesService';

const mensajeError = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

export const useCierresHistorico = (pageSize = 20) => {
  const [cierres, setCierres] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchCierres = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await cierreMesService.listarCierres({ page, pageSize });
      setCierres(data.cierres);
      setPagination(data.pagination);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar los cierres'));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchCierres();
  }, [fetchCierres]);

  const fetchDetalle = useCallback(async (cieSec) => {
    try {
      return await cierreMesService.obtenerCierre(cieSec);
    } catch (err) {
      toast.error(mensajeError(err, 'No se pudo cargar el detalle del cierre'));
      return null;
    }
  }, []);

  const anularCierre = useCallback(
    async (cieSec, observacion) => {
      try {
        await cierreMesService.anularCierre(cieSec, observacion);
        toast.success('Cierre anulado correctamente');
        await fetchCierres();
        return true;
      } catch (err) {
        toast.error(mensajeError(err, 'No se pudo anular el cierre'));
        return false;
      }
    },
    [fetchCierres]
  );

  return {
    cierres,
    pagination,
    loading,
    error,
    page,
    setPage,
    refetch: fetchCierres,
    fetchDetalle,
    anularCierre,
  };
};

export default useCierresHistorico;
