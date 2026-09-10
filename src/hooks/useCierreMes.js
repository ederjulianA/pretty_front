import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import * as cierreMesService from '../services/cierreMesService';
import { esPedidoResuelto } from '../components/cierreMes/formato';

const TOTAL_PASOS = 4;

const mensajeError = (error, fallback) =>
  error.response?.data?.error || error.response?.data?.message || error.message || fallback;

export const useCierreMes = () => {
  const hoy = useMemo(() => new Date(), []);
  const mesAnterior = useMemo(() => new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), [hoy]);

  const [anio, setAnio] = useState(mesAnterior.getFullYear());
  const [mes, setMes] = useState(mesAnterior.getMonth() + 1);

  const [validacion, setValidacion] = useState(null);
  const [validando, setValidando] = useState(false);

  const [preflight, setPreflight] = useState(null);
  const [loadingPreflight, setLoadingPreflight] = useState(false);
  const [errorPreflight, setErrorPreflight] = useState(null);

  const [pasoActual, setPasoActual] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [progresoSync, setProgresoSync] = useState(null);

  useEffect(() => {
    let cancelado = false;
    setValidando(true);
    setValidacion(null);
    setPreflight(null);

    cierreMesService
      .validarPeriodo(anio, mes)
      .then((data) => {
        if (!cancelado) setValidacion(data);
      })
      .catch((error) => {
        if (!cancelado) {
          setValidacion({
            puede_cerrar: false,
            codigo: 'ERROR',
            motivo: mensajeError(error, 'No se pudo validar el periodo'),
          });
        }
      })
      .finally(() => {
        if (!cancelado) setValidando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [anio, mes]);

  const cargarPreflight = useCallback(async () => {
    setLoadingPreflight(true);
    setErrorPreflight(null);
    try {
      const data = await cierreMesService.obtenerPreflight(anio, mes);
      setPreflight(data);
      return data;
    } catch (error) {
      setErrorPreflight(mensajeError(error, 'No se pudo cargar la informacion del periodo'));
      return null;
    } finally {
      setLoadingPreflight(false);
    }
  }, [anio, mes]);

  const ejecutar = useCallback(
    async (operacion, fallback) => {
      setProcesando(true);
      try {
        const data = await operacion();
        await cargarPreflight();
        return data;
      } catch (error) {
        toast.error(mensajeError(error, fallback));
        return null;
      } finally {
        setProcesando(false);
      }
    },
    [cargarPreflight]
  );

  const sincronizarFaltantes = useCallback(async () => {
    setProcesando(true);
    setProgresoSync({ actual: 0, total: 0, estado: null });
    try {
      const estados = preflight?.pedidos?.woo_estados ?? [];
      const reporte = await cierreMesService.sincronizarFaltantes(anio, mes, estados, setProgresoSync);
      await cargarPreflight();
      return reporte;
    } catch (error) {
      toast.error(mensajeError(error, 'Fallo la sincronizacion con WooCommerce'));
      return null;
    } finally {
      setProgresoSync(null);
      setProcesando(false);
    }
  }, [anio, mes, preflight, cargarPreflight]);

  const actualizarEstadoMasivo = useCallback(
    (facSecs, accion) =>
      ejecutar(
        () => cierreMesService.actualizarEstadoMasivo(facSecs, accion),
        'No se pudo actualizar el estado de los pedidos'
      ),
    [ejecutar]
  );

  const facturarBloque = useCallback(
    (facSecs) =>
      ejecutar(() => cierreMesService.facturarBloque(facSecs), 'No se pudieron generar las facturas'),
    [ejecutar]
  );

  const anularBloque = useCallback(
    (facSecs, observacion) =>
      ejecutar(
        () => cierreMesService.anularBloque(facSecs, observacion),
        'No se pudieron anular las cotizaciones'
      ),
    [ejecutar]
  );

  const generarCierre = useCallback(
    async (cieObs) => {
      setProcesando(true);
      try {
        const data = await cierreMesService.generarCierre({ anio, mes, cieObs });
        return { ok: true, data };
      } catch (error) {
        const payload = error.response?.data;
        return {
          ok: false,
          codigo: payload?.codigo ?? 'ERROR',
          mensaje: mensajeError(error, 'No se pudo generar el cierre'),
          pendientes: payload?.pendientes ?? null,
          cierreExistente: payload?.cierre_existente ?? null,
        };
      } finally {
        setProcesando(false);
      }
    },
    [anio, mes]
  );

  const pedidosSinResolver = useMemo(
    () => (preflight?.pedidos?.items ?? []).filter((p) => !esPedidoResuelto(p)),
    [preflight]
  );

  const cotizacionesPendientes = useMemo(
    () => preflight?.cotizaciones?.items ?? [],
    [preflight]
  );
  const wooDisponible = preflight?.pedidos?.woo_disponible !== false;

  // Con WooCommerce caido no se bloquea la navegacion: los pasos 3 y 4 son
  // locales. Solo se impide generar el cierre si quedan documentos sin resolver.
  const puedeAvanzar = useMemo(() => {
    if (pasoActual === 1) return validacion?.puede_cerrar === true;
    if (pasoActual === 2 || pasoActual === 3) return !loadingPreflight && !!preflight;
    return false;
  }, [pasoActual, validacion, loadingPreflight, preflight]);

  const bloqueoCierre = useMemo(() => {
    if (cotizacionesPendientes.length > 0) {
      return { paso: 3, motivo: `Quedan ${cotizacionesPendientes.length} cotizacion(es) sin facturar` };
    }
    if (pedidosSinResolver.length > 0) {
      return { paso: 2, motivo: `Quedan ${pedidosSinResolver.length} pedido(s) sin resolver` };
    }
    return null;
  }, [cotizacionesPendientes, pedidosSinResolver]);

  const avanzar = useCallback(() => setPasoActual((p) => Math.min(p + 1, TOTAL_PASOS)), []);
  const retroceder = useCallback(() => setPasoActual((p) => Math.max(p - 1, 1)), []);

  return {
    anio,
    mes,
    setAnio,
    setMes,
    validacion,
    validando,
    preflight,
    loadingPreflight,
    errorPreflight,
    cargarPreflight,
    sincronizarFaltantes,
    progresoSync,
    actualizarEstadoMasivo,
    facturarBloque,
    anularBloque,
    generarCierre,
    procesando,
    pasoActual,
    setPasoActual,
    avanzar,
    retroceder,
    puedeAvanzar,
    bloqueoCierre,
    pedidosSinResolver,
    cotizacionesPendientes,
    wooDisponible,
    totalPasos: TOTAL_PASOS,
  };
};

export default useCierreMes;
