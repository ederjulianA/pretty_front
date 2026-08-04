# Implementación: Auditoría — Conversión de producto simple a variable y sincronización con WooCommerce

**Fecha de implementación:** 28/07/2026
**Estado:** Completado

## Archivos Creados
- `src/components/product/EditVariationModal.jsx` — Modal para editar (nombre, precios, atributo) o eliminar una variación puntual ya creada. Reutiliza el patrón visual de `CreateVariationModal.jsx`. Consume `PUT`/`DELETE /articulos/variable/:parent_art_sec/variations/:variation_art_sec`. Maneja el `409` de eliminación (variación con movimientos de kardex) con un mensaje claro, y el `errors.wooCommerce` no bloqueante en ambos casos.

## Archivos Modificados
- `src/pages/EditProduct.jsx`:
  - `handleConvertToVariable`: distingue el nuevo `400` (stock > 0 antes de convertir) mostrando el `message` del backend con ícono de advertencia en vez de error genérico.
  - Nuevo estado `wooSyncStatus`/`wooSyncMessage` + función `refreshSyncStatus` (releen `GET /articulos/:id`), llamada tras: guardar producto, convertir a variable, sincronizar atributos, crear variación, editar variación.
  - Nuevo badge visual de estado de sincronización con WooCommerce (SUCCESS/ERROR/PENDING) en el header, con tooltip del mensaje de error crudo cuando aplica.
  - Import y wiring de `EditVariationModal`; nuevo botón de editar por fila delegado a `VariationsTable`.
- `src/components/product/VariationsTable.jsx`: agregada columna/acción "Editar" (ícono lápiz) por variación en vista desktop y mobile, vía nueva prop opcional `onEditVariation`. Sin cambios de comportamiento si no se pasa la prop.
- `src/hooks/useProducts.jsx`: nuevo 4º parámetro opcional `excluirVariables` (default `false`). Cuando es `true`, agrega `excluir_variables=1` a la query de `GET /articulos`.
- `src/POS2.jsx`: activa `excluirVariables=true` en su llamada a `useProducts`, para que el producto padre de tipo `variable` no aparezca como vendible en el listado/búsqueda del POS.
- `src/pages/Products.jsx`:
  - `handleSyncProduct`: distingue la nueva respuesta no-op del backend (`data.stock === null`, cuando el artículo es padre variable) mostrando un mensaje explicativo en vez del genérico "sincronizado exitosamente".
  - `renderSyncStatus`: corregido bug preexistente de case-mismatch — comparaba `status` contra `'success'`/`'error'`/`'pending'` en minúsculas, pero el backend siempre devuelve `art_woo_sync_status` en mayúsculas (`SUCCESS`/`ERROR`/`PENDING`). El badge nunca se mostraba correctamente antes de este fix.

## Desviaciones del SPEC

- **`ArticleSearchModal.jsx` no fue modificado.** El SPEC pedía excluir el padre variable "del contexto POS"; al revisar dependencias se detectó que `useProducts` (el hook al que se le agregó `excluirVariables`) también es consumido por `ArticleSearchModal.jsx`, usado en Compras, Conteos, Promociones y Ajustes — flujos donde sí es necesario poder seleccionar el producto padre (p. ej. para ajustar su inventario a 0 antes de convertirlo). Se dejó el parámetro con default `false` para no afectar esos flujos; solo `POS2.jsx` lo activa explícitamente.
- **No se agregó badge de sincronización por fila de variación** dentro de `VariationsTable.jsx`. Se verificó contra el backend (`utils/variationUtils.js`, función `getProductVariations`) que `GET /articulos/variable/:id/variations` no retorna `art_woo_sync_status` a nivel de variación individual — ese campo solo existe a nivel del producto padre. El badge de desincronización se implementó a nivel del padre en `EditProduct.jsx`, que es donde el dato realmente está disponible.
- **Corrección adicional no prevista en el SPEC**: fix del case-mismatch en `Products.jsx` (`renderSyncStatus`). Sin este fix el criterio de aceptación "el producto queda marcado visualmente como desincronizado" nunca se hubiera cumplido en el listado de productos, ya que el badge existente comparaba contra el string equivocado.

## Pruebas Manuales Recomendadas

1. **Conversión bloqueada por stock**: editar un producto simple con existencia > 0 e intentar convertirlo a variable → debe aparecer un `Swal` de advertencia (no error genérico) con el mensaje del backend indicando cuántas unidades tiene y que debe ajustarlas a 0 primero.
2. **Conversión exitosa**: ajustar el inventario a 0, convertir el mismo producto → debe pasar a variable sin bloqueos.
3. **Badge de sincronización en EditProduct**: forzar un error de Woo (ej. producto sin `art_woo_id` válido) al crear una variación → debe aparecer el badge rojo "Desincronizado con WooCommerce" en el header tras recargar el estado; pulsar "Sync WooCommerce" y confirmar que el badge cambia a verde.
4. **Editar variación**: en un producto ya variable con al menos una variación, pulsar el ícono de lápiz en `VariationsTable` → editar nombre/precio/atributo → guardar → confirmar toast de éxito y que la tabla refleja los cambios.
5. **Eliminar variación sin movimientos**: eliminar una variación recién creada (sin ventas/ajustes asociados) → debe eliminarse sin error.
6. **Eliminar variación con movimientos**: intentar eliminar una variación con historial de ventas/ajustes → debe mostrar el mensaje de bloqueo (409) sin eliminar nada.
7. **POS excluye el padre variable**: en `/pos`, buscar un producto que fue convertido a variable → el padre no debe aparecer en resultados; solo deberían aparecer sus variaciones (si tienen stock propio).
8. **Otros flujos siguen viendo el padre**: en Compras, Conteos, Promociones o Ajustes (que usan `ArticleSearchModal`), buscar el mismo producto padre variable → debe seguir apareciendo normalmente (no se excluye ahí).
9. **Sync de stock en Products.jsx**: pulsar el botón de sincronizar sobre un producto padre variable en el listado de `/products` → debe mostrar el mensaje "el stock se gestiona por variación, no aquí" en vez de "sincronizado exitosamente".
10. **Badge en listado de Products.jsx**: confirmar visualmente que los íconos de estado de sync (check verde / X roja / reloj ámbar) ahora se muestran correctamente según el estado real de cada producto (antes del fix, siempre mostraban el estado "no disponible" por el case-mismatch).
11. **Responsive**: repetir pruebas 3-5 en vista móvil (`EditProduct.jsx` y `VariationsTable.jsx` tienen layouts separados para mobile/desktop).

## Notas para el siguiente desarrollador

- El campo `art_woo_sync_message` en estado `ERROR` es un JSON string crudo (`{message, response, status, statusText}`) tal como lo guarda el backend — se muestra como tooltip (`title`), no parseado, siguiendo el mismo patrón ya usado en `Products.jsx`. Si se requiere una UX más rica en el futuro, valdría la pena que el backend exponga un mensaje ya formateado para usuario final.
- `deleteProductVariation` no persiste `art_woo_sync_status` (el registro se elimina), por lo que tras eliminar una variación deliberadamente no se llama a `refreshSyncStatus()` — solo se refresca la lista de variaciones.
- Fuera de alcance (confirmado en el SPEC): soporte multi-atributo (Talla + Color) y reversión variable→simple. El backend ya restringe la edición de variación a solo los atributos `Tono`/`Color`.
