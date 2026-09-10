---
slug: cierre-de-mes-ajustes
origen: pruebas de integracion del wizard contra julio 2026
fecha: 2026-09-09
estado: pendiente
prioridad: alta — bloquea el cierre de julio 2026
---

# Solicitud al Backend: ajustes de Cierre de Mes

> Complemento de `SOLICITUD_BACKEND.md`. Detectado probando el wizard end-to-end.
> **El backend funciona segun lo especificado; el defecto esta en la especificacion original.**

## Contexto

Al probar el cierre de julio 2026 el wizard queda bloqueado: reporta *"Quedan 2 pedido(s) sin confirmar"* aunque el usuario ya resolvio esos pedidos marcandolos como **no pagados** desde la accion masiva del paso 2.

Estado real en base de datos tras la accion:

```
COT1904  fac_est_woo = 'cancelled'  fac_nro_origen = VTA2177  fac_usu_cod_mod = EDER  2026-09-09 19:49:34
COT1905  fac_est_woo = 'cancelled'  fac_nro_origen = VTA2182  fac_usu_cod_mod = EDER  2026-09-09 19:49:34
```

La accion masiva funciono correctamente. El problema es la regla que decide que pedido esta pendiente.

---

## [AJUSTE-1] `cancelled` debe contar como pedido resuelto

- **Tipo:** Correccion de regla de negocio
- **Archivos:** `models/cierreMesModel.js:21-26` y `:161` · `controllers/cierreMesController.js:626`

### Problema

`models/cierreMesModel.js:161` calcula:

```js
confirmado: ESTADOS_CONFIRMADOS.includes(r.fac_est_woo)
// ESTADOS_CONFIRMADOS = ['processing','completed','epayco_processing','epayco_completed']
```

y `controllers/cierreMesController.js:626` bloquea con:

```js
const sinConfirmar = pedidos.filter(p => !p.confirmado);
```

`cancelled` no esta en la lista blanca, asi que un pedido cancelado queda `confirmado: false` y **sigue bloqueando el cierre**.

La consecuencia es que **la accion "Marcar como no pagado" es un callejon sin salida**: por diseno nunca puede resolver el bloqueo. El unico camino que lo levanta es confirmar el pago, lo cual contradice el proposito de la accion — que existe justamente para los pedidos que el cliente no pago y no se van a despachar.

El origen es del SPEC del frontend (regla R5), que confundio *confirmado* con *resuelto*. No es un error de implementacion del backend.

### Cambio solicitado

Separar los dos conceptos. Un pedido esta **resuelto** si esta confirmado **o** si fue cancelado:

```js
/** Estados de WooCommerce que se consideran pago confirmado. */
const ESTADOS_CONFIRMADOS = Object.freeze([
  'processing', 'completed', 'epayco_processing', 'epayco_completed'
]);

/** Estados que cierran el caso sin pago: el usuario ya decidio. */
const ESTADOS_CANCELADOS = Object.freeze(['cancelled']);
```

En `obtenerPedidosPeriodo`, agregar el flag sin quitar el existente:

```js
confirmado: ESTADOS_CONFIRMADOS.includes(r.fac_est_woo),
resuelto:   ESTADOS_CONFIRMADOS.includes(r.fac_est_woo)
         || ESTADOS_CANCELADOS.includes(r.fac_est_woo),
```

Y en `crearCierreEndpoint`, bloquear por `resuelto`:

```js
const sinResolver = pedidos.filter(p => !p.resuelto);
```

**Decision de negocio tomada:** por ahora solo `cancelled` cuenta como resuelto. `refunded`, `failed`, `epayco_failed`, `epayco_cancelled` y `epayco_refunded` **siguen bloqueando** — no fueron resueltos por decision del usuario dentro del wizard y conviene que alguien los mire.

### Contrato afectado

- `GET /api/cierre-mes/preflight` → `pedidos.items[]` gana el campo `resuelto` (booleano). `confirmado` se mantiene con su significado actual: el frontend lo usa para el chip de estado de la grilla.
- El `422 PERIODO_CON_PENDIENTES` deja de listar los cancelados en `pendientes.pedidos`. Se sugiere renombrar la clave a `pedidos_sin_resolver` manteniendo `pedidos_sin_confirmar` como alias durante una version, o confirmar el rename para ajustarlo de una vez en el frontend.

### Impacto si no se resuelve

**Julio 2026 no se puede cerrar.** Y cualquier mes con al menos un pedido no pagado queda permanentemente bloqueado.

---

## [AJUSTE-2] Anular la VTA asociada al marcar un pedido como no pagado

- **Tipo:** Nueva regla en endpoint existente
- **Endpoint:** `POST /api/cierre-mes/pedidos/estado-masivo` con `accion: "no_pagado"`
- **Archivo:** `controllers/cierreMesController.js:327` (`estadoMasivoEndpoint`)

### Problema

Los dos pedidos cancelados **ya estaban facturados**: `COT1904 → VTA2177` y `COT1905 → VTA2182`, ambas con `fac_est_fac = 'A'`.

Hoy la accion `no_pagado` cambia el estado del pedido en local y en WooCommerce, pero **no toca la factura de venta**. Resultado: la venta de un pedido que el cliente nunca pago sigue viva y **entra en los totales del cierre**, inflando ventas, comision y utilidad del periodo.

### Cambio solicitado

Cuando `accion === 'no_pagado'` y la COT tiene `fac_nro_origen` apuntando a una VTA activa, anular tambien esa VTA dentro de la **misma transaccion** que actualiza el pedido:

- `fac_est_fac = 'I'`
- `fac_anu_obs` = motivo (ver mas abajo), `fac_anu_fec = GETDATE()`
- `fac_usu_cod_mod`, `fac_fch_mod`

Si la anulacion de la VTA falla, **la operacion completa de ese pedido debe revertirse** — no debe quedar el pedido cancelado con la factura viva, que es exactamente el estado inconsistente que este ajuste busca evitar.

### Puntos a definir por el backend

1. **Reversa de inventario.** Anular una VTA deberia devolver el stock de sus lineas. Hay que verificar si `anularDocumento` de `orderModel` ya lo hace y si aplica el mismo tratamiento aqui. **Es el punto mas delicado de este ajuste.**
2. **Motivo de la anulacion.** Se propone agregar un campo opcional `motivo` al request de `estado-masivo` para que el usuario escriba la razon, igual que en `anular-bloque`. Si no se agrega, usar un texto fijo del tipo `"Anulada por cierre de mes: pedido no pagado"`.
3. **Bundles y kardex.** Confirmar que la anulacion maneja correctamente las lineas de bundle, igual que el flujo de anulacion del POS.

### Contrato afectado

`resultados[]` de `estado-masivo` deberia informar que paso con la factura:

```json
{ "fac_sec": 5012, "fac_nro": "COT1904", "ok": true, "local": true, "woo": true,
  "vta_anulada": "VTA2177", "mensaje": "Actualizado a cancelled; VTA2177 anulada" }
```

`vta_anulada` en `null` cuando la COT no tenia factura asociada. El frontend ya muestra `mensaje` por fila, asi que el reporte se ve sin cambios adicionales; el campo explicito permite destacarlo mejor.

### Impacto si no se resuelve

Los cierres quedan con ventas infladas por pedidos que nunca se cobraron, y como el cierre **congela** las cifras, el error queda permanente en la tabla `cierre_mes`. Para julio 2026 son 2 facturas.

---

## Ya ajustado en el frontend

`pretty_front` ya aplica la regla de AJUSTE-1 de su lado (`src/components/cierreMes/formato.js` → `esPedidoResuelto`, consumido por `useCierreMes` y `PasoPedidos`). Un pedido `cancelled` ya no bloquea el avance ni el boton Generar Cierre, y se muestra con chip gris en la grilla.

**Hasta que AJUSTE-1 este desplegado, el `POST /api/cierre-mes` seguira respondiendo `422`** con los cancelados en la lista de pendientes. El frontend muestra ese detalle correctamente, pero el cierre no se puede completar.

AJUSTE-2 no requiere cambios en el frontend mas alla de mostrar `vta_anulada` si se agrega.

## Criterios de aceptacion

- [ ] Un pedido en `cancelled` no aparece en `pendientes.pedidos` del `422`
- [ ] `preflight` devuelve `resuelto: true` para pedidos cancelados y `confirmado: false`
- [ ] `refunded` / `failed` / `epayco_failed` / `epayco_cancelled` siguen bloqueando
- [ ] Julio 2026 se puede cerrar tras aplicar AJUSTE-1
- [ ] `no_pagado` sobre una COT con VTA activa deja la VTA en `fac_est_fac='I'` con observacion
- [ ] Si falla la anulacion de la VTA, el pedido no queda cancelado (rollback)
- [ ] El stock de la VTA anulada se revierte segun la regla que se defina
- [ ] Una VTA anulada por esta via no aparece en el detalle del cierre ni suma en los totales
