---
slug: cierre-de-mes
origen: SPEC.md del frontend POS Pretty (IMPLEMENTACIONES_2026_IA/cierre_de_mes_09-09-2026/)
fecha: 2026-09-09
estado: pendiente
---

# Solicitud Formal al Backend: Cierre de Mes

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

Se va a implementar en el panel administrativo de POS Pretty un proceso de **Cierre de Mes**: un wizard de 4 pasos (`/cierre-mes/nuevo`) que consolida los pedidos de WooCommerce de un período, resuelve los pedidos con pago no confirmado, factura o cancela las cotizaciones pendientes, y finalmente genera un registro cabecera/detalle que **congela** las ventas y comisiones del mes por canal para auditoría y recálculo posterior. Un listado histórico (`/cierre-mes`) permite consultar y anular cierres.

Hoy el backend no tiene **nada** de esto: no existe ninguna tabla `%cierre%`, ni endpoints de cierre, ni facturación en bloque, ni actualización masiva de estado de pedidos. Además, los porcentajes de comisión están hardcodeados en el SQL de `models/ventasKpiModel.js`.

### Hallazgos de la BD que condicionan el diseño

1. 🔴 **`fac_nro_origen` tiene semántica inversa.** Al facturar una cotización se **crea un registro VTA nuevo** y el puntero se estampa **en la COT**, apuntando a la VTA generada:
   ```
   COT1911  fac_tip_cod=COT  fac_est_fac=A  fac_nro_woo=11160  fac_nro_origen=VTA2186
   VTA2186  fac_tip_cod=VTA  fac_est_fac=A  fac_nro_woo=11160  fac_nro_origen=NULL
   ```
   La COT **permanece `fac_est_fac='A'`** tras facturarse. Por tanto, "cotización pendiente de facturar" = `fac_tip_cod='COT' AND fac_est_fac='A' AND fac_nro_origen IS NULL`.

2. 🔴 **`fac_est_woo` se guarda en la COT, no en la VTA.** Las 48 VTA activas de julio 2026 lo tienen `NULL`. La grilla de pedidos del wizard debe alimentarse de las COT.

3. **Volumen real:** julio 2026 → 37 COT activas (1 sin facturar), 48 VTA activas, 36 en canal WooCommerce ($6.879.088) y 12 Local ($1.781.930). Meses anteriores: 0-1 cotización pendiente cada uno.

---

## Solicitudes

### [SOLICITUD-1] Nuevas tablas `cierre_mes` y `cierre_mes_detalle`

- **Tipo:** Nueva estructura de BD
- **Archivo backend actual:** no existe

**Cabecera `dbo.cierre_mes`:**

| Campo | Tipo | Nota |
|---|---|---|
| `cie_sec` | `INT IDENTITY(1,1)` | PK |
| `cie_anio` | `INT NOT NULL` | |
| `cie_mes` | `INT NOT NULL` | 1-12 |
| `cie_estado` | `CHAR(1) NOT NULL` | `'A'` activo / `'I'` anulado |
| `cie_fec_cierre` | `DATETIME NOT NULL` | |
| `cie_usu_cod` | `VARCHAR(100) NOT NULL` | de `req.user.usu_cod` |
| `cie_woo_ordenes` | `INT` | |
| `cie_woo_ventas` | `DECIMAL(17,2)` | |
| `cie_woo_ticket_prom` | `DECIMAL(17,2)` | |
| `cie_woo_pct_comision` | `DECIMAL(5,2)` | **congelado al momento del cierre** |
| `cie_woo_comision` | `DECIMAL(17,2)` | |
| `cie_woo_rentabilidad` | `DECIMAL(17,2)` | |
| `cie_loc_ordenes` | `INT` | |
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

**Índice único filtrado obligatorio** (evita cierres duplicados por concurrencia, no confiar solo en validación aplicativa):
```sql
CREATE UNIQUE INDEX UX_cierre_mes_periodo
  ON dbo.cierre_mes (cie_anio, cie_mes)
  WHERE cie_estado = 'A';
```

**Detalle `dbo.cierre_mes_detalle`:**

| Campo | Tipo | Nota |
|---|---|---|
| `cid_sec` | `INT IDENTITY(1,1)` | PK |
| `cie_sec` | `INT NOT NULL` | FK → `dbo.cierre_mes` |
| `fac_sec` | `DECIMAL(18,0) NOT NULL` | ⚠️ `dbo.factura.fac_sec` es **`decimal`**, nunca INT |
| `fac_nro` | `VARCHAR(15)` | denormalizado para auditoría |
| `cid_canal` | `VARCHAR(20)` | `'WooCommerce'` / `'Local'` |
| `cid_fecha` | `DATETIME` | |
| `cid_total` | `DECIMAL(17,2)` | |
| `cid_rentabilidad` | `DECIMAL(17,2)` | |
| `cid_comision` | `DECIMAL(17,2)` | comisión imputada a esa factura |

Índice sugerido: `IX_cierre_mes_detalle_cie ON dbo.cierre_mes_detalle(cie_sec)`.

- **Impacto si no se resuelve:** la funcionalidad completa queda bloqueada.

---

### [SOLICITUD-2] Endpoints de consulta y validación del cierre

- **Tipo:** Nuevos endpoints
- **Archivo backend actual:** no existe → se sugiere `routes/cierreMesRoutes.js`, `controllers/cierreMesController.js`, `models/cierreMesModel.js`
- **Auth:** todos con `verifyToken` (`middlewares/auth.js`)

#### 2.1 `GET /api/cierre-mes?page=1&pageSize=20`
Listado paginado, más recientes primero.
```json
{ "success": true,
  "data": [
    { "cie_sec": 1, "cie_anio": 2026, "cie_mes": 7, "cie_estado": "A",
      "cie_fec_cierre": "2026-08-05T10:22:11.000Z", "cie_usu_cod": "EDER",
      "cie_total_ordenes": 48, "cie_total_ventas": 8661018.00,
      "cie_total_comision": 388502.65 }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3 } }
```

#### 2.2 `GET /api/cierre-mes/:cie_sec`
Cabecera completa + array `detalle[]` con todos los `fac_sec`.

#### 2.3 `GET /api/cierre-mes/validar?anio=2026&mes=7`
Valida las dos reglas de período **antes** de dejar avanzar el wizard.
```json
{ "success": true,
  "data": { "puede_cerrar": false,
            "motivo": "Ya existe un cierre activo para Julio 2026",
            "codigo": "CIERRE_EXISTENTE",
            "cierre_existente": { "cie_sec": 1, "cie_fec_cierre": "2026-08-05T10:22:11.000Z", "cie_usu_cod": "EDER" } } }
```
Códigos: `OK`, `CIERRE_EXISTENTE`, `MES_NO_VENCIDO` (el período debe ser **estrictamente anterior** al mes en curso del servidor: para cerrar julio 2026 la fecha del sistema debe ser agosto 2026 o posterior).

- **Errores esperados:** 400 (año/mes inválidos), 401, 404 (`:cie_sec` inexistente)
- **Impacto si no se resuelve:** no se puede iniciar el wizard.

---

### [SOLICITUD-3] Preflight del período (pedidos + cotizaciones + resumen)

- **Tipo:** Nuevo endpoint
- **Endpoint:** `GET /api/cierre-mes/preflight?anio=2026&mes=7`
- **Archivo backend actual:** no existe. Reutilizar la consulta de `models/ventasKpiModel.js:393-447` para el bloque `resumen`.

Un solo endpoint que alimenta los pasos 2, 3 y 4 del wizard, para no encadenar 4 requests.

- **Response 200 esperado:**
```json
{ "success": true, "data": {
  "periodo": { "anio": 2026, "mes": 7, "label": "Julio 2026" },
  "validacion": { "puede_cerrar": true, "motivo": null, "codigo": "OK" },
  "pedidos": {
    "total_woo": 37,
    "total_local": 36,
    "faltantes": 1,
    "items": [
      { "fac_sec": 5012, "fac_nro": "COT1911", "fac_nro_woo": "11160",
        "nit_nom": "MARIA PEREZ", "fac_fec": "2026-07-31",
        "fac_est_woo": "processing", "total": 189000.00,
        "confirmado": true, "facturado": true, "fac_nro_origen": "VTA2186" }
    ]
  },
  "cotizaciones": {
    "pendientes": 1,
    "items": [
      { "fac_sec": 5013, "fac_nro": "COT1912", "fac_nro_woo": "11161",
        "nit_nom": "JUAN GOMEZ", "fac_fec": "2026-07-31",
        "fac_est_woo": "epayco_processing", "total": 245000.00 }
    ]
  },
  "resumen": {
    "canales": [
      { "canal": "WooCommerce", "ordenes": 36, "ventas": 6879088.00,
        "ticket_promedio": 191085.78, "porcentaje_comision": 5.00,
        "comision": 343954.40, "rentabilidad": 0 },
      { "canal": "Local", "ordenes": 12, "ventas": 1781930.00,
        "ticket_promedio": 148494.17, "porcentaje_comision": 2.50,
        "comision": 44548.25, "rentabilidad": 0 }
    ],
    "totales": { "ordenes": 48, "ventas": 8661018.00, "comision": 388502.65, "rentabilidad": 0 }
  }
} }
```

**Criterios de las consultas:**
- `pedidos.items` → `fac_tip_cod='COT' AND fac_est_fac='A' AND fac_nro_woo IS NOT NULL AND fac_nro_woo<>''` del período.
- `confirmado` = `fac_est_woo IN ('processing','completed','epayco_processing','epayco_completed')`. Cualquier otro valor (incluido `NULL`, `pending`, `on_hold`, `epayco_pending`, `epayco_failed`, `epayco_cancelled`, `epayco_refunded`) → `false`, y el frontend le muestra checkbox.
- `facturado` = `fac_nro_origen IS NOT NULL`.
- `total_woo` = conteo consultando la API de WooCommerce para el rango del mes con los estados `pending, processing, completed, epayco-pending, epayco-processing, epayco-completed, on-hold`. `total_local` = conteo de los sincronizados. `faltantes` = diferencia.
- `cotizaciones.items` → `fac_tip_cod='COT' AND fac_est_fac='A' AND fac_nro_origen IS NULL` del período (incluye cotizaciones locales sin `fac_nro_woo`).
- `resumen` → desde `dbo.vw_ventas_dashboard` filtrando `anio`, `mes`, `estado_interno='A'`, agrupando por `canal_venta`, con los porcentajes leídos de `dbo.parametros` (ver SOLICITUD-5).

- **Errores esperados:** 400, 401, 502 (WooCommerce inaccesible — el frontend lo trata como bloqueante y ofrece reintentar)
- **Impacto si no se resuelve:** los pasos 2, 3 y 4 del wizard quedan sin datos.

---

### [SOLICITUD-4] Operaciones masivas del wizard

- **Tipo:** Nuevos endpoints
- **Auth:** `verifyToken` obligatorio

#### 4.1 `POST /api/cierre-mes/pedidos/estado-masivo`

Actualiza el estado de N pedidos en el **sistema local y en WooCommerce**.

- **Request:**
```json
{ "fac_secs": [5012, 5013, 5014], "accion": "confirmar" }
```
`accion` ∈ `"confirmar"` → `fac_est_woo='completed'` · `"no_pagado"` → `fac_est_woo='cancelled'`. En ambos casos se propaga a WooCommerce.

- **Response 200 (semántica best-effort, `success:true` aunque haya fallos parciales):**
```json
{ "success": true, "data": {
  "totalItems": 3, "successCount": 2, "errorCount": 1,
  "resultados": [
    { "fac_sec": 5012, "fac_nro": "COT1911", "ok": true,  "local": true, "woo": true,  "mensaje": "Actualizado a completed" },
    { "fac_sec": 5013, "fac_nro": "COT1912", "ok": true,  "local": true, "woo": false, "mensaje": "Actualizado localmente; WooCommerce no respondió" },
    { "fac_sec": 5014, "fac_nro": "COT1913", "ok": false, "local": false,"woo": false, "mensaje": "Pedido Woo 11161 no encontrado" }
  ] } }
```

**Sobre las notificaciones al cliente:** el cambio de estado dispara los emails estándar de WooCommerce. **Es aceptado y deseado** — no se requiere ninguna supresión ni marcado especial. Usar la actualización de estado normal de la REST API de Woo.

#### 4.2 `POST /api/cierre-mes/cotizaciones/facturar-bloque`

Convierte N cotizaciones en facturas de venta, **reutilizando la lógica existente** de COT→VTA que hoy vive en el frontend (`src/POS2.jsx:600-780 handleFacturarOrder`) y se apoya en `models/orderModel.js:145 updateOrder` / `createCompleteOrder`.

- **Request:**
```json
{ "fac_secs": [5013, 5015] }
```

- **Response 200:**
```json
{ "success": true, "data": {
  "totalItems": 2, "successCount": 1, "errorCount": 1,
  "resultados": [
    { "fac_sec": 5013, "fac_nro": "COT1912", "ok": true,  "fac_nro_generado": "VTA2207", "fac_sec_generado": 5090 },
    { "fac_sec": 5015, "fac_nro": "COT1914", "ok": false, "mensaje": "Sin existencias suficientes del artículo 12345" }
  ] } }
```

**Requisitos:**
- **Una transacción SQL independiente por cotización.** Un fallo individual no debe abortar el bloque ni dejar documentos a medias.
- Debe replicar exactamente el comportamiento actual: `fac_tip_cod='VTA'`, `kar_nat='-'`, conservar `fac_fec` y `fac_descuento_general` de la COT, trazabilidad vía `kar_kar_sec_ori`/`kar_fac_sec_ori`, y **estampar `fac_nro_origen` en la COT** apuntando a la VTA generada.
- Validar existencias antes de cada documento (como ya hace `controllers/orderController.js:44`).
- `fac_nro` generado con `dbo.secuencia` + `dbo.tipo_comprobantes` usando `UPDLOCK, HOLDLOCK` (nunca `MAX+1`).
- ⚠️ A diferencia del endpoint actual `PUT /api/order/:fac_nro`, la respuesta **debe devolver el `fac_nro` generado** de cada factura (hoy sólo retorna `{success:true, message:"..."}`).

#### 4.3 `POST /api/cierre-mes/cotizaciones/anular-bloque`

- **Request:**
```json
{ "fac_secs": [5013, 5015], "fac_obs": "Cliente no confirmó el pago tras 60 días" }
```
- Aplica la misma lógica de `models/orderModel.js:1074 anularDocumento` a cada cotización (`fac_est_fac='I'`, `fac_anu_obs`, `fac_anu_fec`).
- Observación obligatoria, mínimo 10 caracteres.
- Response con el mismo formato `{ totalItems, successCount, errorCount, resultados[] }`.

*Alternativa aceptable si se prefiere no crear este endpoint: el frontend puede iterar sobre `POST /api/order/anular`, que ya existe y funciona. Se solicita la versión en bloque solo por consistencia y para evitar N requests.*

- **Errores esperados:** 400 (array vacío, acción inválida, observación corta), 401, 409 (cotización ya facturada o ya anulada)
- **Impacto si no se resuelve:** los pasos 2 y 3 del wizard no pueden ejecutar sus acciones.

---

### [SOLICITUD-5] Parametrizar comisiones y generar/anular el cierre

#### 5.1 Migrar los porcentajes hardcodeados a `dbo.parametros`

- **Tipo:** Corrección / refactor
- **Archivo backend actual:** `models/ventasKpiModel.js` — literales en **líneas 413-414** (`* 0.05` WooCommerce, `* 0.025` Local) y **líneas 418-419** (`5.0` / `2.5` como `porcentaje_comision`)

La tabla `dbo.parametros (par_cod VARCHAR(50), par_value VARCHAR(MAX))` ya existe con endpoints `GET/PUT /api/parametros/:par_cod` (con `verifyToken`). Se solicita:

```sql
INSERT INTO dbo.parametros (par_cod, par_value) VALUES ('comision_woo',   '5.0');
INSERT INTO dbo.parametros (par_cod, par_value) VALUES ('comision_local', '2.5');
```

Y que `GET /api/dashboard/ventas/ordenes-canal` (y el `resumen` de SOLICITUD-3) **lean estos parámetros** en lugar de los literales. Si un parámetro no existe o no es numérico, usar el default histórico (5.0 / 2.5) y registrar advertencia en log. Validar rango `0 ≤ valor ≤ 100`.

#### 5.2 `POST /api/cierre-mes` — generar el cierre

- **Request:**
```json
{ "anio": 2026, "mes": 7, "cie_obs": "Cierre revisado con contabilidad" }
```

- **Response 201:** la cabecera creada con su `cie_sec` y el conteo de registros de detalle.

**Requisitos:**
- Revalidar en el servidor **ambas** reglas de período (no duplicado activo + mes estrictamente vencido). No confiar en la validación del frontend.
- Todo dentro de **una sola transacción SQL**: cabecera + detalle.
- Los porcentajes se leen de `dbo.parametros` **en el momento del cierre** y se **congelan** en `cie_woo_pct_comision` / `cie_loc_pct_comision`. Cambios posteriores del parámetro no deben alterar cierres ya generados.
- El detalle incluye **todas las facturas `fac_tip_cod='VTA' AND fac_est_fac='A'`** del período, ambos canales, incluidas las generadas durante el propio cierre. Se excluyen COT, AJT, COM y documentos anulados.
- La suma del detalle debe cuadrar exactamente con los totales de la cabecera.
- Rango de fechas siempre semiabierto: `fac_fec >= 'YYYY-MM-01' AND fac_fec < 'YYYY-(MM+1)-01'`.

- **Errores esperados:** 400 (parámetros inválidos), 401, 409 (`CIERRE_EXISTENTE` por índice único, o `MES_NO_VENCIDO`), 422 (quedan cotizaciones sin facturar o pedidos sin confirmar — validación defensiva del servidor)

#### 5.3 `POST /api/cierre-mes/:cie_sec/anular`

- **Request:** `{ "cie_anu_obs": "Se detectó una factura duplicada en el período" }`
- Marca `cie_estado='I'`, `cie_anu_fec`, `cie_anu_usu_cod`, `cie_anu_obs`. **Nunca borrado físico** — cabecera y detalle se conservan para auditoría.
- Al quedar `cie_estado='I'`, el índice único filtrado libera el período y permite volver a cerrarlo.
- Observación obligatoria, mínimo 10 caracteres.
- **Errores esperados:** 400, 401, 404, 409 (ya anulado)

#### 5.4 Migración RBAC

El RBAC vive en BD (`dbo.Modulos`, `RolesPermisos`, `RolesPermisosAcciones`, `vw_UsuarioPermisos`), no sólo en el frontend. Se requiere:

```sql
INSERT INTO dbo.Modulos (mod_codigo, mod_nombre, mod_descripcion, mod_activo)
VALUES ('cierre_mes', 'Cierre de Mes', 'Proceso de cierre contable mensual', 1);
```
Módulos actuales: `dashboard`, `products`, `clients`, `orders`, `pos`, `ajustes`, `conteos`, `admin`, `promociones` (`mod_id` 1-9). Acciones necesarias: `view`, `create`, `edit`, `delete`.

- **Impacto si no se resuelve:** sin 5.1 el requisito de parametrización queda incumplido; sin 5.2/5.3 no hay cierre; sin 5.4 el `<ProtectedRoute requiredModule="cierre_mes">` bloquea el acceso a todos los usuarios.

---

## Notas para el Backend

- `dbo.factura.fac_sec` es **`decimal`** — nunca asumir INT en los `sql.input(...)`.
- `fac_nro` es `VARCHAR(15)`; `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- 🔴 **`fac_nro_origen` se guarda en la COT apuntando a la VTA generada**, y la COT queda `fac_est_fac='A'` tras facturarse. El criterio de pendiente es `fac_nro_origen IS NULL`.
- 🔴 **`fac_est_woo` está en la COT, no en la VTA.**
- Fechas como string `'YYYY-MM-DD'` y rangos semiabiertos (`>= inicio AND < inicio_mes_siguiente`) por el bug de timezone del driver `mssql`.
- `articulosdetalle` siempre con `bod_sec = '1'`.
- Secuencias vía `dbo.secuencia` + `dbo.tipo_comprobantes` con `UPDLOCK, HOLDLOCK` (ver `models/orderModel.js:741-773` y `utils/secuenciaUtils.js`). Nunca `MAX+1`.
- Estados Woo: la API de WooCommerce usa guiones (`on-hold`, `epayco-processing`) pero el backend los normaliza a guion bajo al persistir (`controllers/syncWooOrdersController.js:48-62`). Mantener esa normalización.
- ⚠️ `routes/orderRoutes.js` y `routes/syncWooOrdersRoutes.js` **no aplican middleware de auth** hoy. Los endpoints de esta solicitud **sí deben llevar `verifyToken`** — es un proceso contable. Se recomienda además revisar la exposición de los existentes.
- El backend mezcla ESM y CommonJS (`createRequire` en `index.js`); seguir el patrón de los módulos vecinos y registrar las rutas nuevas en `index.js:68-115`.
- Queries parametrizadas siempre (`request.input(...)`), nunca concatenación de strings SQL.
- Nota operativa: `scripts/db-query.js` falla con Node 25 (`buffer-equal-constant-time` usa `SlowBuffer`, removido). Ejecutar con Node 20.

## Criterios de aceptación backend

- [ ] Tablas `cierre_mes` y `cierre_mes_detalle` creadas con el índice único filtrado `UX_cierre_mes_periodo`
- [ ] Los 9 endpoints responden con el esquema indicado
- [ ] Auth vía `x-access-token` aplicado en **todos** los endpoints nuevos
- [ ] `GET /api/cierre-mes/validar` rechaza correctamente cierre duplicado y mes en curso/futuro
- [ ] `POST /api/cierre-mes` revalida las reglas en servidor y responde 409 ante concurrencia
- [ ] Facturación en bloque: una transacción por cotización, fallo individual no aborta el bloque, devuelve el `fac_nro` generado
- [ ] Facturación en bloque estampa `fac_nro_origen` en la COT apuntando a la VTA generada
- [ ] Actualización masiva propaga el estado a WooCommerce (comportamiento estándar de Woo, incluidas sus notificaciones)
- [ ] Anulación en bloque exige observación de mínimo 10 caracteres
- [ ] Cabecera y detalle se escriben en una sola transacción y sus totales cuadran
- [ ] Los porcentajes de comisión se leen de `dbo.parametros` y se congelan en la cabecera del cierre
- [ ] `GET /api/dashboard/ventas/ordenes-canal` ya no tiene los literales `0.05`/`0.025`/`5.0`/`2.5`
- [ ] Anular un cierre libera el período para un nuevo cierre
- [ ] Módulo `cierre_mes` insertado en `dbo.Modulos` con acciones `view`/`create`/`edit`/`delete`
- [ ] Queries parametrizadas, sin concatenación de strings SQL
