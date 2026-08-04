# SPEC — Promoción permanente sin fecha de cierre (WooCommerce)
> Generado: 03/08/2026 · Modo: nueva-funcionalidad
> Origen: `/Users/eder/Developer/GitHub/pretty_front/reqs_2026/Agosto/promocion_permanente_sin_fecha_woocommerce.md`

## Historia de usuario

Como usuario del sistema, al crear o editar una promoción desde `/promociones` quiero poder marcarla como "permanente" (sin fecha de cierre real), para que la sincronización hacia WooCommerce NO envíe fecha de fin de oferta a los productos y así no se genere un contador de cuenta regresiva falso en la tienda.

## ⛔ Estado: BLOQUEADO por gaps de backend

Este SPEC documenta el diseño completo (frontend + contrato backend requerido), pero **no puede implementarse aún**. La tabla `promociones` tiene `pro_fecha_fin datetime NOT NULL` a nivel de esquema SQL Server — es físicamente imposible guardar una promoción sin fecha de fin hasta que el backend haga cambios de esquema y lógica. Ver `SOLICITUD_BACKEND.md` en esta misma carpeta.

**No ejecutar `/impl-builder` sobre este SPEC hasta que las 3 solicitudes de `SOLICITUD_BACKEND.md` estén implementadas y validadas en `api_pretty`.**

## Resumen ejecutivo

- **Objetivo:** checkbox "Promoción permanente / sin fecha de cierre" en el formulario de promoción. Al marcarlo, `fecha_fin` deja de ser obligatoria/visible y la sincronización a WooCommerce omite `date_on_sale_to` (limpiándolo explícitamente si ya existía uno viejo).
- **Actores:** cualquier usuario con acceso a `/promociones` (hoy sin RBAC — ver Gaps).
- **Encaje en el módulo:** cambio puntual en `src/pages/PromocionNew.jsx`, sin nuevas rutas ni componentes nuevos.

## Alcance

**Incluye:**
- Checkbox "Promoción permanente" en el formulario de crear/editar promoción.
- Ocultar/deshabilitar `fecha_fin` cuando el checkbox está marcado; `fecha_inicio` sigue siendo obligatoria.
- Ajustar validación de fechas para omitir la comparación `fecha_inicio >= fecha_fin` cuando es permanente.
- Enviar el nuevo campo `permanente` (boolean) al backend en crear/editar.
- Precargar el checkbox correctamente en modo edición según el valor que retorne el backend.

**No incluye:**
- Agregar protección RBAC (`ProtectedRoute`) a la ruta `/promociones` — gap preexistente fuera de alcance de este requerimiento.
- Badge visual "Permanente" en el listado `Promociones.jsx` — no fue solicitado.
- Script de migración de datos para la promoción "Mercadillo Virtual" — se corrige manualmente desde la UI una vez implementado el checkbox (marcar como permanente + re-sincronizar), según indica el requerimiento original.
- Cambios en `EventoPromocionalNew.jsx` (eventos promocionales) — el requerimiento es específico de promociones (`dbo.promociones`), no de eventos.

## Flujo principal

1. Usuario entra a `/promociones/nueva` o `/promociones/editar/:pro_sec`.
2. En la sección de fechas del formulario, ve un nuevo checkbox "Promoción permanente / sin fecha de cierre" junto a "Fecha de Inicio" y "Fecha de Fin".
3. Si lo marca: el campo "Fecha de Fin" se oculta (no solo se deshabilita), y su asterisco de requerido desaparece.
4. Completa el resto del formulario normalmente y guarda.
5. El payload enviado a `POST/PUT /api/promociones` incluye `permanente: true` y omite (o envía `null`) `fecha_fin`.
6. Al sincronizar (automático al guardar, según el requerimiento original), el backend arma el payload de WooCommerce sin `date_on_sale_to`, limpiándolo explícitamente con `''` si el producto ya tenía una fecha vieja.

## Flujos alternativos / edge cases

- **Editar promoción permanente y desmarcar el checkbox:** el campo `fecha_fin` reaparece vacío (o con la fecha que tenía antes de marcarse permanente si el backend la conservó) y vuelve a ser obligatorio antes de guardar.
- **Promoción existente sin el campo `permanente` (todas las actuales, pre-feature):** se trata como `permanente: false` por defecto — comportamiento actual sin cambios.
- **Guardar sin marcar el checkbox y sin fecha_fin:** igual que hoy, error de validación bloqueante ("La fecha de fin es requerida").

## Reglas de negocio y validaciones

- `fecha_inicio` siempre requerida, permanente o no.
- Si `permanente = true`: no se valida `fecha_inicio >= fecha_fin` (se omite la comparación, ver `PromocionNew.jsx:367-376`).
- Si `permanente = false`: comportamiento actual sin cambios (fecha_fin requerida, validación de rango aplica).

## Datos y entidades (contrato API → Frontend)

Contrato **requerido** (a implementar por backend, ver `SOLICITUD_BACKEND.md`):

```json
// POST/PUT /api/promociones — request
{
  "codigo": "string",
  "descripcion": "string",
  "fecha_inicio": "ISO string",
  "fecha_fin": "ISO string | null",
  "permanente": "boolean",
  "tipo": "string",
  "observaciones": "string",
  "articulos": [ ... sin cambios ... ]
}
```

```json
// GET /api/promociones/:pro_sec — response (para precargar el form en modo edición)
{
  "pro_sec": "...",
  "pro_fecha_inicio": "...",
  "pro_fecha_fin": "... | null",
  "pro_permanente": "S" | "N",   // o boolean, según decida backend — confirmar en implementación
  ...
}
```

## Endpoints API

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | `/api/promociones` | `controllers/promocionController.js:5`, `models/promocionModel.js:17-47` | ⚠️ Existe, no acepta `permanente` |
| PUT | `/api/promociones/:pro_sec` | `controllers/promocionController.js` (actualizar) | ⚠️ Existe, mismo gap |
| GET | `/api/promociones/:pro_sec` | `controllers/promocionController.js` | ⚠️ Debe retornar el nuevo campo para precargar el form |
| POST | `/api/promociones/:pro_sec/sincronizar-precios` | `models/promocionModel.js` (bloque simples + variaciones) | ⚠️ No tiene rama "oferta activa sin fecha fin" |

## Estructura de componentes propuesta

Sin componentes nuevos. Modificación in-place de `src/pages/PromocionNew.jsx`:

- **Estado (`headerData`, línea 29-36):** agregar campo `permanente: false`.
- **Checkbox nuevo:** insertar entre el bloque de fechas (líneas 572-599) y observaciones (601+), o junto a "Fecha de Fin" — ver detalle en Fase de implementación.
- **Render condicional del input `fecha_fin` (líneas 587-599):** envolver en `{!headerData.permanente && (...)}`.
- **Validación (líneas 367-376):** envolver el `if` en `if (!headerData.permanente && new Date(...) >= new Date(...))`.
- **Payload de guardado (líneas 397-411):** agregar `permanente: headerData.permanente`, y `fecha_fin: headerData.permanente ? null : new Date(headerData.fecha_fin).toISOString()`.
- **Carga en modo edición (`fetchPromocion`, ~línea 50+):** mapear `pro_permanente` del response a `headerData.permanente` (confirmar tipo exacto — boolean vs `'S'/'N'` — contra la implementación real del backend antes de codificar, no asumir).

## Custom hook propuesto

No aplica — `PromocionNew.jsx` no usa `usePromociones` hoy (llama `axios` directo); se mantiene el patrón existente para no introducir una refactorización fuera de alcance. Nota aparte (no bloqueante): `usePromociones.jsx:404-442` (`validatePromocionData`) también valida `fecha_fin` requerida — si en el futuro `PromocionNew.jsx` migra a usar el hook, esa función deberá actualizarse igual. Documentar en `IMPLEMENTACION.md` si se toca.

## Cambios en rutas `App.jsx`

Ninguno — no se agregan rutas nuevas. La ruta `/promociones` permanece sin `ProtectedRoute` (gap preexistente, fuera de alcance).

## Permisos / Roles RBAC requeridos

Ninguno nuevo. Gap preexistente: `/promociones` no tiene `ProtectedRoute` en `App.jsx` (líneas 219-231) ni en `AppRoutes.jsx` (líneas 105-116), a diferencia de otros módulos (`clients`, `ajustes`). No se resuelve en este SPEC.

## Estados UI: loading / empty / error / success

Sin cambios respecto al comportamiento actual del formulario — se reutiliza `isSubmitting`/`isLoading` existentes. Nuevo caso de error: si el backend rechaza `permanente: true` sin implementar el campo (mientras el gap no esté resuelto), el submit debe mostrar el error tal cual lo devuelva el backend vía el manejo de error ya existente (no se agrega manejo especial).

## Criterios de aceptación

1. Con el checkbox "Promoción permanente" marcado, se puede guardar la promoción sin ingresar fecha de fin.
2. Con el checkbox desmarcado, el comportamiento es idéntico al actual (fecha_fin obligatoria, validación de rango de fechas activa).
3. En modo edición, una promoción marcada como permanente en backend precarga el checkbox marcado y oculta la fecha de fin.
4. Al sincronizar una promoción permanente, WooCommerce no muestra contador de cuenta regresiva en los productos de esa promoción (verificación manual en tienda o vía API de WooCommerce).
5. La promoción "Mercadillo Virtual" puede marcarse como permanente y, al re-sincronizar, la fecha vieja en WooCommerce queda limpia (`date_on_sale_to` vacío).

## Gaps y Dudas (bloqueantes)

1. **[BLOQUEANTE — backend]** Columna `pro_fecha_fin NOT NULL` en tabla `promociones` — no permite guardar sin fecha de fin. Ver `SOLICITUD-1` en `SOLICITUD_BACKEND.md`.
2. **[BLOQUEANTE — backend]** No existe campo `permanente`/`es_permanente` en modelo/controller de promociones. Ver `SOLICITUD-2`.
3. **[BLOQUEANTE — backend]** Lógica de sincronización WooCommerce (`updateWooProductPrices.js:329-346` y `promocionModel.js:874-888`) no tiene rama para "oferta activa + sin fecha de fin" — hoy solo sabe "con ambas fechas" o "sin oferta (limpiar todo)". Ver `SOLICITUD-3`.
4. **[DUDA — no bloqueante, definir en implementación]** Tipo exacto del campo nuevo en el response de `GET /api/promociones/:pro_sec` (`boolean` vs `'S'/'N'` char) — confirmar contra la implementación real del backend antes de escribir el mapeo en frontend, no asumir el formato.
5. **[DUDA — no bloqueante]** ¿Qué pasa con `pro_fecha_fin` en BD cuando `permanente = true`? Si la columna se relaja a `NULL`-able, queda `NULL`. Si el backend opta por mantener NOT NULL y usar una fecha centinela (ej. `9999-12-31`), el frontend debe saber para no mostrarla por error si algún día se agrega un badge o listado — no aplica hoy porque no se muestra `fecha_fin` en ningún lado cuando `permanente=true`, pero queda documentado.

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Backend limpia `date_on_sale_to` con `''` pero WooCommerce no lo interpreta como "vaciar" en todos los casos (ej. cache de plugin de countdown) | Media | Medio — el contador podría seguir apareciendo hasta limpiar caché | Verificar manualmente en staging con un producto real antes de aplicar a los 55 productos de producción |
| Migración de esquema (`pro_fecha_fin` a NULL-able) afecta otras queries que asumen NOT NULL en `api_pretty` | Media | Alto — podría romper reportes o jobs existentes que lean `pro_fecha_fin` | Backend debe grep-ear todos los usos de `pro_fecha_fin` antes de relajar el constraint (ya es responsabilidad de `SOLICITUD_BACKEND.md`) |
| Usuario desmarca "permanente" en una promoción que ya se sincronizó sin fecha, y olvida poner una fecha_fin nueva antes de guardar | Baja | Bajo — bloqueado por validación de formulario | Validación ya cubre este caso (fecha_fin vuelve a ser requerida) |

## Estimación

- **Frontend (una vez desbloqueado):** 2-3 horas (checkbox + validación + payload + precarga en edición + prueba manual en puerto 5174).
- **Pruebas manuales:** crear promoción permanente, editarla, desmarcar/remarcar el checkbox, verificar sincronización real con un producto de prueba en WooCommerce staging.
- **Backend:** fuera del alcance de esta estimación — ver `SOLICITUD_BACKEND.md`.

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | Ubicación del checkbox | Junto a los campos fecha_inicio/fecha_fin en el header del formulario |
| 2 | Comportamiento visual al marcar | Ocultar el campo fecha_fin (no solo deshabilitar) |
| 3 | fecha_inicio en promoción permanente | Sigue siendo obligatoria |
| 4 | Editabilidad del checkbox | Editable en cualquier momento, crear y editar |
| 5 | Desmarcar permanente | fecha_fin vuelve a ser requerida antes de guardar |
| 6 | RBAC en /promociones | Fuera de alcance de este requerimiento |
| 7 | Migración de "Mercadillo Virtual" | Corrección manual desde la UI, no script automático |
| 8 | Vigencia interna del ERP basada en fecha_fin | No se detectó tal lógica en el código explorado; no se agrega tratamiento especial |
| 9 | Badge visual en listado | No incluido en este alcance |

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | `/api/promociones` | `controllers/promocionController.js:5`, `models/promocionModel.js:17-47` | ⚠️ Existe, falta campo `permanente` |
| PUT | `/api/promociones/:pro_sec` | `controllers/promocionController.js` | ⚠️ Existe, mismo gap |
| GET | `/api/promociones/:pro_sec` | `controllers/promocionController.js` | ⚠️ Debe exponer el nuevo campo |
| POST | `/api/promociones/:pro_sec/sincronizar-precios` | `jobs/updateWooProductPrices.js:329-346`, `models/promocionModel.js:838-898` | ⚠️ Falta rama "permanente" |

### BD consultada

| Tabla | Hallazgo relevante |
|-------|--------------------|
| `dbo.promociones` | `pro_fecha_fin datetime NOT NULL` — bloqueante. `pro_fecha_inicio datetime NOT NULL`. No existe columna `pro_permanente`. Verificado con `node scripts/db-query.js` contra BD real (03/08/2026). |

## Fuera de alcance / preguntas pendientes

- RBAC en `/promociones` (gap preexistente, no introducido por este requerimiento).
- Badge visual "Permanente" en listado de promociones.
- Migración/corrección de datos de "Mercadillo Virtual" vía script — se hace manual desde UI post-deploy.
- Formato exacto del campo `permanente` en el contrato backend (boolean vs char) — se resuelve durante implementación, no bloquea el diseño del SPEC pero sí bloquea escribir el código de mapeo.

## Próximos pasos sugeridos

- [ ] Resolver gaps de backend listados en `SOLICITUD_BACKEND.md` (3 solicitudes)
- [ ] Confirmar tipo exacto del campo `permanente`/`pro_permanente` una vez implementado en backend
- [ ] Ejecutar `/impl-builder` sobre este SPEC una vez el backend esté implementado y validado
- [ ] Tras implementar, marcar manualmente la promoción "Mercadillo Virtual" como permanente y re-sincronizar (acción manual del usuario, no parte del código)
