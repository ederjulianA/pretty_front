# SPEC — Fecha de factura respeta fecha de cotización original
> Generado: 2026-07-07 · Modo: bug-fix
> Origen: "al pasar de cotizacion a factura en la pantalla de pos /pos en la factura generada se debe respetar la fecha de la cotizacion, o sea, si se hizo una cotizacion el 30 de junio, y se confirmo el pago y se paso a factura el 1 de Julio, la factura debe quedar con fecha del 30 de junio"

## Reporte original

Al convertir una cotización (COT) en factura (VTA) desde `/pos`, la factura generada toma la fecha del día en que se factura, en lugar de conservar la fecha original de la cotización. Ejemplo: cotización creada el 30-jun, facturada el 01-jul → la factura queda fechada 01-jul cuando debería quedar 30-jun.

## Comportamiento actual

1. **Carga de la cotización para facturar** — [src/POS2.jsx:87-191](../../src/POS2.jsx#L87-L191)
   `useEffect` disparado por `facNroToEdit` hace `GET ${API_URL}/order/${facNroToEdit}`. La respuesta (`orderData.header`) **sí incluye `fac_fec`** (confirmado en `models/orderModel.js:519` del backend), pero `setSelectedClient` (líneas 98-106) solo copia `nit_sec, nit_ide, nit_nom, nit_tel, nit_dir, fac_nro, fac_nro_woo` — **descarta `fac_fec`**. `setOrderType(orderData.header.fac_tip_cod)` (línea 107) sí guarda si es COT o VTA.

2. **Envío de la factura** — `handleFacturarOrder`, [src/POS2.jsx:602-826](../../src/POS2.jsx#L602-L826)
   El `payload` construido en líneas 658-688 no incluye ningún campo de fecha. En la rama de creación (no `isEditing && orderType==="VTA"`, línea 779) se hace `axios.post(${API_URL}/order, payload)`.

3. **Backend — controller** — `controllers/orderController.js:99-125` (repo `api_pretty`)
   `createCompleteOrder(req, res)` destructura `req.body` sin incluir `fac_fec` (línea 101) y llama a `orderModel.createCompleteOrder({...})` (línea 116) sin reenviarlo.

4. **Backend — modelo** — `models/orderModel.js` (repo `api_pretty`)
   `_createCompleteOrderInternal` (línea 695) **sí acepta** el parámetro opcional `fac_fec` (línea 704) y lo usa en el INSERT: `.input('fac_fec', sql.Date, fac_fec || new Date())` (línea 793). Como el controller nunca se lo pasa, siempre cae en el fallback `new Date()`.

## Comportamiento esperado

Al facturar una cotización existente (`orderType === "COT"` cargada vía `facNroToEdit`), la factura resultante debe guardar `fac_fec` = fecha original de la cotización (`orderData.header.fac_fec`), no la fecha del día de facturación.

Las ventas directas desde POS (sin cotización previa) y la edición de facturas VTA ya existentes **no cambian**: siguen usando la fecha de hoy / su fecha ya establecida.

`fac_fch_cre` (timestamp de auditoría de creación del registro, `GETDATE()` fijo en el INSERT) no se modifica — sigue reflejando el momento real de creación de la factura.

## Pasos para reproducir

1. Crear una cotización en `/pos` con fecha de sistema simulada al 30-jun (o usar una cotización ya existente de una fecha pasada).
2. Al día siguiente (o en otra fecha), abrir esa cotización para edición (`facNroToEdit`) y presionar "Facturar".
3. Verificar la fecha (`fac_fec`) del registro de factura creado en `dbo.factura`.
4. **Resultado actual:** `fac_fec` = fecha del paso 2 (hoy). **Resultado esperado:** `fac_fec` = fecha de la cotización original (paso 1).

## Causa raíz hipotética

Doble gap, uno en frontend y uno en backend, ambos necesarios para el fix completo:

- **Frontend:** `fac_fec` de la cotización se recibe del backend pero se descarta al cargar el estado (`setSelectedClient`, POS2.jsx:98-106), y por tanto nunca puede incluirse en el payload de facturación.
- **Backend:** aunque el frontend enviara `fac_fec`, el controller `createCompleteOrder` (orderController.js:101,116) no lo reenvía al modelo — se perdería igual.

El modelo (`orderModel.js`) ya está preparado para recibir `fac_fec`; no requiere cambios.

## Validación BD

`dbo.factura.fac_fec` es la fecha de negocio del documento (tipo `Date` en el INSERT: `sql.Date`). `dbo.factura.fac_fch_cre` es un timestamp de auditoría separado, fijado siempre a `GETDATE()` en el INSERT (orderModel.js:784) — no interviene en este fix y no debe alterarse.

No se requieren cambios de esquema ni migraciones. El bug es puramente de flujo de datos (parámetro no propagado), no de estructura de BD.

## Alcance del fix

**Se toca:**
- Frontend: `src/POS2.jsx`
  - `setSelectedClient` (líneas 98-106): agregar `fac_fec: orderData.header.fac_fec`.
  - `payload` en `handleFacturarOrder` (líneas 658-688): agregar `fac_fec` condicionalmente cuando `orderType === "COT"` (facturando desde una cotización).
- Backend: `controllers/orderController.js`
  - `createCompleteOrder` (líneas 99-125): destructurar `fac_fec` de `req.body` y reenviarlo a `orderModel.createCompleteOrder`.

**NO se toca:**
- `models/orderModel.js` (ya soporta `fac_fec`, no requiere cambios).
- Flujo de venta directa sin cotización (`isEditing === false`).
- Flujo de edición de factura VTA existente (`isEditing && orderType === "VTA"`, PUT `/order/:fac_nro`) — este ya maneja `fac_fec` de forma condicional en `updateOrder` (orderModel.js:145-198) si en algún momento se decide enviarlo, pero no es parte de este fix.
- Impresión (`usePrintCotizacion`), lógica de descuentos, bundles o promociones.

## Riesgos de regresión

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Enviar `fac_fec` en venta directa por error, cambiando su fecha esperada (hoy) | Baja | Medio | Condicionar el envío del campo estrictamente a `isEditing && orderType === "COT"` en el payload; en cualquier otro caso omitir el campo para que el backend use su fallback `new Date()` |
| Backend rompe otros consumidores de `createCompleteOrder` (ej. sync WooCommerce) al aceptar `fac_fec` desde `req.body` | Baja | Bajo | El campo es opcional (`fac_fec || new Date()`); otros callers que no lo envíen mantienen el comportamiento actual sin cambios |
| Cotización cargada sin `fac_fec` (dato nulo/corrupto) | Muy baja | Bajo | Si `orderData.header.fac_fec` es `null`/`undefined`, el payload simplemente no incluye el campo y el backend aplica el fallback a hoy (comportamiento actual, sin romper el flujo) |

## Criterios de aceptación

- [ ] Facturar una cotización (COT) creada en una fecha anterior produce una factura (VTA) con `fac_fec` igual a la fecha original de la cotización.
- [ ] Una venta directa desde POS (sin `facNroToEdit`) sigue generando la factura con `fac_fec` = fecha de hoy.
- [ ] Editar una factura VTA ya existente (no proveniente de una COT en esta operación) no cambia su comportamiento actual de fecha.
- [ ] `fac_fch_cre` de la factura resultante refleja el momento real de creación (no se retrocede).
- [ ] La impresión post-facturación (`printCotizacion(data.fac_nro, 'VTA')`) sigue funcionando sin cambios.

## Estrategia de verificación

Pruebas manuales en `http://localhost:5174/pos` (backend Node en `localhost:3000`):

1. Identificar o crear una cotización con fecha pasada conocida (verificar con `SELECT fac_fec FROM dbo.factura WHERE fac_nro = 'xxx'` vía `node scripts/db-query.js` en `api_pretty`, solo lectura).
2. Abrir esa cotización en `/pos` (flujo de edición) y presionar "Facturar".
3. Confirmar en el modal de éxito el número de factura generado.
4. Consultar `dbo.factura` para esa factura y verificar `fac_fec` = fecha de la cotización original, y `fac_fch_cre` = fecha/hora actual de la prueba.
5. Repetir con una venta directa (sin cotización previa) y verificar que `fac_fec` = fecha de hoy (sin regresión).
6. Repetir editando una factura VTA existente (no vía cotización) y verificar que no cambia su comportamiento previo.

## Asunciones finales (confirmadas)

| # | Asunción | Decisión |
|---|----------|----------|
| 1 | Qué fecha se preserva | Se preserva `fac_fec` (fecha de negocio) de la cotización; `fac_fch_cre` (auditoría) sigue siendo el momento real de facturación |
| 2 | Alcance del disparador | Solo aplica cuando se factura desde una cotización existente (`orderType === "COT"` en modo edición) |
| 3 | Pedidos WooCommerce | Reciben el mismo trato: si son COT, se preserva su fecha igual que cualquier cotización |
| 4 | Sin cambio de UI | Fix transparente, sin control de fecha editable en el POS |
| 5 | Cotización sin `fac_fec` | Fallback a fecha de hoy (comportamiento actual), sin bloquear la facturación |
| 6 | Alcance de la corrección | Incluye tanto el fix de frontend como el gap de backend (controller), ya que uno sin el otro no resuelve el bug |

## Validación técnica

### Endpoints consultados

| Método | Ruta | Archivo backend | Estado |
|--------|------|----------------|--------|
| POST | /api/order | controllers/orderController.js (createCompleteOrder, líneas 99-125) | ⚠️ Existe pero incompleto — no reenvía `fac_fec` |
| GET | /api/order/:fac_nro | models/orderModel.js (getOrder, línea ~500+) | ✅ Ya retorna `fac_fec` en el header |

### BD consultada

| Tabla | Hallazgo relevante |
|-------|--------------------|
| dbo.factura | `fac_fec` (tipo Date, fecha de negocio) y `fac_fch_cre` (timestamp de auditoría, `GETDATE()` fijo) son campos distintos; el fix solo afecta `fac_fec` |

## Fuera de alcance / preguntas pendientes

- No se contempla permitir edición manual de la fecha de factura desde la UI del POS.
- No se modifica el flujo de `updateOrder` (edición de factura VTA ya existente) más allá de lo ya soportado.

## Próximos pasos sugeridos

- [ ] Resolver el gap de backend descrito en `SOLICITUD_BACKEND.md`
- [ ] Confirmar que no hay otros consumidores de cotizaciones (ej. sync WooCommerce) que dependan de que la factura siempre tome la fecha del día
- [ ] Ejecutar `/impl-builder` una vez aprobado este SPEC
