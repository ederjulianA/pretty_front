import axiosInstance from '../axiosConfig';

const BASE = '/cierre-mes';

const unwrap = (response) => response.data?.data;

export const listarCierres = async ({ page = 1, pageSize = 20 } = {}) => {
  const { data } = await axiosInstance.get(BASE, { params: { page, pageSize } });
  return {
    cierres: data?.data ?? [],
    pagination: data?.pagination ?? { page, pageSize, total: 0 },
  };
};

export const obtenerCierre = async (cieSec) =>
  unwrap(await axiosInstance.get(`${BASE}/${cieSec}`));

export const validarPeriodo = async (anio, mes) =>
  unwrap(await axiosInstance.get(`${BASE}/validar`, { params: { anio, mes } }));

export const obtenerPreflight = async (anio, mes) =>
  unwrap(await axiosInstance.get(`${BASE}/preflight`, { params: { anio, mes } }));

export const actualizarEstadoMasivo = async (facSecs, accion) =>
  unwrap(await axiosInstance.post(`${BASE}/pedidos/estado-masivo`, { fac_secs: facSecs, accion }));

export const facturarBloque = async (facSecs) =>
  unwrap(await axiosInstance.post(`${BASE}/cotizaciones/facturar-bloque`, { fac_secs: facSecs }));

export const anularBloque = async (facSecs, facObs) =>
  unwrap(await axiosInstance.post(`${BASE}/cotizaciones/anular-bloque`, { fac_secs: facSecs, fac_obs: facObs }));

export const generarCierre = async ({ anio, mes, cieObs }) =>
  unwrap(await axiosInstance.post(BASE, { anio, mes, cie_obs: cieObs?.trim() || null }));

export const anularCierre = async (cieSec, cieAnuObs) =>
  unwrap(await axiosInstance.post(`${BASE}/${cieSec}/anular`, { cie_anu_obs: cieAnuObs }));

export const obtenerComision = async (parCod) => {
  const { data } = await axiosInstance.get(`/parametros/${parCod}`);
  return data?.parametro?.par_value;
};

export const guardarComision = async (parCod, valor) => {
  const { data } = await axiosInstance.put(`/parametros/${parCod}`, { par_value: String(valor) });
  return data?.parametro;
};

export const rangoMes = (anio, mes) => {
  const mm = String(mes).padStart(2, '0');
  const ultimoDia = new Date(anio, mes, 0).getDate();
  return { desde: `${anio}-${mm}-01`, hasta: `${anio}-${mm}-${ultimoDia}` };
};

/**
 * El backend del cierre solo cuenta los pedidos de WooCommerce; no los importa.
 * `/woo/sync-orders` acepta un unico estado por llamada — WooCommerce rechaza la
 * lista separada por comas — asi que se recorre estado por estado.
 * Reemplazable por un unico POST /cierre-mes/sincronizar si el backend lo expone.
 */
export const sincronizarFaltantes = async (anio, mes, estados, onProgress) => {
  const { desde, hasta } = rangoMes(anio, mes);
  const lista = estados?.length ? estados : ['pending', 'processing', 'completed', 'on-hold'];
  const mensajes = [];
  let conError = 0;

  for (let i = 0; i < lista.length; i += 1) {
    const estado = lista[i];
    onProgress?.({ actual: i + 1, total: lista.length, estado });
    try {
      const { data } = await axiosInstance.post('/woo/sync-orders', {
        FechaDesde: desde,
        FechaHasta: hasta,
        Estado: estado,
      });
      (data?.messages ?? []).forEach((m) => mensajes.push({ ...m, estado }));
    } catch (error) {
      conError += 1;
      mensajes.push({
        estado,
        Type: 2,
        Description: error.response?.data?.message || error.message,
      });
    }
  }

  return { mensajes, estadosProcesados: lista.length, conError };
};
