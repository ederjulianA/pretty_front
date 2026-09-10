# SPEC — Peso y dimensiones de productos para integración con envia.com
> Generado: 2026-08-12 · Modo: nueva-funcionalidad
> Origen: Análisis previo en `negocio_prettymakeup/specs/011-peso-dimensiones-productos-envia.md`. Agregar campos de peso y dimensiones (largo, ancho, alto) a productos en el ERP (pretty_front + api_pretty), para sincronizar con WooCommerce y permitir cotización real de envío vía envia.com.

## 1. Historia de usuario

Como **usuario administrador/editor de productos**, quiero poder capturar el peso y las dimensiones (largo, ancho, alto) de cada producto al crearlo o editarlo, para que esos datos se sincronicen a WooCommerce y el plugin de envia.com cotice tarifas de envío basadas en el producto real — no en el fallback fijo actual (1 kg / 0 cm, que además viola el mínimo exigido por la API de envia.com).

## 2. Resumen ejecutivo

Hoy el 100% de los 844 productos publicados en WooCommerce tiene peso y dimensiones vacíos/0. El plugin de envia.com rellena eso con un peso fijo de 1 kg y dimensiones en 0, por lo que la tarifa de envío que ve la clienta en el checkout no refleja el producto real. La causa raíz es que ni `dbo.articulos` (SQL Server) ni el sync hacia WooCommerce (`articulosModel.js`) manejan estos campos.

Esta feature agrega 4 campos numéricos opcionales (peso, largo, ancho, alto) + 1 campo interno de trazabilidad de origen del dato a los formularios de producto del ERP (`CreateProduct.jsx`, `EditProduct.jsx`), y depende de que el backend (`api_pretty`) agregue las columnas correspondientes en `dbo.articulos` y las incluya en el payload de sincronización hacia WooCommerce.

**Actores:** Usuario con permiso `products:edit` / `products:create`.

**Encaje:** Extiende el formulario de producto existente, sin crear pantallas nuevas. La carga masiva inicial (estimación IA + medición de los ~844 SKUs existentes) se resuelve fuera de este formulario (script/bulk backend), no manualmente uno por uno.

## 3. Alcance

**Incluye:**
- 4 inputs numéricos nuevos en `CreateProduct.jsx` (simple, variable, bundle) y `EditProduct.jsx`: Peso (kg), Largo (cm), Ancho (cm), Alto (cm).
- Envío de esos 4 campos en el payload de creación/edición hacia el backend.
- Precarga de los valores existentes al editar un producto.
- Para producto variable: captura a nivel del producto padre únicamente (no por variación).
- Para producto bundle: captura como valor manual único del combo (no se calcula sumando componentes).

**No incluye:**
- Selector de unidad (siempre kg/cm, sin conversión).
- Cálculo automático de peso/dimensiones de bundles a partir de sus componentes.
- UI para la carga masiva/estimación IA de los 844 SKUs existentes (se resuelve por script de backend, fuera de este SPEC).
- Edición del campo de trazabilidad de origen (`art_peso_fuente`) desde el formulario — es de solo lectura o no se muestra.
- Validación de rangos de negocio (ej. "el peso no puede superar X kg").
- Cambios en `models/promocionModel.js` (no gestiona estos campos, confirmado en el análisis previo).

## 4. Flujo principal

1. Usuario abre "Crear producto" o "Editar producto".
2. Ve 4 campos numéricos nuevos junto a los campos existentes (ej. cerca de `art_max_unidades_pedido`): Peso (kg), Largo (cm), Ancho (cm), Alto (cm).
3. Los campos son opcionales — puede guardar el producto sin llenarlos, igual que hoy.
4. Al guardar, los valores (si existen) se envían en el payload de creación/edición.
5. El backend persiste en `dbo.articulos` y sincroniza `weight`/`dimensions` hacia WooCommerce en el mismo trigger que ya sincroniza precio/categoría.
6. Al reabrir "Editar producto", los campos se precargan con los valores guardados.

## 5. Flujos alternativos / edge cases

- **Producto variable:** los 4 campos se capturan y envían solo para el producto padre; el formulario de variaciones individuales no los incluye.
- **Producto bundle:** los 4 campos se capturan como parte del formulario del bundle, análogo a un producto simple.
- **Campos vacíos:** se envían como `null`/omitidos, igual que el patrón ya usado para `art_max_unidades_pedido` (value `""` para indicarle a Woo que borre el meta existente — aunque en este caso, al ser campos nativos de Woo y no meta_data, el comportamiento exacto de "vaciar" debe confirmarlo el backend, ver SOLICITUD_BACKEND.md).
- **Edición parcial:** si el usuario edita solo peso sin tocar dimensiones, el payload debe enviar ambos (los 4 campos viajan juntos en `formData`, mismo patrón que hoy).

## 6. Reglas de negocio y validaciones

- Los 4 campos son **opcionales** — no bloquean el guardado.
- Validación de frontend: solo numérico positivo (`type="number"`, `min="0"`, `step` acorde a decimales — ej. `0.01` para peso, `0.1` para dimensiones, alineado con los mínimos que exige la API de envia.com según el spec de negocio).
- No hay validación de rango máximo.
- El campo de trazabilidad de origen del dato no se captura por este formulario.

## 7. Datos y entidades (contrato API → Frontend)

Basado en la validación real de `dbo.articulos` (33 columnas actuales, sin peso/dimensiones) y el payload de `articulosModel.js`:

| Campo frontend (propuesto) | Tipo | Nullable | Precedente/patrón |
|---|---|---|---|
| `art_peso` | number (kg) | Sí | `art_max_unidades_pedido` (int, nullable) |
| `art_largo` | number (cm) | Sí | ídem |
| `art_ancho` | number (cm) | Sí | ídem |
| `art_alto` | number (cm) | Sí | ídem |
| `art_peso_fuente` | string corto (`estimado_ia`/`medido`/`sin_dato`) | Sí, no editable en este form | `art_woo_sync_status` (varchar(10), nullable) |

**Nota:** los nombres exactos de columnas los define el equipo de backend (Tarea 1 de la solicitud) — esta tabla es la propuesta del frontend, a confirmar.

## 8. Endpoints API

| Método | Ruta | Archivo backend | Estado |
|---|---|---|---|
| `POST` | `/articulos` (simple/bundle) | `articulosModel.js:createArticulo` | ❌ No incluye peso/dimensiones |
| `POST` | `/articulos/variable` | `articulosModel.js:createVariableProduct` (~línea 1341) | ❌ No incluye peso/dimensiones |
| `PUT` | `/articulos/:id` | `articulosModel.js:updateArticulo` (línea 1065) → `updateWooCommerceProduct` (línea 106) | ❌ No incluye peso/dimensiones ni en persistencia SQL ni en payload Woo |
| — | Payload nativo a WooCommerce (`wcApi.put`/`wcApi.post`) | `articulosModel.js` líneas 150-244 | ❌ No envía `weight`/`dimensions` (confirmado: solo `name`, `sku`, `meta_data`, `regular_price`, `categories`, `date_created`) |

Ver `SOLICITUD_BACKEND.md` para el detalle de cada gap.

## 9. Estructura de componentes propuesta

No se crean componentes nuevos. Se modifican:
- `src/pages/CreateProduct.jsx` — agregar 4 inputs al `formData` (línea ~17-26) y al JSX, replicando el bloque de `art_max_unidades_pedido` (líneas 930-940), en las 3 ramas (simple/variable/bundle).
- `src/pages/EditProduct.jsx` — agregar los mismos 4 campos al `formData` (líneas 20-29), a la precarga (`setFormData`, líneas 264-274) y al payload de submit (líneas 613 para bundle, 648-654 para simple/variable).

## 10. Custom hook propuesto

No aplica — el proyecto no centraliza creación/edición de productos en un hook (`useProducts.jsx` solo maneja listado). Se mantiene el patrón actual de `axios` inline en cada página, consistente con el resto del formulario.

## 11. Cambios en rutas `App.jsx`

Ninguno — no se agregan rutas nuevas, se reutilizan las existentes de `CreateProduct` y `EditProduct` bajo `<ProtectedRoute requiredModule="products" requiredPermission="edit">` / `"create"`.

## 12. Permisos / Roles RBAC requeridos

Ninguno nuevo. Los 4 campos quedan bajo los permisos ya existentes (`products:create`, `products:edit`).

## 13. Estados UI

- **Loading:** sin cambios respecto al formulario actual (spinner de guardado existente).
- **Empty:** campos vacíos por defecto en creación; en edición, vacíos si el producto no tiene valores cargados aún (caso esperado para el 100% del catálogo actual).
- **Error:** validación inline si se ingresa un valor no numérico o negativo, mismo patrón de `toast.error` ya usado en el formulario.
- **Success:** sin cambios — el toast de éxito existente cubre también estos campos al guardar.

## 14. Criterios de aceptación

- [ ] Los 4 campos (peso, largo, ancho, alto) son visibles y editables en `CreateProduct.jsx` (simple, variable, bundle) y `EditProduct.jsx`.
- [ ] Los campos son opcionales — se puede guardar un producto sin llenarlos.
- [ ] Al editar un producto con valores ya guardados, los campos se precargan correctamente.
- [ ] El payload de creación/edición incluye los 4 campos con los nombres que confirme el backend.
- [ ] Para producto variable, los campos se capturan solo en el padre.
- [ ] No se rompe ningún flujo existente de creación/edición (regresión cero sobre `precio_detal`, `art_max_unidades_pedido`, categorías, etc.).

## 15. Gaps y Dudas (bloqueantes)

1. **Nombres exactos de columnas SQL** — pendiente de que el equipo de backend confirme (`art_peso` vs `art_weight`, unidades fijas kg/cm vs configurable). Bloqueante para el payload exacto del frontend.
2. **Comportamiento al vaciar un campo ya cargado** — a diferencia de `art_max_unidades_pedido` (que es `meta_data` y soporta value `""` para borrar), `weight`/`dimensions` son campos nativos del schema REST de WooCommerce; el backend debe confirmar cómo se representa "sin dato" (¿string vacío, `"0"`, omitir el campo?).
3. **Si el campo de trazabilidad (`art_peso_fuente`) se muestra en el formulario como solo-lectura** (ej. un badge "Estimado por IA") o si el frontend lo ignora completamente en esta primera fase — asumido que se ignora, a confirmar si backend expone el dato en el `GET /articulos/:id`.

## 16. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Concurrencia con specs/009 y specs/010 sobre `articulosModel.js` o formularios de producto | Media | Media | Coordinar orden de merge con el equipo de backend antes de implementar |
| Carga masiva inicial (844 productos) sature la API REST de WooCommerce si se hace producto por producto | Alta (si no hay bulk) | Baja para este SPEC (responsabilidad de Tarea 4 del doc de negocio, no de este formulario) | Confirmar con backend si habrá endpoint/script bulk separado |
| Nombres de columnas cambian tras la migración SQL definida por backend | Media | Baja | Frontend usa los nombres que confirme `SOLICITUD_BACKEND.md`; no se implementa hasta esa confirmación |

## 17. Estimación

- Implementación frontend (4 campos × 2 páginas × 3 variantes de formulario): baja — sigue patrón exacto de `art_max_unidades_pedido`.
- Pruebas manuales en puerto 5174: crear producto simple con/sin los campos, editar producto existente, crear producto variable, crear bundle — verificar payload en Network tab y precarga correcta.

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | Campos opcionales, no bloquean guardado | Confirmado |
| 2 | Unidades fijas: kg (peso), cm (dimensiones), sin selector | Confirmado |
| 3 | Producto variable: captura solo a nivel del padre | Confirmado |
| 4 | Producto bundle: valor manual único, sin cálculo automático | Confirmado |
| 5 | Campo de trazabilidad no editable desde este formulario | Confirmado |
| 6 | Sin permisos RBAC nuevos | Confirmado |
| 7 | Sin validación de rango máximo, solo numérico positivo | Confirmado |

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | /articulos | `articulosModel.js:createArticulo` | ❌ |
| POST | /articulos/variable | `articulosModel.js:createVariableProduct` (~1341) | ❌ |
| PUT | /articulos/:id | `articulosModel.js:updateArticulo` (1065) / `updateWooCommerceProduct` (106) | ❌ |
| — | wcApi.put/post (payload nativo Woo) | `articulosModel.js:150-244` | ❌ |

### BD consultada

| Tabla | Hallazgo relevante |
|-------|--------------------|
| `dbo.articulos` | 33 columnas confirmadas vía `INFORMATION_SCHEMA.COLUMNS`. No existe ninguna columna de peso/dimensiones. `art_max_unidades_pedido` (int, nullable) es el precedente directo a replicar. `art_woo_sync_status` (varchar(10), nullable) es precedente de campo corto tipo estado, aplicable a `art_peso_fuente`. |

## Fuera de alcance / preguntas pendientes

- Estrategia de carga masiva/estimación IA para los 844 SKUs existentes (Tarea 4 del doc de negocio) — no es responsabilidad de este formulario.
- Definición final de nombres de columnas SQL — depende de respuesta del equipo backend a `SOLICITUD_BACKEND.md`.
- Si se necesita un mecanismo de sync bulk aparte del flujo normal de edición producto-por-producto.

## Próximos pasos sugeridos

- [ ] Resolver gaps de backend (ver `SOLICITUD_BACKEND.md`)
- [ ] Confirmar nombres exactos de columnas y comportamiento de "vaciar campo" con el equipo de backend
- [ ] Ejecutar `/impl-builder` una vez aprobado este SPEC y resuelta la solicitud de backend
