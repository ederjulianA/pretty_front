# Implementación: Asignar/Quitar Categoría WooCommerce desde Promociones

**Fecha de implementación:** 23/06/2026
**Estado:** Completado

---

## Archivos Creados

- `src/hooks/useWooCategories.js` — Carga la lista de categorías de WooCommerce desde `GET /api/woo/categorias`
- `src/hooks/useWooCategoryPromo.js` — Ejecuta asignar/quitar categoría masiva con timeout extendido (60s para promos grandes)
- `src/components/WooCategoryAssignModal.jsx` — Modal con buscador de categorías, botones Asignar y Quitar, resumen de resultados

## Archivos Modificados

- `src/components/PromocionDetailModal.jsx`
  - Reemplazado `axios` directo + token manual por `axiosInstance` (consistencia con el resto del proyecto)
  - Removido import de `axios` y `API_URL` (ya no se usan)
  - Agregado estado `wooModalOpen` para controlar el sub-modal
  - Agregado botón "Categoría WooCommerce" en el footer
  - Montado `WooCategoryAssignModal` al final del componente

---

## Desviaciones del SPEC

- El SPEC planteaba un "sub-modal/selector" como concepto genérico. Se implementó como modal independiente (`WooCategoryAssignModal`) con z-index `z-[60]` para quedar sobre el modal padre (z-50). Esto es más limpio que un dropdown embebido dado el tamaño de la lista de categorías.
- El SPEC no especificaba si `useWooCategoryPromo` debía hacer lazy load (solo al llamar la función) o cargar en mount. Se implementó como lazy (sin `useEffect`) porque las operaciones se disparan por acción del usuario, no automáticamente.
- `useWooCategories` no usa `useEffect` en mount — el fetch se dispara desde `WooCategoryAssignModal` cuando el modal se abre. Esto evita cargar categorías innecesariamente si el usuario nunca abre el selector.

---

## Pruebas Manuales Recomendadas

1. Ir a `/promociones` → abrir el detalle de cualquier promoción → verificar que aparece el botón "Categoría WooCommerce" en el footer.
2. Pulsar "Categoría WooCommerce" → verificar que el modal carga la lista de categorías desde WooCommerce (spinner visible mientras carga).
3. Seleccionar una categoría (ej. "Black Friday") → pulsar "Asignar categoría" → confirmar en SweetAlert2 → verificar toast de éxito y que la categoría aparece en los productos en WooCommerce.
4. Con la misma categoría seleccionada → pulsar "Quitar categoría" → confirmar → verificar que la categoría desaparece de los productos en WooCommerce sin afectar sus otras categorías.
5. Abrir una promoción sin artículos con `art_woo_id` → asignar → verificar toast warning "Ningún artículo de esta promoción está sincronizado con WooCommerce".
6. Verificar que los botones Asignar/Quitar quedan deshabilitados durante el loading (promo con muchos artículos puede tardar ~30s).
7. Probar el buscador de categorías en el modal — debe filtrar en tiempo real.

## Notas para el siguiente desarrollador

- El timeout de axios para las operaciones masivas está fijado en 60000ms (1 min). Si una promo tiene 300+ artículos el backend puede tardar ~30s (batches de 10 con 100ms de pausa entre lotes). No reducir este timeout.
- El modal anidado usa `z-[60]` para quedar sobre el `PromocionDetailModal` que usa `z-50`. Si se agrega otro modal encima de este flujo, ajustar el z-index apropiadamente.
- `PromocionDetailModal` ahora usa `axiosInstance` en lugar de `axios` directo. El interceptor de `axiosInstance` ya inyecta el header `x-access-token` automáticamente.
