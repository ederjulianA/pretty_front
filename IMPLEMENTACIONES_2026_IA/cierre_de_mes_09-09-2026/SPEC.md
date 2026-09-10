# SPEC — Cierre de Mes
> Generado: 2026-09-09 · Modo: nueva-funcionalidad
> Origen: requerimiento literal del usuario (ver §1)

---

## 1. Historia de usuario

> Se debe implementar la funcionalidad de cierre de mes, debe ser una estructura de tablas completamente nueva y la idea es seleccionar el mes que se va a cerrar, validar que no exista un cierre activo para este mes, (Anio, Mes) y se debe validar que el mes que se este cerrando no sea el mes en curso, por ejemplo si voy a cerrar julio, la fecha del sistemas debe estar por encima, sea agosto o cualquier otro mes por encima del mes a cerrar.
>
> Este proceso tiene varios pasos los cuales describo:
>
> La primera parte es consolidar que todos los pedidos del mes a cerrar que este con estado pendiente, procesando, completado, procesando epayco, completado epayco, pendiente de pago en woocommerce esten sincronizados en nuestro sistema local, si falta alguno se debe sincronizar para que el cierre de mes tenga en cuenta, para los pedidos. Ahora se debe presentar en una grilla todos los pedidos sincronizados para el mes y los pedidos de woocommerce que estén en un estado diferente de (completado, procesando, o algún estado confirmado de pago de epayco) debe aparecer un check de selección y una opción para actualizar el estado del pedido de forma masiva, ya sea que se haya confirmado el pago, o que definitivamente es un pedido que el cliente no pagó y no se va a despachar.
>
> Se debe recorrer todas las cotizaciones sobre la tabla factura para el mes a cerrar con estado activo, y se debe validar de que esten facturadas, si no, se debe presentar el listado, puede ser una grilla, con un selecctor a nivel de grilla y un combo con las opciones : Facturar, Cancelar.
>
> Cuando se selecciona facturar, el sistema debe generar las facturas correspondientes para las cotizaciones seleccionadas, se debe reutilizar el proceso que ya existe de pasar una cotización a factura, pero solo que esta parte es en bloque, ya que puede ser el caso de tener que generar n facturas.
>
> Cuando el usuario selecciona cancelar, se debe habilitar un botón de observaciónes para que el usuario ingrese un detalle de la cancelación y el sistema debe cambiar el estado de la cotización a anulada o inactiva con la observación ingresada por el usuario.
>
> Bien una vez facturados todos los pedidos del mes el sistema debe generar un registro en la tabla de cierre de mes con los datos del cierre, me imagino una tabla padre con el registro del mes a cerrar, aca quiero que guardemos los datos que ya estamos calculando en /dashboard/ventas en el panel de ordenes por canal, necesito poder identificar la cantidad de ventas realizadas por cada canal, sea woocommerce o venta local, y guardar el valor de la comisión de venta, que ha hoy funciona de la siguiente manera, del total de ventas por woocommerce se calcula un 5% y de ventas local un 2.5% creo que estos valores están harcodeadeos, me gustaría que quede parametrizable. Y en la tabla detalle guardar los fac_sec de las facturas procesadas en el cierre de mes, así para futuras auditorias o retrocesos podamos recalcular el cierre de mes.

---

## 2. Resumen ejecutivo

**Objetivo.** Formalizar un proceso administrativo mensual que consolide, valide y **congele** la operación comercial de un período (Año/Mes), dejando trazabilidad completa en una estructura nueva de tablas cabecera/detalle que permita auditoría y recálculo posterior.

**Actores.** Administrador / usuario con permiso sobre el nuevo módulo `cierre_mes`.

**Encaje en el módulo.** Nueva sección del panel admin con dos vistas:
- **Listado histórico** de cierres (`/cierre-mes`).
- **Wizard de ejecución** de un cierre nuevo (`/cierre-mes/nuevo`).

Reutiliza el cálculo ya existente de "Órdenes por Canal" de [DashboardVentas.jsx:692-745](../../src/pages/DashboardVentas.jsx#L692-L745) (respaldado por `models/ventasKpiModel.js:393-447` del backend) y el proceso ya existente de anulación de documentos.

**Impacto en POS.** Ninguno directo sobre `src/POS2.jsx` (no toca caja, bundles ni promociones). El único punto de contacto es la **lógica de conversión COT→VTA**, que hoy vive en el front (`POS2.jsx:600-780 handleFacturarOrder`) y que este SPEC propone mover/replicar al backend como operación en bloque. Ver §16 (Riesgos) para la mitigación de divergencia.

---

## 3. Alcance

### Incluye
- Página de listado histórico de cierres con drill-down al detalle.
- Wizard de 4 pasos para ejecutar un cierre.
- Validación de período (no duplicado activo + mes estrictamente anterior al actual).
- Consolidación/sincronización de pedidos WooCommerce del mes.
- Grilla de pedidos con selección múltiple y actualización masiva de estado (local **y** WooCommerce).
- Grilla de cotizaciones pendientes de facturar con acciones masivas Facturar / Cancelar.
- Panel de resumen por canal con comisiones parametrizables.
- Generación del registro cabecera + detalle del cierre.
- Anulación/reapertura de un cierre con observación.
- Pantalla/modal de parametrización de los porcentajes de comisión.
- Nuevo módulo RBAC `cierre_mes`.

### No incluye
- Cierre contable/fiscal formal (asientos, libros, impuestos).
- Recálculo automático de un cierre anulado (queda el detalle guardado para hacerlo, pero el recálculo se ejecuta re-corriendo el wizard).
- Comisiones por vigencia histórica o por vendedor individual.
- Canales adicionales a WooCommerce y Local.
- Exportación a PDF/Excel del cierre (candidato a fase 2).

---

## 4. Flujo principal (paso a paso desde la UI)

### 4.0 — Listado histórico (`/cierre-mes`)
1. El usuario entra por el menú lateral **Cierre de Mes**.
2. Tabla con: Período (`Julio 2026`), Estado (`Activo` / `Anulado`), Fecha de cierre, Usuario, Total ventas, Total comisión, # Facturas, acciones.
3. Botón primario **Nuevo Cierre** → navega al wizard.
4. Click en una fila → modal de detalle: resumen por canal + tabla de `fac_sec`/`fac_nro` incluidos.
5. Acción **Anular cierre** (con permiso) → SweetAlert2 con textarea de observación obligatoria.

### 4.1 — Paso 1: Selección de período (`/cierre-mes/nuevo`)
1. Dos selects: **Año** (últimos 3 años) y **Mes** (enero–diciembre).
2. Al cambiar cualquiera, se dispara la validación contra el backend y se muestra en línea:
   - ✅ *Período disponible para cierre.*
   - ❌ *Ya existe un cierre activo para Julio 2026 (generado el 05/08/2026 por EDER).* → botón **Siguiente** deshabilitado.
   - ❌ *No se puede cerrar el mes en curso ni un mes futuro. Selecciona un período anterior a Septiembre 2026.* → botón **Siguiente** deshabilitado.
3. **Siguiente** habilitado sólo con ✅.

### 4.2 — Paso 2: Consolidación de pedidos
1. Al entrar, el frontend pide el *preflight* de pedidos del período.
2. Panel superior con contadores: **En WooCommerce: N** · **Sincronizados localmente: M** · **Faltantes: N−M**.
3. Si hay faltantes → alerta ámbar + botón **Sincronizar faltantes** (llama al sync por rango de fechas del mes y por los estados definidos en §6.R4). Muestra spinner + reporte de resultado (patrón de `SyncWooModal`), luego refresca el preflight.
4. Grilla de pedidos del mes (todas las COT del período con `fac_nro_woo`):
   | ☐ | Pedido Woo | Documento | Cliente | Fecha | Estado Woo | Total | Facturado |
   - El checkbox **sólo aparece** en filas cuyo `fac_est_woo` **no** esté en el conjunto de estados confirmados (§6.R5).
   - Chip de color por estado: verde = confirmado, ámbar = pendiente, rojo = fallido/cancelado.
5. Header con checkbox *seleccionar todos* (aplica sólo a filas seleccionables) y contador `N seleccionados`.
6. Barra de acción masiva con dos botones, ambos deshabilitados si no hay selección:
   - **Confirmar pago (N)** → SweetAlert2 de confirmación → estado local y Woo a `completed`.
   - **Marcar como no pagado (N)** → SweetAlert2 → estado local y Woo a `cancelled`.
7. Tras la acción: toast de éxito con el conteo, refresco de la grilla.
8. **Siguiente** deshabilitado mientras queden filas con checkbox visible (pedidos en estado indefinido).

### 4.3 — Paso 3: Cotizaciones pendientes de facturar
1. Grilla de cotizaciones del período con `fac_tip_cod='COT'`, `fac_est_fac='A'` y `fac_nro_origen IS NULL` (§6.R6):
   | ☐ | Cotización | Pedido Woo | Cliente | Fecha | Estado Woo | Total |
2. Checkbox por fila + *seleccionar todos* + contador.
3. Combo **Acción**: `Facturar` | `Cancelar`. Botón **Aplicar (N)**.
4. **Facturar** → SweetAlert2 (*"Se generarán N facturas de venta. ¿Continuar?"*) → llamada en bloque → **modal de resultado** con tabla por cotización: `COT1912 → VTA2207 ✅` / `COT1913 → ❌ Sin existencias del artículo X`. Toast resumen `N de M facturadas`.
5. **Cancelar** → al elegir esta opción en el combo, se habilita el botón **Observaciones**; al pulsar **Aplicar** se abre un modal con textarea obligatoria (mín. 10 caracteres) → anula las cotizaciones seleccionadas con esa observación → modal de resultado por cotización.
6. **Siguiente** deshabilitado mientras la grilla no quede vacía.

### 4.4 — Paso 4: Resumen y generación
1. Panel **Órdenes por Canal** con el mismo formato de `/dashboard/ventas`:
   | Canal | # Órdenes | Ticket promedio | Ventas totales | % Comisión | Comisión | Rentabilidad |
   |---|---|---|---|---|---|---|
   | WooCommerce | 36 | $191.086 | $6.879.088 | 5,00 % | $343.954 | … |
   | Local | 12 | $148.494 | $1.781.930 | 2,50 % | $44.548 | … |
   | **Total** | **48** | — | **$8.661.018** | — | **$388.502** | … |
2. Junto al encabezado, ícono ⚙ **Configurar comisiones** (visible con permiso `edit`) → modal con dos inputs numéricos (% Woo, % Local) que persisten en `dbo.parametros`. Al guardar, el resumen se recalcula en vivo.
3. Textarea opcional **Observaciones del cierre**.
4. Botón **Generar Cierre** → SweetAlert2 de confirmación con el resumen de totales → POST → toast de éxito → redirige al listado con el nuevo cierre resaltado.

---

## 5. Flujos alternativos / edge cases

| # | Situación | Comportamiento |
|---|---|---|
| E1 | Mes sin ninguna venta | Los pasos 2 y 3 muestran estado *empty* ("No hay pedidos/cotizaciones pendientes"); el paso 4 permite generar un cierre con totales en cero. |
| E2 | WooCommerce inaccesible durante el preflight | El paso 2 muestra error rojo con botón **Reintentar**; no se puede avanzar (no se puede garantizar la consolidación). |
| E3 | La sincronización trae pedidos nuevos con estado no confirmado | Aparecen en la grilla con checkbox; el usuario los resuelve antes de avanzar. |
| E4 | Una cotización falla al facturar (p. ej. sin existencias) | El bloque continúa con las demás; el modal de resultado lista el error por fila. La cotización queda pendiente y bloquea el avance hasta resolverse (facturar de nuevo o cancelar). |
| E5 | El usuario abandona el wizard a mitad | No queda registro de cierre (asunción #2). Los cambios ya aplicados sobre pedidos y cotizaciones **sí persisten**. Al volver, el wizard recalcula desde el Paso 1. |
| E6 | Dos usuarios ejecutan el cierre del mismo período a la vez | El índice único filtrado en BD rechaza el segundo con HTTP 409; el frontend muestra *"Otro usuario acabó de cerrar este período."* |
| E7 | Se anula un cierre y se vuelve a cerrar el mismo período | Permitido: el índice único sólo aplica a cierres con `cie_estado='A'`. El nuevo cierre recalcula desde cero. |
| E8 | Cotización local sin `fac_nro_woo` (venta directa cotizada) | Aparece en el paso 3 igual que las de Woo, con la columna *Pedido Woo* vacía. No aparece en el paso 2. |
| E9 | El cambio de estado en Woo falla pero el local ya se actualizó | El backend reporta la fila como parcialmente aplicada; el modal de resultado la marca en ámbar con el detalle. El estado local se mantiene (fuente de verdad del cierre). |
| E10 | El % de comisión se cambia después de generar el cierre | El cierre generado **no** cambia: la cabecera guarda el % efectivamente aplicado. |

---

## 6. Reglas de negocio y validaciones

- **R1 — Unicidad de período.** No puede existir más de un cierre con `cie_estado='A'` para un mismo `(cie_anio, cie_mes)`. Se garantiza con índice único filtrado en BD, no sólo con validación aplicativa.
- **R2 — Período vencido.** El período a cerrar debe cumplir `(cie_anio, cie_mes) < (YEAR(GETDATE()), MONTH(GETDATE()))`. Es decir, cerrar julio 2026 exige que la fecha del sistema sea agosto 2026 o posterior.
- **R3 — Rango de fechas del período.** Siempre `fac_fec >= 'YYYY-MM-01' AND fac_fec < 'YYYY-MM+1-01'` (comparación semiabierta, nunca `BETWEEN` con hora).
- **R4 — Estados WooCommerce a consolidar.** El sync y el conteo de faltantes consideran: `pending`, `processing`, `completed`, `epayco_pending`, `epayco_processing`, `epayco_completed`, `on-hold` (pendiente de pago). *Nota: el backend normaliza `-` → `_` al persistir (`syncWooOrdersController.js:48-62`), pero la API de Woo usa guiones.*
- **R5 — Estados confirmados (no requieren acción).** `processing`, `completed`, `epayco_processing`, `epayco_completed`. Cualquier otro valor de `fac_est_woo` (incluido `NULL`, `pending`, `on_hold`, `epayco_pending`, `epayco_failed`, `epayco_cancelled`, `epayco_refunded`) habilita el checkbox de acción masiva.
- **R6 — Cotización pendiente de facturar.** `fac_tip_cod='COT' AND fac_est_fac='A' AND fac_nro_origen IS NULL`. **⚠️ Ver §7 — la semántica de `fac_nro_origen` es contraintuitiva.**
- **R7 — Acciones masivas sobre pedidos.** *Confirmar pago* → `fac_est_woo='completed'` local **y** Woo. *Marcar como no pagado* → `fac_est_woo='cancelled'` local **y** Woo. Las notificaciones automáticas de WooCommerce al cliente se dejan tal cual (comportamiento estándar de Woo).
- **R8 — Cancelación de cotización.** Observación obligatoria (mín. 10 caracteres). Reutiliza `POST /api/order/anular` → `fac_est_fac='I'`, `fac_anu_obs`, `fac_anu_fec`.
- **R9 — Facturación en bloque.** Cada cotización genera una VTA independiente, con su propia transacción SQL. Un fallo individual **no** aborta el bloque (semántica *best-effort* con reporte por fila).
- **R10 — Base de la comisión.** `comisión_canal = ventas_totales_canal × %_canal`, sobre el total de ventas del canal (`SUM(total_linea)` de `vw_ventas_dashboard`), no sobre utilidad ni sobre venta neta de fletes.
- **R11 — Parametrización.** `%` leídos de `dbo.parametros` (`comision_woo`, `comision_local`). Si el parámetro no existe, se usa el default histórico (5,0 y 2,5) y se registra advertencia. Rango válido: `0 ≤ % ≤ 100`, hasta 2 decimales.
- **R12 — Congelamiento.** La cabecera del cierre guarda los porcentajes aplicados; cambios posteriores del parámetro no afectan cierres ya generados.
- **R13 — Contenido del detalle.** Todas las facturas `fac_tip_cod='VTA' AND fac_est_fac='A'` del período, ambos canales, incluidas las generadas durante el propio cierre. Se excluyen COT, AJT, COM y documentos anulados.
- **R14 — Anulación de cierre.** Requiere observación obligatoria. Marca `cie_estado='I'` conservando cabecera y detalle. Nunca borrado físico.

---

## 7. Datos y entidades

### 7.1 🔴 Hallazgo crítico: semántica de `fac_nro_origen`

La validación contra la BD real reveló que **la relación cotización→factura es inversa a lo intuitivo**:

```
COT1911  fac_tip_cod=COT  fac_est_fac=A  fac_nro_woo=11160  fac_nro_origen=VTA2186
VTA2186  fac_tip_cod=VTA  fac_est_fac=A  fac_nro_woo=11160  fac_nro_origen=NULL
```

- Al facturar una cotización **se crea un registro VTA nuevo** (no muta la COT).
- El puntero se estampa **en la COT**, apuntando a la VTA generada. El campo se llama `fac_nro_origen` pero funciona como *"factura destino"*.
- La COT **permanece con `fac_est_fac='A'`** tras facturarse. Por eso el criterio de "pendiente" debe incluir `fac_nro_origen IS NULL` — usar sólo `fac_est_fac='A'` traería todas las cotizaciones del mes, facturadas o no.
- `fac_est_woo` se guarda **en la COT, no en la VTA** (las 48 VTA de julio 2026 lo tienen `NULL`). La grilla de pedidos del Paso 2 debe leerse desde las COT.

**Volumen real medido:**

| Período | COT activas | Sin facturar | VTA activas |
|---|---|---|---|
| 2026-08 | 13 | 0 | — |
| 2026-07 | 37 | **1** | 48 |
| 2026-06 | 52 | 0 | — |
| 2026-05 | 24 | 1 | — |

→ El Paso 3 será liviano en la práctica (0-1 cotizaciones por mes), pero el diseño debe soportar N.

### 7.2 Tablas nuevas propuestas

**`dbo.cierre_mes`** (cabecera)

| Campo | Tipo | Nota |
|---|---|---|
| `cie_sec` | `INT IDENTITY` | PK |
| `cie_anio` | `INT NOT NULL` | |
| `cie_mes` | `INT NOT NULL` | 1-12 |
| `cie_estado` | `CHAR(1) NOT NULL` | `'A'` activo / `'I'` anulado |
| `cie_fec_cierre` | `DATETIME NOT NULL` | |
| `cie_usu_cod` | `VARCHAR(100) NOT NULL` | |
| `cie_woo_ordenes` | `INT` | # facturas canal WooCommerce |
| `cie_woo_ventas` | `DECIMAL(17,2)` | |
| `cie_woo_ticket_prom` | `DECIMAL(17,2)` | |
| `cie_woo_pct_comision` | `DECIMAL(5,2)` | **congelado** |
| `cie_woo_comision` | `DECIMAL(17,2)` | |
| `cie_woo_rentabilidad` | `DECIMAL(17,2)` | |
| `cie_loc_ordenes` | `INT` | idem canal Local |
| `cie_loc_ventas` | `DECIMAL(17,2)` | |
| `cie_loc_ticket_prom` | `DECIMAL(17,2)` | |
| `cie_loc_pct_comision` | `DECIMAL(5,2)` | **congelado** |
| `cie_loc_comision` | `DECIMAL(17,2)` | |
| `cie_loc_rentabilidad` | `DECIMAL(17,2)` | |
| `cie_total_ordenes` | `INT` | |
| `cie_total_ventas` | `DECIMAL(17,2)` | |
| `cie_total_comision` | `DECIMAL(17,2)` | |
| `cie_total_rentabilidad` | `DECIMAL(17,2)` | |
| `cie_obs` | `VARCHAR(1024) NULL` | |
| `cie_anu_obs` | `VARCHAR(1024) NULL` | |
| `cie_anu_fec` | `DATETIME NULL` | |
| `cie_anu_usu_cod` | `VARCHAR(100) NULL` | |

Índice: `CREATE UNIQUE INDEX UX_cierre_mes_periodo ON dbo.cierre_mes(cie_anio, cie_mes) WHERE cie_estado = 'A';`

**`dbo.cierre_mes_detalle`**

| Campo | Tipo | Nota |
|---|---|---|
| `cid_sec` | `INT IDENTITY` | PK |
| `cie_sec` | `INT NOT NULL` | FK → `cierre_mes` |
| `fac_sec` | `DECIMAL(18,0) NOT NULL` | FK lógica → `dbo.factura` (**`fac_sec` es `decimal`, nunca INT**) |
| `fac_nro` | `VARCHAR(15)` | denormalizado para auditoría |
| `cid_canal` | `VARCHAR(20)` | `'WooCommerce'` / `'Local'` |
| `cid_fecha` | `DATETIME` | |
| `cid_total` | `DECIMAL(17,2)` | |
| `cid_rentabilidad` | `DECIMAL(17,2)` | |
| `cid_comision` | `DECIMAL(17,2)` | comisión imputada a esa factura |

### 7.3 Contrato API → Frontend

```jsonc
// GET /api/cierre-mes  → listado
{ "success": true, "data": [
  { "cie_sec": 1, "cie_anio": 2026, "cie_mes": 7, "periodo_label": "Julio 2026",
    "cie_estado": "A", "cie_fec_cierre": "2026-08-05T10:22:11.000Z", "cie_usu_cod": "EDER",
    "cie_total_ordenes": 48, "cie_total_ventas": 8661018.00, "cie_total_comision": 388502.65 }
] }

// GET /api/cierre-mes/preflight?anio=2026&mes=7
{ "success": true, "data": {
  "periodo": { "anio": 2026, "mes": 7, "label": "Julio 2026" },
  "validacion": { "puede_cerrar": true, "motivo": null },
  "pedidos": {
    "total_woo": 37, "total_local": 36, "faltantes": 1,
    "items": [ { "fac_sec": 5012, "fac_nro": "COT1911", "fac_nro_woo": "11160",
                 "nit_nom": "MARIA PEREZ", "fac_fec": "2026-07-31",
                 "fac_est_woo": "processing", "total": 189000.00,
                 "confirmado": true, "facturado": true } ]
  },
  "cotizaciones": { "pendientes": 1, "items": [
    { "fac_sec": 5013, "fac_nro": "COT1912", "fac_nro_woo": "11161",
      "nit_nom": "JUAN GOMEZ", "fac_fec": "2026-07-31",
      "fac_est_woo": "epayco_processing", "total": 245000.00 } ] },
  "resumen": {
    "canales": [
      { "canal": "WooCommerce", "ordenes": 36, "ventas": 6879088.00, "ticket_promedio": 191085.78,
        "porcentaje_comision": 5.00, "comision": 343954.40, "rentabilidad": 0 },
      { "canal": "Local", "ordenes": 12, "ventas": 1781930.00, "ticket_promedio": 148494.17,
        "porcentaje_comision": 2.50, "comision": 44548.25, "rentabilidad": 0 }
    ],
    "totales": { "ordenes": 48, "ventas": 8661018.00, "comision": 388502.65, "rentabilidad": 0 }
  }
} }
```

---

## 8. Endpoints API

| # | Método / Ruta | Estado | Archivo backend |
|---|---|---|---|
| 1 | `POST /api/woo/sync-orders` `{FechaDesde, FechaHasta, Estado}` | ✅ Existe | `controllers/syncWooOrdersController.js:968` — ⚠️ ruta **sin middleware de auth** (`routes/syncWooOrdersRoutes.js:6`) |
| 2 | `POST /api/order/anular` `{fac_nro, fac_tip_cod, fac_obs}` | ✅ Existe | `controllers/orderController.js:191` → `models/orderModel.js:1074`. Observación obligatoria, `fac_est_fac='I'`, transaccional |
| 3 | `GET /api/parametros/:par_cod` · `PUT /api/parametros/:par_cod` | ✅ Existe | `routes/parametrosRoutes.js` (con `verifyToken`), `models/parametrosModel.js` |
| 4 | `GET /api/dashboard/ventas/ordenes-canal` | ⚠️ Incompleto | `models/ventasKpiModel.js:393-447` — comisiones **hardcodeadas** en `:413-414` (`*0.05`/`*0.025`) y `:418-419` (`5.0`/`2.5`). Debe leer de `dbo.parametros` |
| 5 | `GET /api/ordenes` | ⚠️ Incompleto | `controllers/orderController.js:143` → `models/orderModel.js:496`. No filtra por `fac_tip_cod` ni por `fac_nro_origen IS NULL`; insuficiente para las grillas del wizard |
| 6 | `PUT /api/order/:fac_nro` (conversión COT→VTA) | ⚠️ Incompleto | `controllers/orderController.js:75` → `models/orderModel.js:145`. Uno a uno, sin reporte consolidado, ruta sin auth. La orquestación vive hoy en el front (`POS2.jsx:600-780`) |
| 7 | `GET /api/cierre-mes` (listado paginado) | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 8 | `GET /api/cierre-mes/:cie_sec` (cabecera + detalle) | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 9 | `GET /api/cierre-mes/validar?anio&mes` | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 10 | `GET /api/cierre-mes/preflight?anio&mes` | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 11 | `POST /api/cierre-mes/pedidos/estado-masivo` | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 12 | `POST /api/cierre-mes/cotizaciones/facturar-bloque` | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 13 | `POST /api/cierre-mes/cotizaciones/anular-bloque` | ❌ No existe | → `SOLICITUD_BACKEND.md` (alternativa: N llamadas al #2 desde el front) |
| 14 | `POST /api/cierre-mes` (generar) | ❌ No existe | → `SOLICITUD_BACKEND.md` |
| 15 | `POST /api/cierre-mes/:cie_sec/anular` | ❌ No existe | → `SOLICITUD_BACKEND.md` |

---

## 9. Estructura de componentes propuesta

```
src/
  pages/
    CierreMes.jsx                       # Listado histórico + botón "Nuevo Cierre"
    CierreMesWizard.jsx                 # Contenedor del wizard, gestiona paso activo y estado compartido
  components/
    cierreMes/
      StepperCierre.jsx                 # Indicador visual de los 4 pasos
      PasoSeleccionPeriodo.jsx          # Selects año/mes + resultado de validación
      PasoPedidos.jsx                   # Contadores + sync + grilla con selección múltiple
      PasoCotizaciones.jsx              # Grilla + combo acción + botón observaciones
      PasoResumen.jsx                   # Tabla órdenes por canal + generar cierre
      TablaSeleccionable.jsx            # Grilla genérica con checkbox + "seleccionar todos"
      ObservacionModal.jsx              # Textarea obligatoria (cancelar cotización / anular cierre)
      ResultadoBloqueModal.jsx          # Reporte fila a fila de una operación masiva
      ComisionesConfigModal.jsx         # Edición de comision_woo / comision_local
      CierreDetalleModal.jsx            # Drill-down: resumen + lista de fac_sec
  hooks/
    useCierreMes.js                     # Estado y operaciones del wizard
    useCierresHistorico.js              # Listado, detalle y anulación de cierres
    useComisionesParams.js              # Lectura/escritura de los % en dbo.parametros
  services/
    cierreMesService.js                 # Todas las llamadas HTTP del módulo
```

**Reutilización directa:**
- Patrón de selección múltiple + acción masiva: [AprobarCostosAlertasModal.jsx](../../src/components/AprobarCostosAlertasModal.jsx) (`Set` de seleccionados, `toggleSeleccionarTodos`, contador, botón deshabilitado si `size === 0`).
- Patrón de reporte de sync: [SyncWooModal.jsx](../../src/components/SyncWooModal.jsx) (`totalItems / successCount / skippedCount / errorCount` + `messages[]`).
- Patrón de hook multi-fetch con loading/error por sección: [useVentasData.js](../../src/hooks/useVentasData.js).
- Patrón de servicio CRUD cabecera/detalle: [compraService.js](../../src/services/compraService.js).
- Formato de tabla por canal: [DashboardVentas.jsx:692-745](../../src/pages/DashboardVentas.jsx#L692-L745).

---

## 10. Custom hooks propuestos

### `useCierreMes()`
**Responsabilidad:** orquestar el wizard — período seleccionado, validación, preflight, acciones masivas y generación.

```js
const {
  // período
  anio, mes, setAnio, setMes,
  validacion,            // { puede_cerrar, motivo }
  validando,
  // preflight
  preflight,             // { pedidos, cotizaciones, resumen }
  loadingPreflight, errorPreflight, refetchPreflight,
  // paso 2
  sincronizarFaltantes,  // () => Promise<reporte>
  actualizarEstadoMasivo,// (facSecs[], 'confirmar'|'no_pagado') => Promise<reporte>
  // paso 3
  facturarBloque,        // (facSecs[]) => Promise<reporte>
  cancelarBloque,        // (facSecs[], observacion) => Promise<reporte>
  // paso 4
  generarCierre,         // (observacion) => Promise<cierre>
  generando,
  // navegación
  pasoActual, avanzar, retroceder, puedeAvanzar,
} = useCierreMes();
```

### `useCierresHistorico()`
`{ cierres, loading, error, page, setPage, fetchDetalle, anularCierre, refetch }`

### `useComisionesParams()`
`{ comisionWoo, comisionLocal, loading, guardar({ woo, local }), guardando }` — lee/escribe `dbo.parametros` vía `GET/PUT /api/parametros/:par_cod`.

---

## 11. Cambios en rutas (`src/App.jsx`)

```jsx
<Route
  path="cierre-mes"
  element={
    <ProtectedRoute requiredModule="cierre_mes" requiredPermission="view">
      <CierreMes />
    </ProtectedRoute>
  }
/>
<Route
  path="cierre-mes/nuevo"
  element={
    <ProtectedRoute requiredModule="cierre_mes" requiredPermission="create">
      <CierreMesWizard />
    </ProtectedRoute>
  }
/>
```

Adicional:
- Entrada de menú en [AdminLayout.jsx](../../src/layouts/AdminLayout.jsx) (~línea 262) con ícono de calendario/candado.
- Label de breadcrumb en `AdminLayout.jsx:59-79`: `'cierre-mes' → 'Cierre de Mes'`, `'nuevo' → 'Nuevo Cierre'`.
- Registrar el módulo en [RoleManager.jsx:9-19](../../src/pages/RoleManager.jsx#L9-L19).

---

## 12. Permisos / Roles RBAC

Nuevo módulo `cierre_mes` — requiere **INSERT en `dbo.Modulos`** (los módulos viven en BD, no sólo en el front):

```sql
INSERT INTO dbo.Modulos (mod_codigo, mod_nombre, mod_descripcion, mod_activo)
VALUES ('cierre_mes', 'Cierre de Mes', 'Proceso de cierre contable mensual', 1);
```
*(módulos actuales: `dashboard`, `products`, `clients`, `orders`, `pos`, `ajustes`, `conteos`, `admin`, `promociones` → el nuevo sería `mod_id = 10`)*

| Permiso | Habilita |
|---|---|
| `view` | Ver el listado histórico y el detalle de un cierre |
| `create` | Ejecutar el wizard completo: sincronizar, actualizar estados masivos, facturar/cancelar cotizaciones y generar el cierre |
| `edit` | Configurar los porcentajes de comisión |
| `delete` | Anular un cierre existente |

---

## 13. Estados UI

| Estado | Tratamiento |
|---|---|
| **Loading** | Skeletons en las grillas (filas grises animadas); spinner con texto en operaciones largas ("Sincronizando pedidos de WooCommerce…", "Generando N facturas…"). Botones de acción deshabilitados durante la operación. |
| **Empty** | Paso 2: *"No hay pedidos de WooCommerce en este período."* · Paso 3: ✅ *"Todas las cotizaciones del período están facturadas."* (verde, habilita avanzar) · Listado: *"Aún no se ha generado ningún cierre de mes."* con CTA. |
| **Error** | Banner rojo con `bg-red-50 border-red-200` + mensaje del backend + botón **Reintentar**. En operaciones masivas parcialmente fallidas: modal de resultado con filas ✅/⚠️/❌. |
| **Success** | `react-toastify` para operaciones completadas (`"12 pedidos actualizados"`, `"Cierre de Julio 2026 generado"`). SweetAlert2 sólo para confirmaciones previas a acciones destructivas o irreversibles. |
| **Bloqueado** | Botón *Siguiente* deshabilitado con tooltip explicando el motivo (`"Quedan 3 pedidos sin estado confirmado"`). |

Estilos: glassmorphism `bg-white/80 backdrop-blur-md`, `rounded-2xl`, `shadow-lg`, color primario `#f58ea3` en botones y en el paso activo del stepper.

---

## 14. Criterios de aceptación

1. No se puede generar un segundo cierre activo para el mismo `(Año, Mes)` — validado en UI **y** rechazado por índice único en BD (HTTP 409).
2. No se puede cerrar el mes en curso ni un mes futuro; el mensaje indica el período máximo permitido.
3. Tras pulsar *Sincronizar faltantes*, el contador de faltantes queda en 0 o se muestra el motivo del residuo.
4. El checkbox aparece **únicamente** en pedidos cuyo `fac_est_woo` no esté en {`processing`, `completed`, `epayco_processing`, `epayco_completed`}.
5. *Confirmar pago* deja el pedido en `completed` en el sistema local **y** en WooCommerce; *Marcar como no pagado* lo deja en `cancelled` en ambos.
6. El Paso 3 lista exactamente las cotizaciones con `fac_tip_cod='COT' AND fac_est_fac='A' AND fac_nro_origen IS NULL` del período.
7. *Facturar* genera una VTA por cotización seleccionada, con la COT quedando enlazada a la nueva VTA vía `fac_nro_origen`; el modal reporta el resultado de cada una.
8. *Cancelar* exige observación de mínimo 10 caracteres y deja la COT en `fac_est_fac='I'` con `fac_anu_obs` poblado.
9. El resumen del Paso 4 coincide, cifra por cifra, con el panel *Órdenes por Canal* de `/dashboard/ventas` para el mismo período.
10. Cambiar los porcentajes en el modal de configuración recalcula el resumen en vivo y afecta a `/dashboard/ventas` en adelante.
11. La cabecera del cierre almacena los porcentajes aplicados; modificarlos después no altera cierres ya generados.
12. El detalle contiene un registro por cada VTA activa del período, y su suma reproduce exactamente los totales de la cabecera.
13. Anular un cierre exige observación, marca `cie_estado='I'` y permite volver a cerrar ese período.
14. Un usuario sin permiso `cierre_mes.view` no ve la opción en el menú ni puede acceder por URL directa.

---

## 15. Gaps y Dudas (bloqueantes)

| # | Gap | Bloqueante | Notas |
|---|---|---|---|
| G1 | Tablas `cierre_mes` / `cierre_mes_detalle` y sus 9 endpoints no existen | 🔴 Sí | Ver `SOLICITUD_BACKEND.md` (SOLICITUD-1 a SOLICITUD-5) |
| G2 | No existe facturación en bloque de cotizaciones | 🔴 Sí | La lógica COT→VTA vive hoy en el front (`POS2.jsx:600-780`). Debe portarse al backend para ejecutarse en bloque con transacción por documento |
| G3 | No existe actualización masiva de estado de pedidos | 🔴 Sí | Sólo `PUT /api/order/:fac_nro`, uno a uno |
| G4 | Comisiones hardcodeadas en SQL | 🟡 Parcial | `ventasKpiModel.js:413-414` y `:418-419`. El wizard puede funcionar con los defaults, pero el requisito de parametrización queda incumplido |
| G5 | `routes/orderRoutes.js` y `routes/syncWooOrdersRoutes.js` no aplican middleware de auth | 🟡 Parcial | Un proceso de cierre contable debe exigir autenticación. Los endpoints nuevos deben llevar `verifyToken` sí o sí |
| G6 | Rentabilidad por canal en el cierre | 🟢 No | `vw_ventas_dashboard` expone `rentabilidad_real` por línea; confirmar con el usuario si el cierre debe congelar también la rentabilidad o sólo ventas y comisión |

---

## 16. Riesgos identificados

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Divergencia entre la lógica COT→VTA del front (`POS2.jsx`) y la nueva del backend en bloque | Alta | Alto | Portar la lógica al backend como fuente única y, en fase 2, hacer que `POS2.jsx` consuma el mismo endpoint con un único elemento |
| El cliente recibe el email estándar de WooCommerce al cambiar el estado de un pedido de un mes vencido | Alta | Bajo | **Aceptado por el usuario**: es el comportamiento normal de la tienda y no se interviene. Se advierte en el copy de la confirmación (SweetAlert2) para que el usuario lo tenga presente antes de aplicar la acción masiva |
| Facturación en bloque falla a mitad y deja el mes inconsistente | Media | Alto | Transacción independiente por cotización + reporte fila a fila + posibilidad de reintentar sólo las fallidas |
| Cierre generado con cifras que luego no cuadran con el dashboard | Media | Medio | Cabecera y detalle se calculan en la **misma consulta/transacción** contra `vw_ventas_dashboard`; el detalle permite recalcular y comparar |
| Cambio de existencias entre el preflight y la facturación en bloque | Media | Medio | Revalidar existencias dentro de la transacción de cada documento (ya lo hace `orderController.js:44`) |
| Timeout del wizard con meses de alto volumen | Baja | Medio | Facturación en bloque por lotes con feedback de progreso; el sync de Woo ya trabaja en lotes de 10 |
| Concurrencia de dos cierres simultáneos | Baja | Alto | Índice único filtrado en BD + manejo de 409 en el front |
| Timezone en los rangos de fecha del período | Media | Medio | Enviar siempre fechas como string `'YYYY-MM-DD'` y comparar con rango semiabierto en SQL (bug conocido del driver `mssql`) |

---

## 17. Estimación

| Fase | Alcance | Estimación |
|---|---|---|
| **F0 — Backend (bloqueante)** | Tablas, migración RBAC, 9 endpoints, parametrización de comisiones | 3-4 días *(repo `api_pretty`, fuera de este SPEC)* |
| **F1 — Servicio y hooks** | `cierreMesService.js`, `useCierreMes`, `useCierresHistorico`, `useComisionesParams` | 0,5 día |
| **F2 — Listado histórico** | `CierreMes.jsx` + `CierreDetalleModal` + anulación | 0,5 día |
| **F3 — Wizard pasos 1-2** | Stepper, selección de período, grilla de pedidos con acción masiva, sync | 1 día |
| **F4 — Wizard paso 3** | Grilla de cotizaciones, combo de acción, modales de observación y resultado | 0,75 día |
| **F5 — Wizard paso 4** | Resumen por canal, modal de comisiones, generación | 0,5 día |
| **F6 — Rutas, RBAC, menú, pulido** | `App.jsx`, `AdminLayout`, `RoleManager`, estados UI | 0,5 día |
| **F7 — Pruebas manuales** | Puerto 5174, con datos reales de julio/junio 2026 | 0,75 día |
| | **Total frontend** | **≈ 4,5 días** |

---

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|---|---|
| 1 | Formato del proceso | Wizard secuencial de pasos bloqueantes, página propia, abandonable y retomable ✅ |
| 2 | Persistencia del avance | El cierre se guarda **sólo al final**; abandonar no deja registro "en proceso" ✅ |
| 3 | Bloqueo por pedidos indefinidos | No se avanza hasta resolver todos los pedidos no confirmados ✅ |
| 4 | Bloqueo por cotizaciones | No se avanza mientras quede una cotización activa sin facturar ✅ |
| 5 | Canales | Sólo WooCommerce y Local, según `canal_venta` de `vw_ventas_dashboard` ✅ |
| 6 | Base de la comisión | Sobre el **total de ventas** del canal, no sobre utilidad ni venta neta ✅ |
| 7 | Parametrización de comisiones | Valor vigente global por canal en `dbo.parametros`; el cierre **congela** el % aplicado. Sin vigencias históricas ✅ |
| 8 | Reversión | Se puede anular/reabrir un cierre (`cie_estado='I'`) con observación; nunca borrado físico ✅ |
| 9 | RBAC | Módulo nuevo `cierre_mes` con `view` / `create` / `edit` / `delete` ✅ |
| 10 | Contenido del detalle | Todas las VTA activas del período, ambos canales, incluidas las generadas en el cierre ✅ |
| 11 | Propagación de estado a Woo | **REVISADA por el usuario:** se actualiza local **y** WooCommerce. *Confirmar pago → `completed`*, *No pagado → `cancelled`*. Los emails automáticos de WooCommerce **se dejan activos** (decisión del usuario: no complejizar) ✅ |
| 12 | Listado histórico | Pantalla de cierres con drill-down a los `fac_sec` ✅ |
| 13 | Copy y notificaciones | SweetAlert2 para confirmaciones destructivas, react-toastify para éxitos, todo en español ✅ |

---

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|---|---|---|---|
| POST | `/api/woo/sync-orders` | `controllers/syncWooOrdersController.js:968` | ✅ (sin auth ⚠️) |
| GET | `/api/ordenes` | `controllers/orderController.js:143` → `models/orderModel.js:496` | ⚠️ sin filtro por `fac_tip_cod` |
| PUT | `/api/order/:fac_nro` | `controllers/orderController.js:75` → `models/orderModel.js:145` | ⚠️ uno a uno, sin auth |
| POST | `/api/order/anular` | `controllers/orderController.js:191` → `models/orderModel.js:1074` | ✅ |
| PUT | `/api/confirmOrder/:fac_nro_woo` | `controllers/confirmOrderController.js` | ✅ (referencia de propagación a Woo) |
| GET | `/api/dashboard/ventas/ordenes-canal` | `controllers/ventasKpiController.js:400` → `models/ventasKpiModel.js:393-447` | ⚠️ comisiones hardcodeadas |
| GET/PUT | `/api/parametros/:par_cod` | `routes/parametrosRoutes.js`, `models/parametrosModel.js` | ✅ |
| — | `/api/cierre-mes/*` | no existe | ❌ |

### BD consultada

| Tabla / Vista | Hallazgo relevante |
|---|---|
| `dbo.factura` | `fac_sec decimal` (nunca INT), `fac_nro varchar(15)`, `fac_tip_cod varchar(5)`, `fac_est_fac char(1)`, `fac_est_woo varchar(50)`, `fac_nro_origen nvarchar(15)`, `fac_anu_obs varchar(1024)` |
| `dbo.factura` | 🔴 **`fac_nro_origen` se guarda en la COT apuntando a la VTA generada** (`COT1911 → VTA2186`); la COT permanece `fac_est_fac='A'` tras facturarse |
| `dbo.factura` | 🔴 **`fac_est_woo` vive en la COT, no en la VTA** (las 48 VTA de julio 2026 lo tienen `NULL`) |
| `dbo.factura` | Julio 2026: 37 COT activas (1 sin facturar), 48 VTA activas, 11 AJT, 5 COM. Estados Woo: `processing` (33), `on_hold` (2), `epayco_processing` (1), `NULL` (1) |
| `dbo.vw_ventas_dashboard` | `canal_venta` ∈ {`'Local'`, `'WooCommerce'`}; expone `anio`, `mes`, `fac_sec`, `total_linea`, `rentabilidad_real`, `estado_interno`. Julio 2026: Woo 36 fact. / $6.879.088 · Local 12 fact. / $1.781.930 |
| `dbo.parametros` | `par_cod varchar(50)` PK, `par_value varchar(MAX)`. Contiene `monto_mayorista`, `status_store`, `woo_ck`, `woo_cs`, `url_tienda`… → destino de `comision_woo` / `comision_local` |
| `dbo.secuencia` | `sec_cod`, `sec_des`, `sec_num`. `FACTURA` = 5087. Usar con `UPDLOCK, HOLDLOCK` |
| `dbo.tipo_comprobantes` | `VTA` → `fue_cod 1`, `tip_lon 6`, `tip_con_sec 2207` · `COT` → `fue_cod 4`, `tip_lon 5`, `tip_con_sec 1926` |
| `dbo.Modulos` | `mod_id`, `mod_codigo`, `mod_nombre`, `mod_descripcion`, `mod_activo`. 9 módulos activos; falta insertar `cierre_mes` |
| `RolesPermisos` / `RolesPermisosAcciones` / `vw_UsuarioPermisos` | RBAC persistido en BD — el módulo nuevo requiere migración SQL, no sólo cambio en `RoleManager.jsx` |
| — | ❌ No existe ninguna tabla `%cierre%`, `%comision%` ni `%periodo%` |

> **Nota operativa:** `scripts/db-query.js` falla con Node 25 (`buffer-equal-constant-time` usa `SlowBuffer`, removido en Node 25). Ejecutar con `~/.nvm/versions/node/v20.20.0/bin/node scripts/db-query.js "..."`.

---

## Fuera de alcance / preguntas pendientes

- **Rentabilidad en el cierre (G6):** confirmar si la cabecera debe congelar también `rentabilidad` por canal o basta con ventas y comisión. El SPEC la incluye por defecto.
- **Recálculo automático de cierres anulados:** el detalle guardado lo permite, pero la funcionalidad no se implementa en esta fase.
- **Exportación PDF/Excel del cierre:** candidato a fase 2.
- **Cierre de caja diario:** no confundir con este proceso; no existe hoy y no está en alcance.
- **Unificación de `POS2.jsx` con el endpoint de facturación del backend:** deseable, pero se propone como refactor posterior para no ampliar el riesgo de esta entrega.

---

## Próximos pasos sugeridos

- [ ] Resolver gaps de backend — ver `SOLICITUD_BACKEND.md` (5 solicitudes)
- [ ] Confirmar duda G6 (rentabilidad congelada en el cierre)
- [ ] Ejecutar la migración SQL del módulo RBAC `cierre_mes`
- [ ] Ejecutar `/impl-builder` una vez aprobado este SPEC
