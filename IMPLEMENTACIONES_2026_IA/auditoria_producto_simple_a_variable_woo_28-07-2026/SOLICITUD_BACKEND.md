---
slug: auditoria-producto-variable-woo
origen: SPEC.md del frontend POS Pretty
fecha: 2026-07-28
estado: pendiente
---

# Solicitud Formal al Backend: Ajustes de sincronización WooCommerce para productos variables

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

Se auditó el flujo de conversión de producto simple → variable en `EditProduct.jsx`. La conversión inicial y la creación de variaciones funcionan correctamente y sincronizan bien con WooCommerce. Sin embargo, se detectaron 5 gaps que afectan directamente la integridad de los datos sincronizados con Woo y la venta en POS: el guardado general de un producto padre variable envía precio/stock directos a Woo (dato que Woo no usa así para tipo `variable`), el endpoint de stock no distingue padre de variación, no existe forma de editar/eliminar una variación puntual, y el padre variable puede aparecer como vendible en el POS sin stock propio real.

## Solicitudes

### [SOLICITUD-1] Evitar enviar precio/stock directo al padre variable en `updateArticulo`
- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `PUT /api/articulos/:id_articulo`
- **Archivo backend actual:** `models/articulosModel.js` función `updateArticulo` (líneas 1058-1260)
- **Problema / Necesidad:** Actualmente la función solo tiene rama especial para `art_bundle==='S'`; para cualquier otro caso —incluido un padre `art_woo_type==='variable'`— llama `updateWooCommerceProduct` enviando `regular_price` y `stock_quantity` directos al producto padre en Woo. Un producto tipo `variable` en WooCommerce no gestiona precio/stock a nivel de padre (lo gestionan sus variaciones), por lo que este envío genera inconsistencia o es ignorado silenciosamente por la API de Woo.
- **Comportamiento esperado:** Al editar un producto con `art_woo_type==='variable'`, el `PUT` a WooCommerce para el padre debe omitir `regular_price`/`stock_quantity` (enviar solo `name`, atributos si cambiaron, `meta_data`). Si el frontend en el futuro permite editar precio por variación, ese cambio debe ir a `products/{parent_woo_id}/variations/{variation_woo_id}`.
- **Request esperado:** Sin cambios en el contrato desde el frontend (sigue siendo el mismo body actual).
- **Response 200 esperado:** Sin cambios en el contrato.
- **Errores esperados:** 400 (validación existente), mantener comportamiento no-fatal ante error de Woo (igual que en conversión/creación de variación).
- **Impacto si no se resuelve:** Cada edición de un producto padre variable sigue mandando datos de precio/stock incorrectos a WooCommerce, generando desconfianza en los datos sincronizados y posible confusión en el panel de WooCommerce.

### [SOLICITUD-2] `updateWooStock` debe distinguir padre, simple y variación
- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `PUT /api/updateWooStock/:art_cod`
- **Archivo backend actual:** `controllers/updateWooStockController.js` (línea 179)
- **Problema / Necesidad:** Siempre hace `wcApi.put('products/{artWooId}', {stock_quantity})`. Si `art_cod` corresponde a una variación (`art_woo_type==='variation'`, con `art_parent_woo_id` y `art_woo_variation_id` disponibles en `dbo.articulos`), debe pegar a `products/{art_parent_woo_id}/variations/{art_woo_variation_id}` en su lugar.
- **Comportamiento esperado:** El controller debe consultar `art_woo_type` del artículo antes de decidir el endpoint de Woo a usar: `variation` → endpoint de variación; `simple`/`variable` (padre sin gestión de stock) → endpoint de producto normal, o no-op si el padre no gestiona stock.
- **Request esperado:** Sin cambios en el contrato desde el frontend.
- **Response 200 esperado:** Sin cambios en el contrato.
- **Errores esperados:** 400 si el `art_cod` no existe; mantener manejo de error actual para fallos de Woo.
- **Impacto si no se resuelve:** El stock de variaciones nunca se refleja correctamente en WooCommerce, o se escribe sobre el endpoint equivocado, generando desincronización de inventario visible para el cliente final en la tienda online.

### [SOLICITUD-3] Endpoints para editar y eliminar una variación puntual
- **Tipo:** Nuevo endpoint
- **Endpoint:** `PUT /api/articulos/variable/:parent_art_sec/variations/:variation_art_sec` y `DELETE /api/articulos/variable/:parent_art_sec/variations/:variation_art_sec`
- **Archivo backend actual:** No existe (comparar con `routes/variableProductRoutes.js`, que hoy solo tiene `POST` de creación en línea 19)
- **Problema / Necesidad:** Hoy no hay forma de corregir un SKU/precio/stock erróneo de una variación ya creada, ni de eliminarla, sin intervención manual directa en BD y en WooCommerce.
- **Request esperado (PUT):**
  ```json
  { "art_nom": "string", "precio_detal": "number", "precio_mayor": "number", "attributes": { "Tono": "string" } }
  ```
- **Response 200 esperado (PUT):**
  ```json
  { "success": true, "data": { "art_sec": "string", "art_woo_variation_id": "number" }, "errors": { "wooCommerce": null } }
  ```
- **Request esperado (DELETE):** sin body.
- **Response 200 esperado (DELETE):**
  ```json
  { "success": true, "message": "Variación eliminada" }
  ```
- **Errores esperados:** 400 (validación), 404 (variación o padre no existe), 409 (conflicto, ej. variación con ventas asociadas — a definir con backend si aplica alguna restricción de negocio)
- **Impacto si no se resuelve:** Errores de captura en variaciones (SKU, precio) quedan sin forma de corregirse desde el frontend, obligando a soporte manual en BD + WooCommerce.

### [SOLICITUD-4] Excluir producto padre variable de la búsqueda/venta en POS
- **Tipo:** Modificación de endpoint existente
- **Endpoint:** El que alimenta la búsqueda de productos del POS (confirmar cuál de los endpoints de `getArticulos` usa `POS2.jsx` — `models/articulosModel.js` ~línea 510, cláusula `WHERE 1=1`)
- **Archivo backend actual:** `models/articulosModel.js`, función `getArticulos`
- **Problema / Necesidad:** No existe ningún filtro que excluya `art_woo_type='variable'` (el padre) de los resultados. El padre puede aparecer como vendible en el POS sin stock propio real, generando ventas inconsistentes.
- **Comportamiento esperado:** Añadir `AND art_woo_type <> 'variable'` (o equivalente) **solo en la consulta que alimenta el POS**, no en `getArticulos` genérico usado por el panel admin de productos (`Products.jsx` sí necesita ver el padre para poder editarlo).
- **Request esperado:** Sin cambios en el contrato desde el frontend.
- **Response 200 esperado:** Sin cambios en el contrato, solo se reduce el set de resultados en el contexto POS.
- **Errores esperados:** N/A (cambio de filtro, no de contrato).
- **Impacto si no se resuelve:** Riesgo de venta de un ítem sin stock real / sin correspondencia clara en WooCommerce, generando inconsistencia contable e inventario.

### [SOLICITUD-5] (A definir con backend) Mecanismo de indicador de desincronización persistente
- **Tipo:** Nuevo endpoint / campo — a definir
- **Endpoint:** N/A — requiere decisión de diseño conjunta
- **Archivo backend actual:** N/A
- **Problema / Necesidad:** Cuando falla la sincronización con Woo en conversión, creación, edición o eliminación de variación, hoy solo se muestra un toast momentáneo. No hay forma de saber después, sin recordar manualmente, que un producto quedó desincronizado.
- **Pregunta abierta para backend:** ¿Se debe agregar un campo persistente (ej. `art_woo_sync_pending BIT` en `dbo.articulos`) que se marque en `true` cuando `errors.wooCommerce` ocurre, y se limpie cuando `sync-attributes` (u otro endpoint de sync) tenga éxito? Esto permitiría al frontend mostrar un badge sin depender de heurísticas de comparación de fechas.
- **Impacto si no se resuelve:** El usuario debe recordar manualmente pulsar "Sync WooCommerce" tras cualquier error — alto riesgo de que productos queden desincronizados de forma silenciosa e indefinida.

## Notas para el Backend

- `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- Fechas como string `'YYYY-MM-DD'` (bug de timezone del driver mssql).
- `articulosdetalle` siempre con `bod_sec = '1'`.
- Secuencias via `dbo.secuencia` con UPDLOCK/HOLDLOCK (nunca MAX+1).
- Mantener el patrón ya usado en `convertArticuloToVariable` y `createProductVariation`: error de Woo no bloquea la operación local, pero debe quedar registrado para permitir reintento (ver SOLICITUD-5).
- Los campos `art_parent_woo_id` y `art_woo_variation_id` ya existen en `dbo.articulos` y deben reutilizarse para SOLICITUD-1 y SOLICITUD-2 (no crear columnas duplicadas).

## Criterios de aceptación backend

- [ ] Endpoint responde con esquema indicado
- [ ] Auth via `x-access-token` aplicado
- [ ] Validaciones de negocio aplicadas
- [ ] Transacción SQL si hay operaciones multi-tabla (especialmente SOLICITUD-3 DELETE: variación local + Woo)
- [ ] Queries parametrizadas (nunca concatenación de strings SQL)
- [ ] El filtro de SOLICITUD-4 no afecta el panel admin de productos, solo el contexto POS
