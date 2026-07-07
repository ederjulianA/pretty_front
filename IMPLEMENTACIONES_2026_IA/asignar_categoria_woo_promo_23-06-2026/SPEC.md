# SPEC — Asignar/Quitar Categoría WooCommerce Masiva desde Promociones
> Generado: 2026-06-23 · Modo: nueva-funcionalidad
> Origen: "como usuario del sistema al generar una nueva promocion desde /promociones quiero poder asignar de forma masiva una nueva categoria a todos los articulos que estan en la promocion [...] el foco principal es que en la tienda woocommerce quede asignada la nueva categoria a los productos, respetando las categorias que ya tienen, pero tambien debo poder eliminar esta categoria de forma masiva"

---

## 1. Historia de usuario

> Como usuario del sistema, al ver una promoción desde `/promociones`, quiero poder **asignar de forma masiva** una categoría de WooCommerce a todos los artículos de esa promoción, y también **quitarla masivamente**, para que en la tienda WooCommerce los productos aparezcan bajo esa categoría (ej. "Black Friday") durante la vigencia de la promo, sin afectar sus otras categorías.

---

## 2. Resumen ejecutivo

| Campo | Valor |
|-------|-------|
| Módulo afectado | `/promociones` |
| Páginas involucradas | `Promociones.jsx`, `PromocionDetailModal.jsx` |
| Actores | Usuarios con acceso al módulo Promociones |
| Encaje | Extensión del módulo de promociones — agrega sincronización WooCommerce por promo |
| Dependencia backend | 3 endpoints nuevos (ver SOLICITUD_BACKEND.md) |

---

## 3. Alcance

### Incluye
- Botón "Asignar categoría WooCommerce" en el detalle de una promoción.
- Botón "Quitar categoría WooCommerce" en el detalle de una promoción.
- Selector de categoría cargado desde la API de WooCommerce (categorías ya existentes en Woo).
- Ejecución masiva sobre todos los artículos activos de la promo que tengan `art_woo_id`.
- Modo aditivo: la categoría se **agrega** al array de categorías del producto; no reemplaza las existentes.
- Al quitar: solo se remueve la categoría indicada; las demás se conservan.
- Feedback de resultados: total procesados, exitosos, con error.
- Confirmación SweetAlert2 antes de ejecutar cada acción.

### No incluye
- Crear categorías nuevas en WooCommerce desde este flujo.
- Modificar la categoría interna del POS (`inv_gru_cod` / `inv_sub_gru_cod`).
- Afectar artículos sin `art_woo_id` (no sincronizados con Woo).
- Acciones masivas sobre múltiples promociones a la vez.
- Cambios en `PromocionNew.jsx` (formulario de creación/edición).

---

## 4. Flujo principal

1. Usuario abre el listado `/promociones`.
2. Hace clic en el ícono de detalle de una promoción → abre `PromocionDetailModal`.
3. En el modal aparecen dos nuevos botones: **"Asignar categoría Woo"** y **"Quitar categoría Woo"**.
4. **Flujo Asignar:**
   a. Usuario pulsa "Asignar categoría Woo".
   b. Se abre un sub-modal/selector con la lista de categorías traída desde WooCommerce (GET backend → WooCommerce API).
   c. Usuario selecciona una categoría (ej. "Black Friday").
   d. SweetAlert2 de confirmación: "¿Asignar categoría 'Black Friday' a N artículos de esta promoción en WooCommerce?".
   e. Al confirmar: POST al backend con `{ pro_sec, woo_category_id, woo_category_name }`.
   f. Backend itera los artículos de la promo con `art_woo_id`, hace PUT a WooCommerce agregando la categoría.
   g. Frontend muestra resultado: toast de éxito o modal con resumen de errores.
5. **Flujo Quitar:**
   a. Usuario pulsa "Quitar categoría Woo".
   b. Mismo selector de categorías.
   c. SweetAlert2: "¿Quitar categoría 'X' de N artículos en WooCommerce?".
   d. DELETE/POST al backend con `{ pro_sec, woo_category_id }`.
   e. Backend itera y hace PUT a WooCommerce removiendo esa categoría del array.
   f. Frontend muestra resultado.

---

## 5. Flujos alternativos / edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Ningún artículo de la promo tiene `art_woo_id` | Toast warning: "Ningún artículo de esta promoción está sincronizado con WooCommerce." No se ejecuta nada. |
| Algunos artículos sin `art_woo_id` | Se procesan solo los que sí tienen `art_woo_id`. El resumen indica cuántos se omitieron. |
| El producto ya tiene la categoría asignada (Asignar) | El backend la agrega igualmente (PUT es idempotente en WooCommerce si el id ya está). No es error. |
| El producto no tiene la categoría a quitar | El backend la ignora sin error. |
| Error de conexión con WooCommerce en algún artículo | Se contabiliza como error, se continúa con los demás. Resumen final muestra los fallidos. |
| Promo sin artículos activos | Toast warning antes de abrir el selector. |

---

## 6. Reglas de negocio y validaciones

1. Solo se procesan artículos con `pro_det_estado` activo Y con `art_woo_id` válido (no nulo, no 0).
2. La categoría a asignar/quitar se selecciona de la lista real de WooCommerce — no se crea desde el frontend.
3. La asignación es **aditiva**: nunca se sobreescriben otras categorías del producto.
4. La remoción es **selectiva**: solo se quita la categoría indicada.
5. Confirmación SweetAlert2 obligatoria antes de ejecutar (acción destructiva/masiva).
6. Si el backend retorna errores parciales, no se reversa lo que ya se procesó exitosamente.

---

## 7. Datos y entidades

### Request — Asignar categoría
```json
POST /api/woo/promo/:pro_sec/asignar-categoria
{
  "woo_category_id": 42,
  "woo_category_name": "Black Friday"
}
```

### Request — Quitar categoría
```json
POST /api/woo/promo/:pro_sec/quitar-categoria
{
  "woo_category_id": 42
}
```

### Response esperada (ambas acciones)
```json
{
  "success": true,
  "data": {
    "total": 25,
    "exitosos": 23,
    "omitidos": 1,
    "errores": 1,
    "detalle_errores": [
      { "art_cod": "ABC123", "art_nom": "Producto X", "error": "WooCommerce timeout" }
    ]
  }
}
```

### Categorías WooCommerce
```json
GET /api/woo/categorias
// Response:
{
  "success": true,
  "data": [
    { "id": 42, "name": "Black Friday", "slug": "black-friday", "count": 0 },
    { "id": 15, "name": "Ofertas", "slug": "ofertas", "count": 120 }
  ]
}
```

---

## 8. Endpoints API

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| GET | `/api/promociones/:pro_sec/articulos-sincronizacion` | `controllers/promocionController.js` | ✅ Existe — retorna artículos con `art_woo_id` |
| GET | `/api/woo/categorias` | — | ❌ No existe |
| POST | `/api/woo/promo/:pro_sec/asignar-categoria` | — | ❌ No existe |
| POST | `/api/woo/promo/:pro_sec/quitar-categoria` | — | ❌ No existe |

---

## 9. Estructura de componentes propuesta

```
src/
  components/
    WooCategoryAssignModal.jsx     ← NUEVO: selector de categorías + botones asignar/quitar
  hooks/
    useWooCategories.js            ← NUEVO: fetcha GET /api/woo/categorias
    useWooCategoryPromo.js         ← NUEVO: ejecuta asignar/quitar + maneja estado loading/result
```

`PromocionDetailModal.jsx` se modifica para incluir los dos botones y montar `WooCategoryAssignModal`.

---

## 10. Custom hooks propuestos

### `useWooCategories`
- **Responsabilidad:** Cargar y cachear la lista de categorías de WooCommerce.
- **Retorna:** `{ categorias, loading, error, refetch }`
- **Llama:** `GET /api/woo/categorias` con `axiosInstance`

### `useWooCategoryPromo`
- **Responsabilidad:** Ejecutar asignación o remoción masiva de categoría en una promo.
- **Parámetros:** `pro_sec`
- **Retorna:** `{ asignarCategoria(woo_category_id, woo_category_name), quitarCategoria(woo_category_id), loading, resultado, error }`
- **Llama:** `POST /api/woo/promo/:pro_sec/asignar-categoria` y `POST /api/woo/promo/:pro_sec/quitar-categoria`

---

## 11. Cambios en rutas App.jsx

Ninguno. La funcionalidad vive dentro del modal de detalle de una promoción existente. No se agrega ruta nueva.

---

## 12. Permisos / Roles RBAC

El módulo `/promociones` actualmente no tiene `ProtectedRoute`. Los nuevos botones heredan el mismo acceso abierto. No se agrega RBAC nuevo en este sprint.

---

## 13. Estados UI

| Estado | Comportamiento |
|--------|---------------|
| Loading categorías | Spinner dentro del selector mientras carga `GET /api/woo/categorias` |
| Sin categorías en Woo | Mensaje: "No se encontraron categorías en WooCommerce." |
| Loading ejecución | Botón deshabilitado + spinner durante el POST masivo |
| Éxito total | `toast.success("Categoría asignada a N artículos en WooCommerce")` |
| Éxito parcial | Modal SweetAlert2 con resumen: N OK, M errores + lista de fallidos |
| Error total | `toast.error("No se pudo completar la operación")` |
| Sin artículos con woo_id | `toast.warning("Ningún artículo de esta promoción está sincronizado con WooCommerce")` |

---

## 14. Criterios de aceptación

- [ ] Los botones "Asignar categoría Woo" y "Quitar categoría Woo" aparecen en el detalle de una promoción.
- [ ] El selector muestra las categorías reales de WooCommerce.
- [ ] Al asignar: la categoría aparece en los productos en WooCommerce sin eliminar las categorías previas.
- [ ] Al quitar: solo esa categoría desaparece de los productos en WooCommerce.
- [ ] Se muestra confirmación antes de ejecutar.
- [ ] Se muestra resumen de resultados (OK / errores).
- [ ] Artículos sin `art_woo_id` son omitidos y contabilizados en el resumen.
- [ ] La acción no afecta la categoría interna del POS (`inv_gru_cod`).

---

## 15. Gaps y Dudas (bloqueantes)

| # | Gap | Bloquea |
|---|-----|---------|
| 1 | `GET /api/woo/categorias` no existe | Sí — no se puede popular el selector |
| 2 | `POST /api/woo/promo/:pro_sec/asignar-categoria` no existe | Sí — acción principal |
| 3 | `POST /api/woo/promo/:pro_sec/quitar-categoria` no existe | Sí — acción de limpieza |

Ver `SOLICITUD_BACKEND.md` para especificación detallada de cada uno.

---

## 16. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Rate limiting de WooCommerce API con muchos artículos | Media | Alto | Backend debe procesar en batches con delay entre llamadas |
| Artículos sin `art_woo_id` generan confusión | Alta | Medio | UI informa claramente cuántos se omitieron |
| El PUT a WooCommerce reemplaza categorías si el backend no lee las actuales primero | Alta | Alto | Backend debe hacer GET del producto en Woo primero, luego merge del array de categorías |
| Timeout en promos con +100 artículos | Media | Medio | Backend responde inmediatamente con job async o procesa con timeout extendido |

---

## 17. Estimación

| Tarea | Estimado |
|-------|----------|
| `useWooCategories` hook | 30 min |
| `useWooCategoryPromo` hook | 1 h |
| `WooCategoryAssignModal` componente | 1.5 h |
| Integración en `PromocionDetailModal` | 45 min |
| Pruebas manuales en puerto 5174 | 1 h |
| **Total** | **~4.25 h** |

---

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | La acción es por promoción individual | Confirmada |
| 2 | Asignación aditiva (no reemplaza categorías existentes) | **Confirmada por usuario** |
| 3 | Categoría se selecciona de lista traída desde WooCommerce API | **Confirmada por usuario** |
| 4 | Solo artículos activos en la promo | Confirmada |
| 5 | Al quitar: solo se remueve la categoría indicada | Confirmada |
| 6 | Acción desde `PromocionDetailModal`, no desde `PromocionNew` | Confirmada |
| 7 | No afecta categoría interna del POS (`inv_gru_cod`) | Confirmada |
| 8 | Resumen de resultados al final, sin rollback parcial | Confirmada |
| 9 | Sin RBAC nuevo — mismo acceso que módulo promociones | Confirmada |

---

## Validación técnica

### Endpoints consultados
| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| GET | `/api/promociones/:pro_sec/articulos-sincronizacion` | `controllers/promocionController.js` | ✅ |
| POST | `/api/woo/fix-category` | `controllers/wooSyncController.js` | ✅ (existe pero no sirve — reemplaza, no agrega) |
| GET | `/api/woo/categorias` | — | ❌ |
| POST | `/api/woo/promo/:pro_sec/asignar-categoria` | — | ❌ |
| POST | `/api/woo/promo/:pro_sec/quitar-categoria` | — | ❌ |

### BD consultada
| Tabla / Campo | Hallazgo |
|---------------|---------|
| `articulos.art_woo_id` | Confirmado — es el ID del producto en WooCommerce |
| `promocionModel.obtenerArticulosParaSincronizacion` | Confirmado — retorna artículos de la promo con `art_woo_id` |
| `inventario_subgrupo.inv_sub_gru_woo_id` | El mapeo actual es a subcategoría; la nueva funcionalidad usa woo_category_id directo |

---

## Fuera de alcance / preguntas pendientes

- ¿Se debe guardar en BD qué categoría Woo fue asignada a qué promo (para poder quitarla sin que el usuario tenga que recordarla)? Por ahora, el usuario elige la categoría manualmente al quitar también.
- ¿Qué pasa si WooCommerce no está disponible? Se asume que el error se muestra al usuario; no hay retry automático.

---

## Próximos pasos sugeridos

- [ ] Resolver los 3 gaps de backend (ver SOLICITUD_BACKEND.md) — **bloqueante**
- [ ] Confirmar con el backend si el procesamiento masivo será síncrono o asíncrono (impacta UX de loading)
- [ ] Ejecutar `/impl-builder` una vez resueltos los gaps y aprobado este SPEC
