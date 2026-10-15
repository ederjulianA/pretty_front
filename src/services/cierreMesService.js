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
