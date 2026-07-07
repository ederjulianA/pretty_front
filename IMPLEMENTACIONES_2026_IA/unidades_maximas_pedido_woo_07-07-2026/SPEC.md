# SPEC — Unidades Máximas por Pedido (sincronizado con WooCommerce)
> Generado: 2026-07-07 · Modo: nueva-funcionalidad
> Origen: "Se debe agregar tanto en la creacion como edicion de articulos un campo en donde se pueda parametrizar las unidades maximas que se pueden hacer por pedido, esto se debe sincronizar con woocommerce, en la tienda de woocommerce si un articulo tiene parametrizado este limite de unidades a comprar por factura debe quedar reflejado, la idea es principalmente que en woocommerce podamos limitar la compra de ciertos articulos"

## 1. Historia de usuario

Como administrador de POS Pretty, quiero parametrizar un límite de unidades máximas por pedido al crear o editar un artículo, para que ese límite se sincronice con la tienda WooCommerce y se restrinja la cantidad comprable de ese producto por factura/orden online.

## 2. Resumen ejecutivo

**Objetivo:** agregar un campo numérico opcional "Unidades máximas por pedido" en los formularios de creación y edición de artículos, persistirlo en `dbo.articulos`, y sincronizarlo hacia WooCommerce como `meta_data` para que un plugin/theme de la tienda pueda aplicar la restricción en el carrito/checkout.

**Actores:** Usuario con permisos `products:create` / `products:edit`.

**Encaje en el módulo:** Extiende el flujo existente de creación/edición de artículos (`CreateProduct.jsx`, `EditProduct.jsx`) y el flujo de sincronización con Woo (`wcApi` en `models/articulosModel.js`, `updateWooStockController.js`).

## 3. Alcance

**Incluye:**
- Campo "Unidades máximas por pedido" en formularios de creación y edición (artículos simples, variables y bundles).
- Persistencia en nueva columna de `dbo.articulos`.
- Envío del valor como `meta_data` a WooCommerce al crear y al editar el artículo (reutilizando las llamadas `wcApi.post`/`wcApi.put` ya existentes).
- Reutilización del patrón de estado `art_woo_sync_status` / `art_woo_sync_message` para reportar éxito/error de la sincronización de este campo específico.

**No incluye:**
- Validación del límite en el flujo de venta del POS interno (`POS2.jsx`) — el límite es exclusivo de la tienda online WooCommerce (asunción #7).
- Instalación o configuración del plugin/theme en WordPress/WooCommerce que interprete el meta y aplique la restricción visualmente en el carrito — queda fuera del alcance de este repo (es responsabilidad del equipo de la tienda Woo).
- Mostrar el límite en el listado `Products.jsx` (asunción #8).
- Límite por variante individual en productos variables (asunción #6: aplica a nivel de producto padre).

## 4. Flujo principal

1. Usuario abre `CreateProduct.jsx` o `EditProduct.jsx`.
2. Completa (opcionalmente) el input numérico "Unidades máximas por pedido".
3. Al enviar el formulario (`handleSubmit`), el valor se incluye en el payload hacia el backend (`POST /crearArticulo`, `POST /articulos/variable`, o `PUT /articulos/:id`).
4. El backend persiste el valor en `dbo.articulos` y lo incluye en el `meta_data` enviado a WooCommerce vía `wcApi.post`/`wcApi.put`.
5. WooCommerce almacena el meta en el producto; el plugin/theme de la tienda interpreta ese meta y aplica el límite de cantidad en el carrito/checkout.
6. El estado de sincronización se refleja usando el patrón existente `art_woo_sync_status` (`PENDING` → `SUCCESS`/`ERROR`).

## 5. Flujos alternativos / edge cases

- **Campo vacío o 0:** se interpreta como "sin límite" (asunción #1) — no se envía restricción a Woo, o se envía `null`/ausencia del meta según lo que el plugin de Woo espere (a definir con backend).
- **Artículo sin `art_woo_id` (no sincronizado aún con Woo):** el valor se persiste localmente en POS Pretty; la sincronización a Woo ocurre en el próximo sync/creación exitosa.
- **Edición de artículo variable:** el límite se actualiza solo en el producto padre; las variantes no se tocan individualmente (asunción #6).
- **Error al sincronizar con Woo:** se registra en `art_woo_sync_status='ERROR'` y `art_woo_sync_message`, siguiendo el patrón ya usado en `updateArticulo`.
- **Valor negativo o decimal ingresado:** debe bloquearse en frontend (validación `min=0`, `step=1`) y backend (asunción #3: entero positivo).

## 6. Reglas de negocio y validaciones

- El campo es **opcional**. Vacío/0 = sin límite.
- Debe ser un **entero positivo** (sin decimales).
- Aplica a **todos los tipos de artículo**: simple, variable (a nivel padre) y bundle.
- La sincronización a Woo ocurre **automáticamente** al guardar el artículo (crear o editar), no como acción manual separada.
- El límite **no se valida en el POS** interno al facturar.

## 7. Datos y entidades (contrato API → Frontend)

Nuevo campo propuesto: `art_max_unidades_pedido` (entero, nullable).

```json
// Request POST /crearArticulo, POST /articulos/variable, PUT /articulos/:id
{
  "art_max_unidades_pedido": 5   // opcional, entero positivo o null
}
```

```json
// meta_data enviado a WooCommerce (wcApi.post/put 'products')
{
  "meta_data": [
    { "key": "_max_unidades_pedido", "value": "5" }
  ]
}
```

> Nota: el nombre exacto del meta_key (`_max_unidades_pedido`) debe confirmarse con el equipo/plugin de la tienda Woo — ver Gaps.

## 8. Endpoints API

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | /api/crearArticulo | controllers/articulosController.js:51 → models/articulosModel.js:530 | ⚠️ Existe, falta agregar campo al INSERT y al `wooData` |
| POST | /api/articulos/variable | controllers/variableProductController.js | ⚠️ Existe, falta agregar campo |
| PUT | /api/articulos/:id_articulo | controllers/articulosController.js:4 → models/articulosModel.js:1017 | ⚠️ Existe, falta agregar campo al UPDATE y al payload de sync Woo |
| — | Sync de `meta_data` de límite hacia Woo | models/articulosModel.js (función de sync, ~línea 150-220 y 720) | ❌ No existe — requiere agregar `meta_data` con el límite |

## 9. Estructura de componentes propuesta

- `CreateProduct.jsx`: agregar input controlado `art_max_unidades_pedido` dentro del bloque de campos existentes de `formData` (se envía automáticamente por el patrón `Object.entries(formData)` en creación simple).
- `EditProduct.jsx`: agregar el mismo input; incluirlo explícitamente en `dataToSend` para edición simple, variable y bundle (los tres flujos ya arman el payload manualmente para estos casos).
- No se requieren componentes nuevos ni modales adicionales.

## 10. Custom hook propuesto

No se requiere hook nuevo — el campo se integra al `formData`/`dataToSend` ya manejado localmente en `CreateProduct.jsx`/`EditProduct.jsx`. Si en el futuro se centraliza la lógica de artículos en un hook dedicado, este campo debe incluirse ahí.

## 11. Cambios en rutas `App.jsx`

No aplica — no se agregan rutas nuevas, se reutilizan las páginas existentes de creación/edición.

## 12. Permisos / Roles RBAC requeridos

Reutiliza los permisos ya existentes:
- `requiredModule="products"`, `requiredPermission="create"` para `CreateProduct.jsx`.
- `requiredModule="products"`, `requiredPermission="edit"` para `EditProduct.jsx`.

No se requieren permisos nuevos.

## 13. Estados UI: loading / empty / error / success

- **Empty:** input vacío por defecto (placeholder "Sin límite").
- **Loading:** se integra al `loading` general del submit del formulario (ya existente).
- **Error:** si falla la sincronización con Woo, se usa el mecanismo existente de `art_woo_sync_status='ERROR'` (no bloquea el guardado local del artículo).
- **Success:** toast existente de "Artículo guardado" — no requiere mensaje adicional específico para este campo.

## 14. Criterios de aceptación

- Al crear un artículo con "Unidades máximas por pedido" = 5, el artículo se persiste en `dbo.articulos` con ese valor y WooCommerce recibe el meta correspondiente.
- Al editar un artículo existente y modificar el límite, el cambio se refleja tanto en BD como en el próximo sync a Woo.
- Dejar el campo vacío no envía restricción alguna (sin límite).
- El campo acepta solo enteros positivos; valores negativos o decimales son rechazados en frontend.
- El límite no afecta el flujo de venta en POS2.jsx.

## 15. Gaps y Dudas (bloqueantes)

1. **Nombre exacto del meta_key en WooCommerce** (`_max_unidades_pedido` es una propuesta) — depende del plugin/theme instalado en la tienda Woo que interpretará el límite. Debe confirmarse con quien administra WordPress/WooCommerce antes de implementar.
2. **Confirmar si el plugin/theme de la tienda ya existe** o si debe instalarse/configurarse (ej. "WooCommerce Min/Max Quantities" u otro custom). Sin esto, el meta se enviará pero no tendrá efecto visible en la tienda.
3. Definir si valor `0`/vacío se envía a Woo como meta con valor vacío, o se omite el meta por completo (afecta cómo el plugin de Woo interpreta "sin límite").

## 16. Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| El plugin/theme de Woo no soporta el meta_key elegido | Media | Alto — el límite no se aplicaría realmente en la tienda | Confirmar con equipo Woo antes de implementar backend (Gap #1) |
| Migración de columna nueva en `dbo.articulos` en producción sin downtime | Baja | Medio | Columna `NULL`-able, `ALTER TABLE ADD` no bloqueante en SQL Server |
| Artículos variables: confusión si el límite debería ser por variante | Baja | Medio | Documentado como decisión explícita (asunción #6) — revisar si negocio lo requiere a futuro |

## 17. Estimación

- Frontend (2 inputs + payloads en 3 flujos de Create/Edit): ~3-4 horas.
- Backend (columna BD + 3 endpoints + meta_data a Woo): fuera de este repo, ver `SOLICITUD_BACKEND.md`.
- Pruebas manuales en puerto 5174: crear artículo con límite, editar límite, verificar persistencia y (si es posible) verificar meta en WooCommerce admin: ~1 hora.

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | Campo opcional; vacío/0 = sin límite | Confirmado |
| 2 | Aplica a todos los tipos de artículo (simple, variable, bundle) | Confirmado |
| 3 | Entero positivo, sin decimales | Confirmado |
| 4 | Nombre visible: "Unidades máximas por pedido"; aplica por factura/orden en Woo | Confirmado |
| 5 | Sync a Woo ocurre junto con el guardado del artículo (no acción manual separada) | Confirmado |
| 6 | En variables, el límite es a nivel de producto padre, no por variante | Confirmado |
| 7 | Solo aplica a WooCommerce; POS interno no valida este máximo | Confirmado |
| 8 | No se muestra en el listado `Products.jsx`, solo en crear/editar | Confirmado |
| 9 | Mecanismo de reflejo en Woo: meta personalizado interpretado por plugin/theme de la tienda | Confirmado por usuario (no existe campo nativo en API REST de Woo para límite >1 unidad) |

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | /api/crearArticulo | controllers/articulosController.js:51, models/articulosModel.js:530 | ⚠️ Existe, incompleto |
| POST | /api/articulos/variable | controllers/variableProductController.js | ⚠️ Existe, incompleto |
| PUT | /api/articulos/:id_articulo | controllers/articulosController.js:4, models/articulosModel.js:1017 | ⚠️ Existe, incompleto |
| PUT | /api/updateWooStock/:art_cod | controllers/updateWooStockController.js:112 | Referencia — solo envía `stock_quantity`, no se modifica en este SPEC |

### BD consultada

| Tabla | Hallazgo relevante |
|-------|--------------------|
| `dbo.articulos` | 32 columnas confirmadas (`art_sec` VARCHAR(30) PK, `art_woo_id` INT, `art_woo_sync_status` VARCHAR(10), `art_woo_sync_message` VARCHAR(MAX)). **No existe** columna para límite de unidades — requiere `ALTER TABLE ADD art_max_unidades_pedido INT NULL`. |

## Fuera de alcance / preguntas pendientes

- Confirmación del meta_key exacto y del plugin/theme de WooCommerce que aplicará el límite (Gap #1 y #2).
- Decisión sobre si `0`/vacío se envía como meta vacío u se omite (Gap #3).

## Próximos pasos sugeridos

- [ ] Resolver gaps de backend (ver `SOLICITUD_BACKEND.md`)
- [ ] Confirmar con el equipo/administrador de WooCommerce el meta_key y el plugin que interpretará el límite
- [ ] Ejecutar `/impl-builder` una vez aprobado este SPEC
