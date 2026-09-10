# Implementación: Cierre de Mes

**Fecha de implementación:** 09/09/2026
**Estado:** Completado (frontend)
**Contrato de referencia:** `api_pretty/implementaciones_ia_2026/cierre_de_mes_09-09-2026/IMPLEMENTACION_BACKEND.md` — manda sobre el SPEC y la SOLICITUD_BACKEND de esta carpeta.

## Archivos Creados

| Archivo | Descripción |
|---|---|
| `src/services/cierreMesService.js` | Las 9 llamadas a `/api/cierre-mes`, lectura/escritura de comisiones en `/api/parametros`, y `sincronizarFaltantes` |
| `src/hooks/useCierreMes.js` | Estado del wizard: período, validación, preflight, operaciones masivas, generación y reglas de avance |
| `src/hooks/useCierresHistorico.js` | Listado paginado, detalle y anulación de cierres |
| `src/hooks/useComisionesParams.js` | Lectura/escritura de `comision_woo` y `comision_local` |
| `src/pages/CierreMes.jsx` | Listado histórico con detalle y anulación |
| `src/pages/CierreMesWizard.jsx` | Contenedor del wizard de 4 pasos |
| `src/components/cierreMes/formato.js` | Moneda, número, porcentaje, fecha y etiqueta de período |
| `src/components/cierreMes/StepperCierre.jsx` | Indicador de pasos, navegable hacia atrás |
| `src/components/cierreMes/TablaSeleccionable.jsx` | Grilla genérica con checkbox y "seleccionar todos" |
| `src/components/cierreMes/PasoSeleccionPeriodo.jsx` | Paso 1 |
| `src/components/cierreMes/PasoPedidos.jsx` | Paso 2 |
| `src/components/cierreMes/PasoCotizaciones.jsx` | Paso 3 |
| `src/components/cierreMes/PasoResumen.jsx` | Paso 4 |
| `src/components/cierreMes/ResumenCanalesTabla.jsx` | Tabla por canal, reutilizada en el paso 4 y en el detalle |
| `src/components/cierreMes/ObservacionModal.jsx` | Textarea con mínimo de 10 caracteres |
| `src/components/cierreMes/ResultadoBloqueModal.jsx` | Reporte fila a fila de operaciones masivas |
| `src/components/cierreMes/ComisionesConfigModal.jsx` | Edición de los porcentajes |
| `src/components/cierreMes/CierreDetalleModal.jsx` | Drill-down: resumen + facturas incluidas |

## Archivos Modificados

- `src/App.jsx` — líneas 32-33: imports. Líneas 159-175: rutas `cierre-mes` (`view`) y `cierre-mes/nuevo` (`create`).
- `src/layouts/AdminLayout.jsx` — línea 5: import de `FaFileInvoiceDollar`. Líneas 71-72: breadcrumbs. Líneas 381-398: entrada de menú tras `hasAccess('cierre_mes')`.
- `src/pages/RoleManager.jsx` — línea 18: módulo `cierre_mes` con `view/create/edit/delete`.

## Desviaciones del SPEC

Las cinco primeras responden a diferencias del contrato del backend respecto de lo que este SPEC había asumido.

1. **El wizard dejó de ser estrictamente bloqueante.** El SPEC (§4.2, §4.3) impedía avanzar mientras quedaran pendientes. Con `woo_disponible: false` el backend devuelve `faltantes: null`, así que el paso 2 nunca podría darse por resuelto y los pasos 3 y 4 —que son 100 % locales— quedarían inalcanzables. **Decisión del usuario:** el paso 2 no bloquea la navegación; muestra banner ámbar con "Reintentar", deshabilita sincronización y acciones masivas, y permite continuar. El guardián pasa a ser el botón **Generar Cierre**, deshabilitado mientras `bloqueoCierre` detecte pendientes, con enlace directo al paso que corresponda.

2. **`rentabilidad` se muestra como moneda, no como porcentaje.** El backend la devuelve en pesos (`SUM(utilidad_linea)`). `DashboardVentas.jsx:722-729` muestra `rentabilidad_promedio` como porcentaje con semáforo de colores; replicarlo habría sido incorrecto. La columna se titula **"Utilidad"** y usa `formatCurrency`, sin semáforo. Los nombres de campo tampoco coinciden con los del dashboard (`ordenes`/`ventas`/`comision` vs `numero_ordenes`/`ventas_totales`/`comision_venta`), por lo que se escribió una tabla propia en vez de reutilizar la existente.

3. **Criterio de aceptación #9 del SPEC anulado.** Decía que el resumen del paso 4 debía coincidir cifra por cifra con `/dashboard/ventas`. No puede cumplirse: por el off-by-one de fechas de `ventasKpiController.js:115`, julio 2026 da 37 órdenes / $6.989.888 en el dashboard contra 36 / $6.879.088 en el cierre. El paso 4 lleva una nota al pie aclarando que las cifras válidas son las del cierre, y no se enlaza ni se compara con el dashboard desde esa pantalla.

4. **Manejo del 422 `PERIODO_CON_PENDIENTES`.** No estaba previsto en el SPEC. Se muestra un SweetAlert2 con los `fac_nro` concretos que devuelve el backend, se recarga el preflight y se devuelve al usuario al paso 2 o 3 según el tipo de pendiente.

5. **Emails de WooCommerce.** Se dejan activos (decisión previa del usuario). La confirmación del paso 2 advierte que el cliente recibirá la notificación estándar.

6. **"Sincronizar faltantes" se resolvió en el frontend.** El endpoint no existe en `/api/cierre-mes` — **fue una omisión de nuestra SOLICITUD_BACKEND.md**, no del backend: el SPEC §8 lo dio por resuelto con el `POST /woo/sync-orders` existente y por eso nunca se solicitó. Ese endpoint acepta **un solo estado por llamada** (WooCommerce rechaza la lista separada por comas, según advierte `cierreMesController.js:211`), así que `sincronizarFaltantes` recorre `pedidos.woo_estados` con una llamada por estado y barra de progreso. La lógica está aislada en una única función del servicio para poder migrarla a un solo request si el backend llega a exponerlo.

## Decisiones de UI no especificadas en el SPEC

- **Reintento de desincronizados:** cuando un ítem vuelve con `ok:true` + `woo:false` se pinta en ámbar con "Local actualizado · WooCommerce NO" y se ofrece reintentar solo esos `fac_sec`, reejecutando la acción original (no siempre "confirmar").
- **Comisiones:** tras guardar se hace *refetch* del preflight en lugar de recalcular en cliente, para que la cifra en pantalla sea la que el servidor va a persistir.
- **Permisos:** el modal de comisiones requiere `edit`; el botón de anular requiere `delete`; "Nuevo Cierre" requiere `create`. Sin el permiso, el control no se renderiza.
- **Stepper navegable hacia atrás** hasta el paso máximo alcanzado, para poder revisar sin rehacer el flujo.
- **Período por defecto:** el mes anterior al actual, que es el caso habitual.

## Verificación ejecutada

- `npm run build` → **777 módulos transformados, sin errores**.
- `npx eslint` sobre hooks y servicio → **0 problemas**.
- Los errores de `react/prop-types` y `'React' is defined but never used` en los componentes nuevos son de configuración del proyecto: archivos preexistentes (`Orders.jsx`, `DashboardVentas.jsx`, `SyncWooModal.jsx`) arrojan 25 errores de las mismas reglas.

## Pruebas Manuales Recomendadas

Servidor en puerto 5174 (`npm run dev`).

1. **RBAC:** entrar como **Vendedor** → la opción no debe aparecer en el menú y `/cierre-mes` debe redirigir a `/unauthorized`. Como **Administrador** o **Supervisor** debe verse completa.
2. **Validación de período:** seleccionar **septiembre 2026** (mes en curso) → mensaje `MES_NO_VENCIDO` y "Siguiente" deshabilitado. Seleccionar **julio 2026** → disponible.
3. **Paso 2 con datos reales de julio 2026:** deben verse 36 pedidos, `faltantes: 0`, y **2 sin confirmar** (COT1904 y COT1905, ambos `on_hold`) con checkbox. Los `processing` no deben traer checkbox.
4. **Acción masiva:** seleccionar COT1904 → "Confirmar pago" → verificar el modal de resultado y que el pedido pase a `completed` en WooCommerce.
5. **Paso 3:** debe aparecer **1 cotización pendiente (COT1912)**. Facturar y comprobar que el modal muestre el `fac_nro_generado` (`VTA####`).
6. **Cancelar cotización:** elegir "Cancelar" en el combo → el botón "Observaciones" se habilita → probar con menos de 10 caracteres (debe rechazar) y luego con un texto válido.
7. **Paso 4:** verificar WooCommerce 36 / $6.879.088, Local 12 / $1.781.930, total 48 / $8.661.018 y comisión $388.502,65. La columna Utilidad debe verse en pesos.
8. **422:** con una cotización sin facturar, pulsar "Generar Cierre" → debe listar el `fac_nro` concreto y devolver al paso 3.
9. **Cierre duplicado:** generar julio dos veces → segundo intento con `CIERRE_EXISTENTE` y redirección al listado.
10. **Anulación:** anular un cierre → debe quedar "Anulado" en el listado y el período liberado para volver a cerrarse.
11. **Woo caído:** detener WooCommerce o forzar el error → el paso 2 debe mostrar banner ámbar y **permitir avanzar** a los pasos 3 y 4.
12. **Responsive:** verificar el wizard y las grillas a ~400 px.

## Notas para el siguiente desarrollador

- **`fac_nro_origen` tiene semántica inversa:** se guarda en la **COT** apuntando a la VTA generada, y la COT permanece con `fac_est_fac='A'` tras facturarse. El backend ya expone el booleano `facturado`, así que el frontend no reimplementa esa regla.
- **`fac_est_woo` vive en la COT, no en la VTA.** La grilla del paso 2 se alimenta de cotizaciones, no de facturas.
- **Los estados de Woo se persisten con guion bajo** (`epayco_processing`) pero la API de WooCommerce los usa con guion (`epayco-processing`). `pedidos.woo_estados` devuelve los de la API — es el formato correcto para `sincronizarFaltantes`.
- **`scripts/db-query.js` del backend falla con Node 25** (`buffer-equal-constant-time` usa `SlowBuffer`, removido). Ejecutar con `~/.nvm/versions/node/v20.20.0/bin/node`.
- **Pendiente en backend (fuera de alcance, ya reportado):** el off-by-one de fechas de `ventasKpiController.js:115` y la falta de `verifyToken` en `orderRoutes.js` y `syncWooOrdersRoutes.js` — esta última afecta a `sincronizarFaltantes`, que llama a una ruta sin autenticación.
