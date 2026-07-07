---
slug: asignar-categoria-woo-promo
origen: SPEC.md del frontend POS Pretty
fecha: 2026-06-23
estado: pendiente
---

# Solicitud Formal al Backend: Asignar/Quitar Categoría WooCommerce por Promoción

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

Desde la pantalla `/promociones` del POS Pretty, el usuario necesita asignar de forma masiva una categoría de WooCommerce (ej. "Black Friday") a todos los artículos de una promoción, y poder removerla al finalizar la promo. La categoría se **agrega** al array existente del producto en Woo (nunca reemplaza). El endpoint existente `POST /api/woo/fix-category` no sirve porque reemplaza el array completo de categorías en lugar de hacer un merge.

---

## Solicitudes

### [SOLICITUD-1] Listar categorías de WooCommerce

- **Tipo:** Nuevo endpoint
- **Endpoint:** `GET /api/woo/categorias`
- **Archivo backend actual:** no existe (el sistema no expone las categorías de WooCommerce hacia el frontend)
- **Problema / Necesidad:** El frontend necesita popular un selector con las categorías reales de WooCommerce para que el usuario elija cuál asignar. El backend ya tiene instancia `wooCommerce` configurada en `wooSyncController.js`.
- **Request esperado:** ninguno (GET sin body)
- **Response 200 esperado:**
  ```json
  {
    "success": true,
    "data": [
      { "id": 42, "name": "Black Friday", "slug": "black-friday", "count": 0 },
      { "id": 15, "name": "Ofertas", "slug": "ofertas", "count": 120 }
    ]
  }
  ```
- **Errores esperados:** 500 si WooCommerce API no responde
- **Implementación sugerida:** `wooCommerce.get('products/categories', { per_page: 100 })` — paginación si hay más de 100 categorías
- **Impacto si no se resuelve:** El selector del frontend no puede cargar las categorías → la funcionalidad completa queda bloqueada.

---

### [SOLICITUD-2] Asignar categoría WooCommerce a todos los artículos de una promoción (modo aditivo)

- **Tipo:** Nuevo endpoint
- **Endpoint:** `POST /api/woo/promo/:pro_sec/asignar-categoria`
- **Archivo backend actual:** no existe
- **Problema / Necesidad:** Asignar masivamente una categoría de WooCommerce a todos los artículos de la promo que tengan `art_woo_id`. **El modo es aditivo**: se debe hacer `GET products/{art_woo_id}` para leer las categorías actuales, agregar la nueva al array, y luego `PUT products/{art_woo_id}` con el array resultante. Si no se hace el GET previo, se perderían las categorías existentes del producto.
- **Request esperado:**
  ```json
  {
    "woo_category_id": 42,
    "woo_category_name": "Black Friday"
  }
  ```
- **Response 200 esperado:**
  ```json
  {
    "success": true,
    "data": {
      "total": 25,
      "exitosos": 23,
      "omitidos": 1,
      "errores": 1,
      "detalle_errores": [
        { "art_cod": "ABC123", "art_nom": "Producto X", "error": "mensaje del error" }
      ]
    }
  }
  ```
- **Lógica esperada por artículo:**
  1. Leer artículos de la promo con `art_woo_id` válido (reutilizar `obtenerArticulosParaSincronizacion` del `promocionModel`).
  2. Para cada artículo: `GET products/{art_woo_id}` → extraer `categories` actuales → agregar `{id: woo_category_id}` si no está ya → `PUT products/{art_woo_id}` con el array resultante.
  3. Artículos sin `art_woo_id`: contar como `omitidos`.
  4. Errores de WooCommerce: contar como `errores`, continuar con los demás.
- **Errores esperados:** 400 si falta `woo_category_id`, 404 si `pro_sec` no existe
- **Impacto si no se resuelve:** La acción de asignación masiva queda sin implementar.

---

### [SOLICITUD-3] Quitar categoría WooCommerce de todos los artículos de una promoción

- **Tipo:** Nuevo endpoint
- **Endpoint:** `POST /api/woo/promo/:pro_sec/quitar-categoria`
- **Archivo backend actual:** no existe
- **Problema / Necesidad:** Remover selectivamente una categoría del array de categorías de cada producto en WooCommerce. Al igual que SOLICITUD-2, se necesita hacer `GET products/{art_woo_id}` primero para leer el array actual, filtrar la categoría a quitar, y hacer `PUT` con el array resultante.
- **Request esperado:**
  ```json
  {
    "woo_category_id": 42
  }
  ```
- **Response 200 esperado:**
  ```json
  {
    "success": true,
    "data": {
      "total": 25,
      "exitosos": 23,
      "omitidos": 1,
      "errores": 1,
      "detalle_errores": [
        { "art_cod": "ABC123", "art_nom": "Producto X", "error": "mensaje del error" }
      ]
    }
  }
  ```
- **Lógica esperada por artículo:**
  1. Leer artículos de la promo con `art_woo_id` válido.
  2. Para cada artículo: `GET products/{art_woo_id}` → filtrar del array `categories` el elemento con `id === woo_category_id` → `PUT products/{art_woo_id}` con el array filtrado.
  3. Si el producto no tenía esa categoría: contar como exitoso (operación idempotente).
- **Errores esperados:** 400 si falta `woo_category_id`, 404 si `pro_sec` no existe
- **Impacto si no se resuelve:** No se puede limpiar la categoría al finalizar la promo.

---

## Notas para el Backend

- `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- El modelo `promocionModel.obtenerArticulosParaSincronizacion(pro_sec)` ya existe en `models/promocionModel.js` y retorna los artículos con `art_woo_id` — reutilizarlo en los 3 endpoints.
- La instancia `wooCommerce` ya está configurada en `controllers/wooSyncController.js` — puede importarse o replicarse en el nuevo controller.
- **Crítico (SOLICITUD-2 y 3):** Siempre hacer `GET products/{art_woo_id}` antes del `PUT` para leer las categorías actuales. Un `PUT` directo sin leer primero sobreescribe todas las categorías del producto.
- Considerar rate limiting de WooCommerce: si la promo tiene muchos artículos, procesar en batches de 10 con pequeño delay (ej. 100ms) entre llamadas.
- Todos los endpoints nuevos deben tener middleware `verifyToken` (consistente con el resto de `/api/woo/*`).
- Las queries SQL deben ser parametrizadas (nunca concatenación de strings).

---

## Criterios de aceptación backend

- [ ] `GET /api/woo/categorias` retorna array de categorías de WooCommerce con `id`, `name`, `slug`, `count`
- [ ] `POST /api/woo/promo/:pro_sec/asignar-categoria` agrega la categoría sin eliminar las existentes
- [ ] `POST /api/woo/promo/:pro_sec/quitar-categoria` remueve solo la categoría indicada
- [ ] Los 3 endpoints tienen `verifyToken` aplicado
- [ ] Respuesta incluye `total`, `exitosos`, `omitidos`, `errores`, `detalle_errores`
- [ ] Artículos sin `art_woo_id` se omiten sin error
- [ ] Errores individuales de WooCommerce no detienen el procesamiento de los demás artículos
- [ ] Queries SQL parametrizadas (nunca concatenación)
