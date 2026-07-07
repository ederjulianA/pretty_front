---
slug: fecha-factura-desde-cotizacion
origen: SPEC.md del frontend POS Pretty
fecha: 2026-07-07
estado: pendiente
---

# Solicitud Formal al Backend: Fecha de factura respeta fecha de cotización original

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

En la pantalla `/pos` del frontend, al convertir una cotización (COT) en factura (VTA), la factura generada debe conservar la fecha original de la cotización (ej. cotización del 30-jun facturada el 01-jul debe quedar fechada 30-jun). Se detectó que el modelo `models/orderModel.js` (`_createCompleteOrderInternal`) **ya soporta** un parámetro opcional `fac_fec`, pero el controller `controllers/orderController.js` (`createCompleteOrder`) no lo recibe de `req.body` ni lo reenvía al modelo, por lo que siempre cae en el fallback `new Date()`.

## Solicitudes

### [SOLICITUD-1] Reenviar `fac_fec` desde el controller al modelo en creación de orden/factura

- **Tipo:** Corrección de bug (modificación de endpoint existente)
- **Endpoint:** `POST /api/order`
- **Archivo backend actual:** `controllers/orderController.js`, función `createCompleteOrder` (líneas 99-125)
- **Problema / Necesidad:** El controller destructura `req.body` sin incluir `fac_fec` (línea 101) y llama a `orderModel.createCompleteOrder({...})` sin ese campo (línea 116). El modelo ya acepta `fac_fec` opcional (`orderModel.js:704,793`, `sql.Date`, fallback `new Date()`), pero nunca lo recibe porque el controller lo descarta.
- **Cambio esperado:**
  ```javascript
  // Antes
  const { nit_sec, fac_usu_cod_cre, fac_tip_cod, detalles, descuento, lis_pre_cod, fac_nro_woo, fac_obs, fac_descuento_general } = req.body;
  // ...
  const result = await orderModel.createCompleteOrder({ nit_sec, fac_usu_cod_cre, fac_tip_cod, detalles, descuento, lis_pre_cod, fac_nro_woo, fac_obs, fac_descuento_general });

  // Después
  const { nit_sec, fac_usu_cod_cre, fac_tip_cod, detalles, descuento, lis_pre_cod, fac_nro_woo, fac_obs, fac_descuento_general, fac_fec } = req.body;
  // ...
  const result = await orderModel.createCompleteOrder({ nit_sec, fac_usu_cod_cre, fac_tip_cod, detalles, descuento, lis_pre_cod, fac_nro_woo, fac_obs, fac_descuento_general, fac_fec });
  ```
- **Request esperado (nuevo campo opcional):**
  ```json
  {
    "nit_sec": "string",
    "fac_usu_cod_cre": "string",
    "fac_tip_cod": "VTA",
    "detalles": [ { "art_sec": "string", "kar_uni": 1 } ],
    "fac_fec": "2026-06-30"
  }
  ```
  Si `fac_fec` se omite, debe seguir aplicando el fallback actual (`new Date()`) — sin cambios para los callers existentes que no lo envían (ej. venta directa desde POS).
- **Response 200 esperado:** Sin cambios en el esquema de respuesta actual (`{ success, fac_sec, fac_nro, message }`).
- **Errores esperados:** Sin cambios — 400 (validación existente de `nit_sec`/`detalles`), 500 (error de transacción).
- **Impacto si no se resuelve:** Las facturas generadas desde cotizaciones seguirán quedando con la fecha del día de facturación en lugar de la fecha original de la cotización, contradiciendo el requerimiento de negocio.

## Notas para el Backend

- `fac_fec` debe seguir siendo `sql.Date` (ya está tipado así en el modelo, no requiere cambio de tipo).
- No modificar `fac_fch_cre` (timestamp de auditoría, `GETDATE()` fijo) — es un campo distinto y no debe verse afectado por este fix.
- El frontend solo enviará `fac_fec` cuando esté facturando una cotización existente (`orderType === "COT"`); en cualquier otro caso el campo vendrá ausente/undefined, por lo que el fallback `fac_fec || new Date()` ya existente en el modelo sigue cubriendo ese caso sin cambios adicionales.
- Fechas como string `'YYYY-MM-DD'` (evitar problemas de timezone del driver mssql, según convención ya usada en el proyecto).
- No se requieren cambios en `models/orderModel.js` — ya soporta el parámetro.
- No se requieren cambios de esquema en `dbo.factura` — `fac_fec` ya existe con el tipo correcto.

## Criterios de aceptación backend

- [ ] `POST /api/order` acepta `fac_fec` opcional en el body y lo reenvía a `orderModel.createCompleteOrder`.
- [ ] Si `fac_fec` no se envía, el comportamiento es idéntico al actual (fecha de hoy).
- [ ] Si `fac_fec` se envía con una fecha válida (`YYYY-MM-DD`), la factura creada en `dbo.factura` refleja esa fecha en `fac_fec`.
- [ ] `fac_fch_cre` no se ve afectado por este cambio.
- [ ] Auth vía `x-access-token` sigue aplicado sin cambios (ya presente en la ruta).
