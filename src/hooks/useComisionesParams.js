import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import * as cierreMesService from '../services/cierreMesService';

const DEFAULTS = { woo: '5.0', local: '2.5' };

export const useComisionesParams = () => {
  const [comisionWoo, setComisionWoo] = useState(DEFAULTS.woo);
  const [comisionLocal, setComisionLocal] = useState(DEFAULTS.local);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [woo, local] = await Promise.all([
        cierreMesService.obtenerComision('comision_woo'),
        cierreMesService.obtenerComision('comision_local'),
      ]);
      setComisionWoo(woo ?? DEFAULTS.woo);
      setComisionLocal(local ?? DEFAULTS.local);
    } catch {
      // El backend cae a los valores historicos cuando el parametro falta.
      setComisionWoo(DEFAULTS.woo);
      setComisionLocal(DEFAULTS.local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardar = useCallback(async ({ woo, local }) => {
    const valores = [Number(woo), Number(local)];
    if (valores.some((v) => !Number.isFinite(v) || v < 0 || v > 100)) {
      toast.error('Los porcentajes deben estar entre 0 y 100');
      return false;
    }

    setGuardando(true);
    try {
      await Promise.all([
        cierreMesService.guardarComision('comision_woo', woo),
        cierreMesService.guardarComision('comision_local', local),
      ]);
      setComisionWoo(String(woo));
      setComisionLocal(String(local));
      toast.success('Porcentajes de comision actualizados');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || 'No se pudieron guardar los porcentajes');
      return false;
    } finally {
      setGuardando(false);
    }
  }, []);

  return { comisionWoo, comisionLocal, loading, guardando, guardar, recargar: cargar };
};

export default useComisionesParams;
