# SPEC — Auditoría: Conversión de producto simple a variable y sincronización con WooCommerce
> Generado: 2026-07-28 · Actualizado: 2026-07-28 (contrato backend confirmado) · Modo: bug-fix / auditoría
> Origen: "en la edicion de productos habiamos realizado la funcionalidad para convertir un producto simple en un producto variable, ayudame a revisar si este flujo esta bien disenado o si debemos ajustar algo adicional, me interesa que todo quede sincronizado con woocommerce"

## Estado backend: IMPLEMENTADO

El backend confirmó implementación completa en `/Users/eder/Developer/GitHub/api_pretty/implementaciones_ia_2026/auditoria_producto_variable_woo_28-07-2026/IMPLEMENTACION_BACKEND.md`, incluyendo un **gap adicional detectado durante la implementación, no previsto en el spec original**: el stock del producto padre no se traspasa a las variaciones nuevas (quedan en 0), dejando inventario huérfano. Se resolvió bloqueando la conversión con `400` si el artículo tiene existencia > 0. Este SPEC se actualiza con el contrato final para guiar la implementación del frontend (`/impl-builder`).

## Reporte original

Se pidió auditar el flujo ya implementado de conversión simple → variable en la edición de productos (`EditProduct.jsx`), confirmando si el diseño actual está completo o si hace falta ajustar algo, con foco en que todo el ciclo de vida quede sincronizado con WooCommerce: creación de variaciones, atributos, SKUs, precios y stock.

## Comportamiento actual

**Flujo end-to-end tal como está implementado:**

1. El usuario abre `/products/edit/:id`. El frontend determina el tipo de producto (`productWooType`) leyendo `art_woo_type` / `art_variable` (`EditProduct.jsx:287-405`).
2. Si el producto es `simple`, aparece el bloque "Convertir a producto variable" (`EditProduct.jsx:997-1080`): un nombre de atributo (default `'Tono'`, no editable como lista dinámica) + chips de opciones.
3. Al pulsar "Convertir" (`handleConvertToVariable`, `EditProduct.jsx:147-204`) se hace `POST /articulos/variable/:id/convert-to-variable`. En backend, `convertArticuloToVariable` (`api_pretty/models/articulosModel.js:2033-2142`) marca `art_variable='S'`, `art_woo_type='variable'` en BD y, si hay `art_woo_id`, hace `wcApi.put('products/{id}', {type:'variable', attributes, manage_stock:false, stock_quantity:null})`. **El error de Woo es no-fatal**: si falla, el backend responde `success:true` con `errors.wooCommerce`, y el frontend marca el producto como `variable` localmente igual, solo mostrando un `Swal` de advertencia (`EditProduct.jsx:176-184`).
4. Con el producto ya `variable`, aparece `VariationsTable` (solo lectura) + botón "Nueva Variación" → abre `CreateVariationModal`, que hace `POST /articulos/variable/:parentArtSec/variations` (multipart, con imagen). En backend, `createProductVariation` (`articulosModel.js:1598-1912`) inserta la variación en `dbo.articulos` con `art_woo_type='variation'`, actualiza atributos del padre en Woo y crea la variación real vía `POST products/{parent_woo_id}/variations`, guardando `art_woo_variation_id`. Igual que en el paso 3, un fallo de Woo no bloquea la creación local.
5. Botón "Sync WooCommerce" en `VariationsTable` → `PUT /articulos/variable/:id/sync-attributes` → `syncVariableProductAttributes` (`articulosModel.js:1914-2027`), que fusiona opciones de todas las variaciones hijas y actualiza atributos del padre en Woo si hay cambios.
6. Al guardar el producto padre desde el formulario general (`handleSubmit`, `EditProduct.jsx:619-632`), se hace `PUT /articulos/:id` con solo `art_cod, art_nom, categoria, subcategoria, precio_detal, precio_mayor, art_woo_id, actualiza_fecha, art_max_unidades_pedido`. En backend, `updateArticulo` (`articulosModel.js:1058-1260`) **no distingue el caso `art_woo_type==='variable'`** (solo distingue bundles) y llama `updateWooCommerceProduct`, que hace `PUT products/{id}` enviando `name`, `sku`, `regular_price`, `meta_data` directamente al padre en Woo.
7. El stock se sincroniza aparte vía `PUT /updateWooStock/:art_cod` (`updateWooStockController.js:179`), que siempre pega a `products/{id}` sin distinguir si `id` corresponde a un padre o a una variación.

## Comportamiento esperado

Un flujo de conversión simple→variable completo y sincronizado con WooCommerce debería garantizar que:
- Cualquier fallo de sincronización con Woo quede **visible y accionable** de forma persistente (no solo un toast momentáneo), con indicador de "desincronizado" en el producto.
- El padre de un producto variable **nunca reciba `regular_price`/`stock_quantity` directos en Woo** (Woo los ignora o los trata de forma inconsistente en productos tipo `variable`), y que cualquier cambio de precio se aplique a las variaciones correspondientes, no al padre.
- El stock se actualice contra el endpoint correcto de Woo (`products/{parent}/variations/{id}` para una variación, `products/{id}` solo para simples/padre sin variaciones).
- Sea posible **editar y eliminar variaciones puntuales** desde el frontend, con la sincronización correspondiente a Woo (`PUT`/`DELETE products/{parent}/variations/{id}`).
- El **padre de un producto variable no aparezca como vendible en el POS** — solo sus variaciones, que tienen su propio `art_sec` y stock real.

## Pasos para reproducir cada gap

1. **Padre variable editable con precio "fantasma" en Woo**: convertir un producto simple en variable → editar el producto (cambiar `precio_detal`) desde el formulario general → guardar. Resultado: el backend envía `regular_price` al padre en WooCommerce, un dato que Woo no usa para el tipo `variable` y que puede generar inconsistencia visual en el admin de WooCommerce o en integraciones que lean ese campo.
2. **Stock mal dirigido**: disparar `updateWooStock` sobre el `art_cod` de una variación → el backend pega a `products/{id}` en vez de `products/{parent}/variations/{id}`, actualizando (o fallando silenciosamente sobre) el endpoint incorrecto de Woo.
3. **Padre vendible en POS**: buscar en el POS (`POS2.jsx` + `getArticulos`) un producto que fue convertido a variable → el padre aparece en resultados de búsqueda sin restricción, pudiendo venderse sin stock propio real.
4. **Variación no corregible**: crear una variación con SKU o precio erróneo → no hay forma de editarla ni eliminarla desde `VariationsTable.jsx` (solo lectura); tampoco existe endpoint backend para ello.
5. **Desincronización silenciosa**: forzar un fallo de Woo durante conversión o creación de variación (ej. `art_woo_id` inválido) → el producto/variación queda creado localmente con `errors.wooCommerce`, sin ningún indicador persistente distinto a un `Swal` que desaparece; el usuario debe recordar manualmente pulsar "Sync WooCommerce".

## Causa raíz hipotética

- **Gap 1 y 2 (precio/stock mal dirigidos)**: `updateArticulo` (`api_pretty/models/articulosModel.js:1058-1260`) y `updateWooStockController.js:179` fueron escritos antes de que existiera el tipo `variable`, y nunca se extendió su lógica condicional (solo tienen rama especial para `bundle`). Es un gap de diseño por evolución incompleta del backend, no un bug puntual.
- **Gap 3 (padre vendible en POS)**: `getArticulos` (`articulosModel.js` ~L510, cláusula `WHERE 1=1`) nunca incorporó un filtro de exclusión para `art_woo_type='variable'` al añadirse el concepto de producto variable — el listado de productos vendibles no se actualizó en paralelo con la nueva funcionalidad.
- **Gap 4 (sin editar/eliminar variación)**: la funcionalidad de variaciones se construyó solo para el camino "crear" (`POST`), sin las rutas `PUT`/`DELETE` complementarias — feature incompleta, no regresión.
- **Gap 5 (desincronización silenciosa)**: decisión de diseño original de tratar errores de Woo como "no bloqueantes" (para no impedir el trabajo local del usuario) sin compensarlo con un mecanismo de estado persistente/reintento — el patrón está resuelto a medias (existe el botón de sync manual) pero falta la señal que le diga al usuario que debe usarlo.

## Validación BD

No se detectaron discrepancias entre lo que el frontend/backend asumen y la estructura real. Confirmado en `dbo.articulos`: `art_woo_type`, `art_variable`, `art_woo_id`, `art_variation_attributes`, `art_sec_padre`, `art_parent_woo_id`, `art_woo_variation_id` — todos presentes y consistentes con el código que los consume.

## Contrato backend final (confirmado, para implementación frontend)

### 1. `POST /articulos/variable/:art_sec/convert-to-variable` — ahora puede bloquear con 400 por stock

**Nuevo:** si el artículo tiene existencia > 0, responde `400`:
```json
{ "success": false, "message": "El artículo tiene 77 unidades en existencia. Ajuste el inventario a 0 antes de convertirlo a variable, ya que el stock del padre no se traslada automáticamente a las variaciones.", "error": "..." }
```
Todos los errores de validación (ya variable, es variación, sin atributos válidos, stock > 0) ahora devuelven `400` en vez de `500` — el frontend debe distinguir y mostrar el `message` del backend tal cual (es user-facing y ya explica la acción a tomar).

### 2. `PUT /articulos/:id_articulo` — sin cambios de contrato

Internamente ya omite `regular_price`/stock para padre `variable`. El frontend no necesita cambios en el body que envía.

### 3. `PUT /updateWooStock/:art_cod` — sin cambios de contrato, nuevo caso de respuesta

Caso padre variable ahora responde `200` no-op:
```json
{ "success": true, "messages": ["Artículo COD123 es padre variable: no gestiona stock propio en WooCommerce, no-op"], "data": { "art_cod": "COD123", "art_sec": "2091", "art_woo_id": 10714, "stock": null } }
```
El frontend debe manejar `data.stock === null` sin tratarlo como error.

### 4. `PUT /articulos/variable/:parent_art_sec/variations/:variation_art_sec` — nuevo

Body (todos opcionales, ≥1 requerido): `{ art_nom, precio_detal, precio_mayor, attributes: { Tono: "..." } }`. Response `200`: `{ success, data: { art_sec, art_woo_variation_id }, errors: { wooCommerce } }`. Errores: `400` (nada que actualizar / atributos inválidos — solo `Tono`/`Color` permitidos), `404` (no existe o no es `variation`), `500`.

### 5. `DELETE /articulos/variable/:parent_art_sec/variations/:variation_art_sec` — nuevo

Sin body. Response `200`: `{ success, message }` (+ `errors.wooCommerce` si Woo falló pero se borró local). Errores: `400` (no es tipo `variation`), `404` (no existe), **`409` si tiene movimientos de kardex asociados — el frontend debe mostrar este caso de forma clara** (ej. "esta variación tiene historial de ventas/ajustes y no puede eliminarse"), `500`.

### 6. `GET /articulos` — nuevo query param `excluir_variables`

`excluir_variables=1` excluye `art_woo_type='variable'` (el padre) de los resultados. **Usar solo en `POS2.jsx`**, nunca en `Products.jsx` (el admin necesita ver y editar el padre).

### 7. Indicador de desincronización — ya disponible, sin endpoint nuevo

`GET /articulos` ya retorna `articulos[].art_woo_sync_status` (`SUCCESS`/`ERROR`/`PENDING`) y `articulos[].art_woo_sync_message`. Se actualiza automáticamente en `updateArticulo`, `createProductVariation` y `updateProductVariation`. El frontend debe leer estos campos directamente (no inferir con heurísticas) para mostrar el badge de desincronización.

## Alcance del fix (frontend)

**Prioridad alta:**
- `EditProduct.jsx` → `handleConvertToVariable`: manejar el nuevo `400` por stock > 0, mostrando el `message` del backend (ya es user-facing y accionable) en vez del genérico actual.
- `POS2.jsx` (o el hook/servicio que arma la query de búsqueda de productos): agregar `excluir_variables=1` a las llamadas de listado/búsqueda del POS.
- `updateWooStock` (donde se invoque desde frontend, ej. `Products.jsx:293`): manejar el nuevo caso `data.stock === null` como éxito no-op, no como error.

**Prioridad media:**
- `VariationsTable.jsx`: agregar acciones editar/eliminar por fila, consumiendo `PUT`/`DELETE /articulos/variable/:parent/variations/:variationId`. Manejar especialmente el `409` de eliminar (variación con kardex) con mensaje claro, y el `errors.wooCommerce` no-bloqueante en ambos.
- `EditProduct.jsx` / `Products.jsx`: badge visual de desincronización leyendo `art_woo_sync_status`/`art_woo_sync_message` (sin heurísticas, el dato ya viene del backend).
- Nuevo modal o reutilización de `CreateVariationModal.jsx` para el flujo de edición de variación.

**NO se toca:**
- El flujo de conversión simple→variable en sí (aparte del manejo del nuevo 400) — funciona correctamente.
- Soporte multi-atributo (Talla + Color) — fuera de alcance, confirmado. Nota: backend valida que solo `Tono`/`Color` son atributos permitidos en edición de variación — el frontend no debe ofrecer nombres de atributo libres en ese flujo.
- Reversión variable→simple — fuera de alcance, no se detectó necesidad de negocio actual.

## Riesgos de regresión

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Cambiar `updateArticulo` rompe el flujo de edición de productos `simple` | Baja | Alto | Rama condicional aislada solo para `art_woo_type==='variable'`; no tocar el camino existente para `simple`/`bundle` |
| Excluir el padre variable del POS rompe reportes o vistas que sí necesitan verlo (ej. Products.jsx admin) | Media | Medio | Aplicar el filtro solo en el endpoint/consulta que alimenta el POS, no en `getArticulos` genérico usado por el panel admin |
| Nuevo endpoint DELETE de variación deja huérfanos en Woo si falla a mitad de camino | Media | Medio | Transacción SQL + verificar respuesta de Woo antes de confirmar eliminación local; en caso de fallo de Woo, no bloquear el DELETE local pero marcar desincronización (mismo patrón ya usado en conversión/creación) |
| Indicador de desincronización requiere nuevo campo/flag en BD | Baja | Bajo | Puede resolverse con un campo existente o uno nuevo simple (`art_woo_sync_pending BIT`); a definir con backend |

## Criterios de aceptación

- [ ] Editar precio/nombre de un producto padre variable ya no envía `regular_price`/`stock_quantity` directos a Woo para ese padre. (backend ✅, sin cambios de frontend requeridos)
- [ ] `updateWooStock` actualiza el endpoint correcto de Woo según si el artículo es padre, simple o variación; el frontend maneja el caso no-op del padre sin mostrarlo como error.
- [ ] Un producto padre variable no aparece en los resultados de búsqueda/venta del POS (`excluir_variables=1` aplicado en `POS2.jsx`).
- [ ] Convertir un producto con stock > 0 muestra el mensaje del backend indicando que debe ajustarse el inventario a 0 primero, sin romper el flujo (no queda en estado de error genérico).
- [ ] Es posible editar y eliminar una variación puntual desde `EditProduct.jsx`, reflejándose en Woo. El caso `409` (variación con kardex) se comunica claramente al usuario.
- [ ] Si una sincronización con Woo falla (conversión, creación, edición o eliminación de variación), el producto/variación queda marcado visualmente como desincronizado usando `art_woo_sync_status`/`art_woo_sync_message`.

## Estrategia de verificación

Pasos manuales en `localhost:5174`:
1. Convertir un producto simple con `art_woo_id` válido a variable → confirmar en el admin de WooCommerce que el tipo cambió y los atributos aparecen.
2. Crear 2-3 variaciones con distintos SKUs/precios/stock → confirmar que aparecen como variaciones reales en WooCommerce (no como productos independientes).
3. Editar el precio del producto padre desde el formulario general → confirmar en Woo que el padre NO recibe `regular_price` directo (revisar vía API de Woo o admin).
4. Disparar actualización de stock sobre una variación → confirmar que el stock se refleja en la variación correcta en Woo, no en el padre.
5. Buscar el producto convertido en el POS (`/pos`) → confirmar que el padre no aparece como ítem vendible, solo (si se habilita) sus variaciones.
6. Editar y eliminar una variación desde el nuevo flujo → confirmar reflejo en Woo.
7. Forzar un error de Woo (ej. desconectar temporalmente `art_woo_id` o usar un producto sin `art_woo_id`) durante creación de variación → confirmar que aparece el indicador persistente de desincronización y que "Sync WooCommerce" lo resuelve.

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | Debe existir forma clara y persistente de ver/reintentar sync fallida | Confirmada — se incluye indicador de desincronización en alcance medio |
| 2 | El padre de un producto variable no debería ser vendible en POS | Confirmada — se incluye como fix de prioridad alta |
| 3 | El guardado del padre (`handleSubmit`) debería evitar enviar precio/stock directo a Woo para el padre | Confirmada — fix de prioridad alta |
| 4 | Falta de edición/eliminación de variaciones es un gap a resolver, no limitación intencional | Confirmada — incluido en alcance medio |
| 5 | Soporte de un solo atributo es aceptado por ahora | Confirmada — fuera de alcance |
| 6 | No hay necesidad actual de revertir variable→simple | Confirmada — fuera de alcance |
| 7 | Prioridad alta: precio/stock del padre + padre vendible en POS; prioridad media: edición/eliminación de variación + indicador de desincronización | Confirmada |

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | `/articulos/variable/:art_sec/convert-to-variable` | `routes/variableProductRoutes.js:28` | ✅ Existe, funciona, error Woo no-fatal |
| POST | `/articulos/variable/:parent_art_sec/variations` | `routes/variableProductRoutes.js:19` | ✅ Existe, funciona, error Woo no-fatal |
| PUT | `/articulos/variable/:parent_art_sec/sync-attributes` | `routes/variableProductRoutes.js:25` | ✅ Existe, funciona |
| GET | `/articulos/variable/:parent_art_sec/variations` | `routes/variableProductRoutes.js:22` | ✅ Existe, funciona |
| PUT | `/articulos/:id_articulo` | `routes/articulosRoutes.js:34` → `articulosModel.js:1058-1260` | ⚠️ Existe pero sin rama para `art_woo_type==='variable'`; envía `regular_price` al padre en Woo incorrectamente |
| PUT | `/updateWooStock/:art_cod` | `routes/updateWooStockRoutes.js:8` → `updateWooStockController.js:179` | ⚠️ Existe pero no distingue padre/variación al pegar a Woo |
| PUT | `/articulos/variable/:parent/variations/:variationId` (editar variación) | — | ❌ No existe |
| DELETE | `/articulos/variable/:parent/variations/:variationId` (eliminar variación) | — | ❌ No existe |
| Filtro `art_woo_type!='variable'` en búsqueda POS | `getArticulos`, `articulosModel.js` ~L510 | ❌ No existe |

### BD consultada

| Tabla | Hallazgo relevante |
|-------|--------------------|
| `dbo.articulos` | Columnas confirmadas: `art_woo_type`, `art_variable`, `art_woo_id`, `art_variation_attributes`, `art_sec_padre`, `art_parent_woo_id`, `art_woo_variation_id` — sin discrepancias con lo que asume el código |

## Fuera de alcance / preguntas pendientes

- ¿Se requiere soporte multi-atributo (Talla + Color) en un ciclo futuro? No incluido aquí; además el backend ya restringe edición de variación a solo `Tono`/`Color`.
- ¿Se requiere revertir variable→simple alguna vez (ej. producto descontinuado)? No incluido aquí.
- Confirmar con negocio si el padre variable debe ser completamente invisible en POS o solo no vendible (podría seguir siendo útil verlo agrupado visualmente) — actualmente el contrato (`excluir_variables=1`) permite exclusión total en POS.
- ~~Indicador de desincronización: ¿campo nuevo o inferido?~~ **Resuelto**: ya existen `art_woo_sync_status`/`art_woo_sync_message`, no requiere endpoint nuevo.

## Próximos pasos sugeridos

- [x] Resolver gaps de backend — ver `IMPLEMENTACION_BACKEND.md` en `api_pretty`
- [x] Confirmar con backend el mecanismo de indicador de desincronización (ya existente, sin cambios)
- [ ] Ejecutar `/impl-builder` para implementar el frontend contra el contrato final de esta sección
