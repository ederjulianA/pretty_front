# Implementación: Promoción permanente sin fecha de cierre (WooCommerce)

**Fecha de implementación:** 03/08/2026
**Estado:** Completado

## Contrato backend usado

Confirmado por `api_pretty` en `implementaciones_ia_2026/promocion_permanente_sin_fecha_woocommerce_03-08-2026/IMPLEMENTACION_BACKEND.md`:
- `permanente` es `boolean`, opcional en `POST`/`PUT /api/promociones`. Ausente o `false` = comportamiento actual sin cambios.
- `GET /api/promociones/:pro_sec` retorna `pro_permanente: boolean` y `pro_fecha_fin: null` cuando la promoción es permanente (nunca expone la fecha centinela interna `9999-12-31`).
- La sincronización a WooCommerce ya está resuelta en backend (envía `date_on_sale_to: ''` explícito cuando `permanente=true`) — el frontend no arma ese payload, solo persiste el flag.

## Archivos Modificados

- `src/pages/PromocionNew.jsx`:
  - Línea 35: agregado `permanente: false` al estado inicial de `headerData`.
  - Línea 69: en `fetchPromocion` (modo edición), mapea `pro_permanente` a `headerData.permanente` con `Boolean(...)`, y protege `pro_fecha_fin` contra `null` (antes hacía `.split('T')[0]` directo sobre un string que ahora puede venir `null`, lo cual habría lanzado un `TypeError` en runtime para promociones permanentes).
  - Línea 369: la validación `fecha_inicio >= fecha_fin` se omite cuando `permanente = true`.
  - Líneas 403-404: el payload envía `fecha_fin: null` y `permanente: headerData.permanente` cuando está marcado; de lo contrario, comportamiento idéntico al actual.
  - Líneas 590-603: el input de "Fecha de Fin" se envuelve en `{!headerData.permanente && (...)}` — se oculta por completo, no solo se deshabilita.
  - Líneas 606-618: nuevo checkbox "Promoción permanente / sin fecha de cierre", estilo Tailwind consistente con el resto del formulario (`text-[#f58ea3]`, `focus:ring-[#f58ea3]`).

## Desviaciones del SPEC

- Ninguna. El SPEC especificaba ocultar (no solo deshabilitar) el campo `fecha_fin`, y así se implementó.
- Se agregó una guarda extra no explícita en el SPEC pero necesaria por el contrato real del backend: protección contra `pro_fecha_fin === null` al precargar el formulario en modo edición (gap de tipo `GAP_LOGICA_UI`, resuelto con criterio conservador — usar la fecha actual como placeholder ya que el campo queda oculto de todas formas cuando `permanente=true`).

## Gap no bloqueante detectado (documentado, no resuelto en este alcance)

- `usePromociones.jsx:404-442` (`validatePromocionData`) también valida `fecha_fin` requerida, pero `PromocionNew.jsx` no usa ese hook (llama `axios` directo, patrón preexistente). Si en el futuro se migra `PromocionNew.jsx` a usar `usePromociones`, esa función deberá actualizarse igual para no bloquear promociones permanentes. Fuera de alcance de este cambio.
- Error de lint preexistente en `PromocionNew.jsx:2` (`'React' is defined but never used`) — no introducido por este cambio, no corregido por estar fuera de alcance.

## Pruebas Manuales Recomendadas

1. Ir a `/promociones/nueva`, marcar "Promoción permanente / sin fecha de cierre" — el campo "Fecha de Fin" debe desaparecer del formulario.
2. Completar código, descripción, fecha de inicio y al menos un artículo con precio de oferta o descuento; guardar. Debe guardar sin pedir fecha de fin.
3. Editar esa promoción — el checkbox debe precargar marcado y el campo fecha de fin debe seguir oculto.
4. Desmarcar el checkbox en una promoción permanente — el campo "Fecha de Fin" debe reaparecer vacío/con la fecha actual y volver a ser obligatorio antes de guardar.
5. Crear/editar una promoción normal (sin marcar el checkbox) — el comportamiento debe ser idéntico al actual (fecha fin obligatoria, validación de rango de fechas activa).
6. Verificar en un producto de prueba que, al sincronizar una promoción permanente, WooCommerce no muestre el contador de cuenta regresiva (ya validado por backend con SKU 3027 según `IMPLEMENTACION_BACKEND.md`).
7. Verificar en móvil (responsive) que el checkbox y el layout de fechas se vean bien en la vista de una sola columna.

## Notas para el siguiente desarrollador

- La promoción "Mercadillo Virtual" (pro_sec=9) ya fue marcada como `permanente=true` y re-sincronizada directamente por el equipo de backend como parte de su validación (ver `IMPLEMENTACION_BACKEND.md`, sección "Validado en producción") — no requiere ninguna acción manual adicional desde este frontend.
- No se tocó `usePromociones.jsx` ni `Promociones.jsx` (listado) — el checkbox solo vive en el formulario de creación/edición, tal como especifica el SPEC.
