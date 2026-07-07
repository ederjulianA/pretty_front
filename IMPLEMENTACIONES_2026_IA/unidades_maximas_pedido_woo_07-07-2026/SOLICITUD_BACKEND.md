---
slug: unidades-maximas-pedido-woo
origen: SPEC.md del frontend POS Pretty
fecha: 2026-07-07
estado: pendiente
---

# Solicitud Formal al Backend: Unidades Máximas por Pedido (sync WooCommerce)

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

POS Pretty necesita permitir parametrizar, al crear o editar un artículo, un límite de "unidades máximas por pedido" que se sincronice con la tienda WooCommerce, de forma que ciertos productos queden restringidos en cantidad comprable por factura/orden online. Esto se consume desde `CreateProduct.jsx` y `EditProduct.jsx` en el frontend.

Actualmente `dbo.articulos` no tiene columna para este dato, y ninguno de los tres endpoints de creación/edición de artículos lo persiste ni lo envía a WooCommerce.

## Solicitudes

### [SOLICITUD-1] Nueva columna en `dbo.articulos`

- **Tipo:** Cambio de esquema de BD
- **Tabla:** `dbo.articulos`
- **Columna propuesta:** `art_max_unidades_pedido INT NULL`
- **Problema / Necesidad:** No existe forma de persistir el límite de unidades por pedido en el artículo.
- **Impacto si no se resuelve:** Bloquea toda la funcionalidad — no hay dónde guardar el valor.

### [SOLICITUD-2] Persistir campo en creación de artículo simple

- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `POST /api/crearArticulo`
- **Archivo backend actual:** `controllers/articulosController.js:51` (`createArticuloEndpoint`) → `models/articulosModel.js:530` (`createArticulo`)
- **Problema / Necesidad:** El INSERT actual a `dbo.articulos` (línea 569-579) no incluye `art_max_unidades_pedido`. Tampoco se envía en el `wooData` del `wcApi.post('products', wooData)` (línea ~720).
- **Request esperado:**
  ```json
  { "art_max_unidades_pedido": 5 }
  ```
- **Response 200 esperado:** sin cambios en el esquema de respuesta actual, solo debe persistir y sincronizar el nuevo campo.
- **Errores esperados:** 400 si el valor no es un entero positivo o null.
- **Impacto si no se resuelve:** El límite ingresado en el formulario de creación se pierde.

### [SOLICITUD-3] Persistir campo en creación de artículo variable

- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `POST /api/articulos/variable`
- **Archivo backend actual:** `controllers/variableProductController.js` (`createVariable`)
- **Problema / Necesidad:** No maneja `art_max_unidades_pedido` en el producto padre variable.
- **Request esperado:**
  ```json
  { "art_max_unidades_pedido": 5 }
  ```
- **Impacto si no se resuelve:** Artículos variables no pueden tener límite configurado.

### [SOLICITUD-4] Persistir y sincronizar campo en edición de artículo

- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `PUT /api/articulos/:id_articulo`
- **Archivo backend actual:** `controllers/articulosController.js:4` (`updateArticuloEndpoint`) → `models/articulosModel.js:1017` (`updateArticulo`)
- **Problema / Necesidad:** El UPDATE actual (línea 1039-1055) no incluye `art_max_unidades_pedido`. La función de sync a Woo (líneas ~150-220, `wcApi.put('products/${art_woo_id}', data)`) tampoco envía este dato como `meta_data`.
- **Request esperado:**
  ```json
  { "art_max_unidades_pedido": 5 }
  ```
- **Impacto si no se resuelve:** Ediciones del límite no se persisten ni se sincronizan.

### [SOLICITUD-5] Enviar límite como `meta_data` a WooCommerce

- **Tipo:** Modificación de endpoint existente (lógica de sync a Woo)
- **Archivo backend actual:** `models/articulosModel.js` (función de sync usada en creación ~línea 720 y en edición ~línea 150-220, cliente `wcApi` de `@woocommerce/woocommerce-rest-api`)
- **Problema / Necesidad:** WooCommerce no tiene campo nativo para límite de compra >1 unidad (solo `sold_individually` limita a 1). Se debe enviar el valor como `meta_data` personalizado para que un plugin/theme de la tienda lo interprete.
- **Request esperado (payload hacia Woo, no hacia el frontend):**
  ```json
  {
    "meta_data": [
      { "key": "_max_unidades_pedido", "value": "5" }
    ]
  }
  ```
- **Pendiente de confirmar antes de implementar:** el `meta_key` exacto (`_max_unidades_pedido` es propuesta) debe validarse contra el plugin/theme real instalado en la tienda WooCommerce que aplicará la restricción. Si no hay plugin instalado aún, este meta no tendrá efecto visible hasta que se configure del lado de WordPress/WooCommerce.
- **Impacto si no se resuelve:** El límite se guarda en POS Pretty pero nunca se refleja en la tienda online (objetivo principal del requerimiento).

## Notas para el Backend

- `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- Fechas como string `'YYYY-MM-DD'` (bug de timezone del driver mssql).
- `articulosdetalle` siempre con `bod_sec = '1'`.
- Reutilizar el patrón existente `art_woo_sync_status` / `art_woo_sync_message` para reportar el resultado de la sincronización de este campo (no crear un mecanismo de estado paralelo).
- Confirmar con el administrador de la tienda WooCommerce el `meta_key` y el plugin/theme que interpretará el límite antes de implementar SOLICITUD-5.
- `dbo.articulos` no tiene la columna aún — requiere `ALTER TABLE dbo.articulos ADD art_max_unidades_pedido INT NULL` antes de tocar los controllers.

## Criterios de aceptación backend

- [ ] Columna `art_max_unidades_pedido` agregada a `dbo.articulos` (NULL-able)
- [ ] Los 3 endpoints (crear simple, crear variable, editar) persisten el campo correctamente
- [ ] El valor se envía como `meta_data` en las llamadas `wcApi.post`/`wcApi.put` hacia WooCommerce
- [ ] Auth vía `x-access-token` aplicado (ya existente, no debe romperse)
- [ ] Validación: entero positivo o null; rechazar negativos/decimales con 400
- [ ] Errores de sync a Woo se registran en `art_woo_sync_status`/`art_woo_sync_message` sin bloquear el guardado local
- [ ] Queries parametrizadas (nunca concatenación de strings SQL)
