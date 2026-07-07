# Implementación: Fecha de factura respeta fecha de cotización original

**Fecha de implementación:** 07/07/2026
**Estado:** Completado

## Backend (ya implementado y validado antes de esta implementación)

- `controllers/orderController.js` (`createCompleteOrder`): destructura `fac_fec` de `req.body` y lo reenvía a `orderModel.createCompleteOrder`. Verificado directamente en el código: `orderController.js:101,116`.
- `models/orderModel.js` ya soportaba `fac_fec` opcional; no requirió cambios.

## Archivos Modificados (frontend)

- `src/POS2.jsx`
  - Líneas ~98-107 (carga de cotización para edición): se agrega `fac_fec: orderData.header.fac_fec` al `setSelectedClient`, para conservar la fecha original de la cotización en el estado.
  - Líneas ~659-673 (`handleFacturarOrder`, construcción del payload): se agrega `facFecParaFactura`, calculado como `selectedClient.fac_fec` únicamente cuando `isEditing && orderType === "COT"` (es decir, cuando se está facturando una cotización existente). Se incluye en el payload de forma condicional (`...(facFecParaFactura ? { fac_fec: facFecParaFactura } : {})`), de modo que en cualquier otro caso (venta directa, edición de una factura VTA ya existente) el campo simplemente no se envía y el backend aplica su fallback actual (`new Date()`).

## Desviaciones del SPEC

Ninguna.

## Pruebas Manuales Recomendadas

1. En `http://localhost:5174/pos`, abrir una cotización existente con fecha anterior a hoy (via `?fac_nro=...`) y presionar "Facturar". Confirmar en `dbo.factura` que la factura creada tiene `fac_fec` igual a la fecha de la cotización original.
2. Crear una venta directa desde POS (sin cotización previa) y confirmar que `fac_fec` sigue siendo la fecha de hoy (sin regresión).
3. Editar una factura VTA ya existente (no vía cotización) y confirmar que el comportamiento de fecha no cambió.
4. Verificar que `fac_fch_cre` de la factura refleja el momento real de creación en todos los casos anteriores.
5. Confirmar que la impresión post-facturación (`printCotizacion`) sigue funcionando sin cambios.

## Notas para el siguiente desarrollador

El mismo objeto `payload` se usa tanto en la rama de creación (POST `/order`, facturar desde COT) como en la rama de edición de factura VTA (PUT `/order/:fac_nro`). Al condicionar `facFecParaFactura` estrictamente a `orderType === "COT"`, la rama PUT nunca incluye `fac_fec`, dejando ese flujo sin cambios (fuera de alcance de este fix).
