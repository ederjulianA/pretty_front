# Implementación: Unidades Máximas por Pedido (sync WooCommerce)

**Fecha de implementación:** 07/07/2026
**Estado:** Completado

## Backend

Validado el backend real en `/Users/eder/Developer/GitHub/api_pretty/` (documentado en `IMPLEMENTACION_BACKEND.md` de ese repo):
- Columna `dbo.articulos.art_max_unidades_pedido` (`INT NULL`) agregada.
- `POST /api/crearArticulo`, `POST /api/articulos/variable` y `PUT /api/articulos/:id_articulo` persisten el campo y lo validan (entero positivo o null).
- El límite se envía a WooCommerce como `meta_data` (`key: "_max_unidades_pedido"`, constante `WOO_META_MAX_UNIDADES`) en las llamadas `wcApi.post`/`wcApi.put`.
- `GET /api/articulos/:id_articulo` retorna `art_max_unidades_pedido`.

## Archivos Modificados (frontend)

- `src/pages/CreateProduct.jsx`:
  - `formData` inicial incluye `art_max_unidades_pedido: ''`.
  - Input numérico agregado en la sección "Integración WooCommerce" (visible para tipos `simple` y `variable`, oculto para `bundle` — el backend no soporta el campo en el endpoint de bundles).
  - `handleSubmitVariable` agrega `art_max_unidades_pedido` al `FormData` explícito cuando tiene valor.
  - `handleSubmitSimple` lo envía automáticamente vía el patrón existente `Object.entries(formData)`.

- `src/pages/EditProduct.jsx`:
  - `formData` inicial incluye `art_max_unidades_pedido: ''`; se carga desde `prod.art_max_unidades_pedido` al obtener el artículo.
  - Input numérico agregado en "Integración WooCommerce", oculto cuando `isVariation` (el límite aplica solo a nivel de producto padre, no por variante individual — asunción #6 del SPEC).
  - Incluido explícitamente en el payload PUT tanto para el flujo bundle como para el flujo simple/variable, convirtiendo `''` a `null`.

## Desviaciones del SPEC

- El campo no se agregó al flujo de creación de bundles (`handleSubmitBundle` / `POST /api/bundles`) porque el backend implementado no incluye esa columna en el endpoint de bundles. El SPEC asumía "todos los tipos de artículo" (asunción #2); se limitó a simple y variable, consistente con lo que el backend realmente soporta. Si se requiere para bundles, es un gap adicional a solicitar al backend.

## Pruebas Manuales Recomendadas

1. Crear un producto simple con "Unidades máximas por pedido" = 5 → verificar que se guarda y aparece al editar.
2. Crear un producto variable con el límite en 3 → verificar que se persiste a nivel de producto padre.
3. Dejar el campo vacío al crear → verificar que no se envía restricción (sin límite).
4. Editar un producto existente y modificar el límite → verificar persistencia tras recargar.
5. Editar una variación individual → confirmar que el campo no aparece (no aplica a variantes).
6. Intentar ingresar un valor negativo o decimal → el input `type="number" min="1" step="1"` debe prevenirlo en el navegador.
7. Verificar en el puerto 5174 que no se rompió el flujo de creación/edición de bundles (el campo no debe aparecer ahí).

## Notas para el siguiente desarrollador

- El `meta_key` real que WooCommerce usará (`_max_unidades_pedido`) depende de que la tienda tenga un plugin/theme que lo interprete — esto sigue siendo una dependencia externa no verificable desde este repo.
