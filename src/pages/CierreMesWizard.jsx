import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCierreMes } from '../hooks/useCierreMes';
import StepperCierre from '../components/cierreMes/StepperCierre';
import PasoSeleccionPeriodo from '../components/cierreMes/PasoSeleccionPeriodo';
import PasoPedidos from '../components/cierreMes/PasoPedidos';
import PasoCotizaciones from '../components/cierreMes/PasoCotizaciones';
import PasoResumen from '../components/cierreMes/PasoResumen';
import { etiquetaPeriodo, formatCurrency } from '../components/cierreMes/formato';

const CierreMesWizard = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [observacion, setObservacion] = useState('');
  const [pasoMaximo, setPasoMaximo] = useState(1);

  const {
    anio, mes, setAnio, setMes,
    validacion, validando,
    preflight, loadingPreflight, errorPreflight, cargarPreflight,
    sincronizarFaltantes, progresoSync,
    actualizarEstadoMasivo, facturarBloque, anularBloque, generarCierre,
    procesando, pasoActual, setPasoActual, avanzar, retroceder,
    puedeAvanzar, bloqueoCierre,
  } = useCierreMes();

  useEffect(() => {
    setPasoMaximo((prev) => Math.max(prev, pasoActual));
  }, [pasoActual]);

  // El preflight alimenta los pasos 2, 3 y 4; se pide al salir de la seleccion.
  useEffect(() => {
    if (pasoActual >= 2 && !preflight && !loadingPreflight && !errorPreflight) {
      cargarPreflight();
    }
  }, [pasoActual, preflight, loadingPreflight, errorPreflight, cargarPreflight]);

  const irAPaso = (paso) => {
    if (paso <= pasoMaximo) setPasoActual(paso);
  };

  const handleGenerar = async () => {
    const totales = preflight?.resumen?.totales;
    const confirmacion = await Swal.fire({
      title: `Cerrar ${etiquetaPeriodo(anio, mes)}`,
      html: `
        <div style="text-align:left;font-size:14px">
          <p><b>${totales?.ordenes ?? 0}</b> facturas</p>
          <p>Ventas: <b>${formatCurrency(totales?.ventas)}</b></p>
          <p>Comision: <b>${formatCurrency(totales?.comision)}</b></p>
        </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Generar cierre',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f58ea3',
    });
    if (!confirmacion.isConfirmed) return;

    const resultado = await generarCierre(observacion);

    if (resultado.ok) {
      toast.success(`Cierre de ${etiquetaPeriodo(anio, mes)} generado`);
      navigate('/cierre-mes', { state: { cierreNuevo: resultado.data.cie_sec } });
      return;
    }

    if (resultado.codigo === 'PERIODO_CON_PENDIENTES') {
      const { pendientes } = resultado;
      const listaCot = (pendientes?.cotizaciones ?? []).map((c) => c.fac_nro).join(', ');
      const listaPed = (pendientes?.pedidos ?? []).map((p) => `${p.fac_nro} (${p.fac_est_woo ?? 'sin estado'})`).join(', ');
      const paso = pendientes?.cotizaciones_sin_facturar > 0 ? 3 : 2;

      await Swal.fire({
        title: 'El periodo tiene documentos sin resolver',
        html: `
          <div style="text-align:left;font-size:14px">
            ${pendientes?.cotizaciones_sin_facturar > 0
              ? `<p><b>${pendientes.cotizaciones_sin_facturar}</b> cotizacion(es) sin facturar:<br/>${listaCot}</p>` : ''}
            ${pendientes?.pedidos_sin_confirmar > 0
              ? `<p style="margin-top:8px"><b>${pendientes.pedidos_sin_confirmar}</b> pedido(s) sin confirmar:<br/>${listaPed}</p>` : ''}
          </div>`,
        icon: 'warning',
        confirmButtonText: `Ir al paso ${paso}`,
        confirmButtonColor: '#f58ea3',
      });

      await cargarPreflight();
      setPasoActual(paso);
      return;
    }

    if (resultado.codigo === 'CIERRE_EXISTENTE') {
      await Swal.fire({
        title: 'El periodo ya fue cerrado',
        text: resultado.cierreExistente
          ? `Otro usuario (${resultado.cierreExistente.cie_usu_cod}) acaba de cerrar este periodo.`
          : resultado.mensaje,
        icon: 'info',
        confirmButtonColor: '#f58ea3',
      });
      navigate('/cierre-mes');
      return;
    }

    toast.error(resultado.mensaje);
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Cierre de Mes</h1>
          <p className="text-sm text-gray-500">{etiquetaPeriodo(anio, mes)}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cierre-mes')}
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Volver al listado
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-4 sm:p-6 space-y-6">
        <StepperCierre pasoActual={pasoActual} onIrAPaso={irAPaso} pasoMaximoAlcanzado={pasoMaximo} />

        {errorPreflight && pasoActual >= 2 && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">{errorPreflight}</p>
            <button type="button" onClick={cargarPreflight} className="underline font-medium mt-1">
              Reintentar
            </button>
          </div>
        )}

        {pasoActual === 1 && (
          <PasoSeleccionPeriodo
            anio={anio}
            mes={mes}
            onAnioChange={setAnio}
            onMesChange={setMes}
            validacion={validacion}
            validando={validando}
          />
        )}

        {pasoActual === 2 && (
          <PasoPedidos
            pedidos={preflight?.pedidos}
            loading={loadingPreflight}
            procesando={procesando}
            progresoSync={progresoSync}
            onSincronizar={sincronizarFaltantes}
            onActualizarEstado={actualizarEstadoMasivo}
          />
        )}

        {pasoActual === 3 && (
          <PasoCotizaciones
            cotizaciones={preflight?.cotizaciones}
            loading={loadingPreflight}
            procesando={procesando}
            onFacturar={facturarBloque}
            onAnular={anularBloque}
          />
        )}

        {pasoActual === 4 && (
          <PasoResumen
            anio={anio}
            mes={mes}
            resumen={preflight?.resumen}
            loading={loadingPreflight}
            procesando={procesando}
            puedeEditarComisiones={hasPermission('cierre_mes', 'edit')}
            bloqueoCierre={bloqueoCierre}
            observacion={observacion}
            onObservacionChange={setObservacion}
            onGenerar={handleGenerar}
            onIrAPaso={setPasoActual}
            onComisionesGuardadas={cargarPreflight}
          />
        )}

        {pasoActual < 4 && (
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={retroceder}
              disabled={pasoActual === 1}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
            >
              <FaArrowLeft /> Atras
            </button>
            <button
              type="button"
              onClick={avanzar}
              disabled={!puedeAvanzar}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[#f58ea3] hover:bg-[#e57d92] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <FaArrowRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CierreMesWizard;
