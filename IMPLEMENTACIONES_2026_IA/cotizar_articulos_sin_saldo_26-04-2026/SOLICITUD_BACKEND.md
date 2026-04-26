# SOLICITUD BACKEND: Cotizar Artículos Sin Saldo

**Fecha:** 26/04/2026  
**Origen:** Feature "Cotizar Artículos Sin Saldo" — SPEC.md de este mismo directorio  
**Prioridad:** Alta  
**Archivos backend afectados:** `controllers/orderController.js`, `models/orderModel.js`

---

## Contexto

El frontend del POS se está modificando para permitir agregar artículos sin stock a pedidos tipo `COT` (cotizaciones). Los pedidos COT no afectan el kardex, por lo que no debe haber restricción de existencia en ese flujo.

Se identificaron **dos ajustes necesarios en el backend**:

---

## Solicitud 1 — Omitir validación de stock en bundles para pedidos COT

### Problema actual

En `controllers/orderController.js`, la función `validarBundles()` (línea ~11) valida el stock de bundles vía `bundleModel.validateBundleStock()` antes de crear cualquier orden, **sin distinguir el tipo de documento**.

```javascript
// orderController.js — createCompleteOrder
await validarBundles(detalles); // Se ejecuta para COT y VTA por igual
```

Esto provoca que aunque el frontend permita cotizar un bundle sin stock, el backend lo rechace con error `"Stock insuficiente para el bundle..."`.

### Cambio solicitado

Modificar `validarBundles()` (o su invocación) para que **solo valide stock cuando `fac_tip_cod !== 'COT'`**.

```javascript
// Propuesta de cambio en createCompleteOrder
if (fac_tip_cod !== 'COT') {
  await validarBundles(detalles);
}
```

Alternativamente, pasar `fac_tip_cod` a `validarBundles()` y controlar internamente:

```javascript
const validarBundles = async (detalles, fac_tip_cod) => {
  if (fac_tip_cod === 'COT') return; // Cotizaciones no validan stock
  // ... lógica existente
};
```

### Impacto
- Solo afecta el flujo de creación de órdenes.
- Las ventas (`VTA`) siguen validando stock de bundles como hoy.
- No requiere cambio de BD.

---

## Solicitud 2 — Validar existencias en backend para flujo VTA (segunda línea de defensa)

### Problema actual

El frontend valida existencias antes de facturar (`handleFacturarOrder`), pero no existe ninguna validación en el backend para `fac_tip_cod = 'VTA'`. Si por alguna razón la validación del frontend se bypasea (llamada directa a la API, error de estado del frontend), se generaría una factura de venta con artículos sin stock, descuadrando el kardex.

### Cambio solicitado

Agregar en `controllers/orderController.js` una función `validarExistenciasVTA()` que consulte `dbo.vwExistencias` y rechace la creación/actualización de una VTA si algún artículo tiene existencia <= 0.

**Propuesta de implementación:**

```javascript
// controllers/orderController.js

const validarExistenciasVTA = async (detalles) => {
  if (!detalles?.length) return;
  const pool = await poolPromise;

  const artSecs = [...new Set(
    detalles
      .filter(d => !d.kar_bundle_padre) // Solo artículos padre (no componentes)
      .map(d => d.art_sec)
      .filter(Boolean)
  )];
  if (!artSecs.length) return;

  const request = pool.request();
  artSecs.forEach((sec, i) => request.input(`p${i}`, sql.VarChar(30), sec));

  const result = await request.query(`
    SELECT a.art_sec, a.art_cod, a.art_nom, ISNULL(e.existencia, 0) AS existencia
    FROM dbo.articulos a
    LEFT JOIN dbo.vwExistencias e ON a.art_sec = e.art_sec
    WHERE a.art_sec IN (${artSecs.map((_, i) => `@p${i}`).join(',')})
      AND ISNULL(e.existencia, 0) <= 0
  `);

  if (result.recordset.length > 0) {
    const lista = result.recordset
      .map(r => `${r.art_nom} (${r.art_cod})`)
      .join(', ');
    throw new Error(
      `No se puede generar la factura. Los siguientes artículos no tienen existencia: ${lista}`
    );
  }
};
```

**Invocación en `createCompleteOrder` y `updateOrderEndpoint`:**

```javascript
// En createCompleteOrder (orderController.js:66)
if (fac_tip_cod === 'VTA') {
  await validarExistenciasVTA(detalles);
}

// En updateOrderEndpoint (orderController.js:45) — para cuando se edita y convierte a VTA
if (fac_tip_cod === 'VTA') {
  await validarExistenciasVTA(detalles);
}
```

### Comportamiento esperado

| Escenario | Respuesta esperada |
|-----------|-------------------|
| VTA con todos los artículos con stock > 0 | Continúa normalmente |
| VTA con al menos un artículo con existencia <= 0 | HTTP 400 con mensaje: `"No se puede generar la factura. Los siguientes artículos no tienen existencia: ..."` |
| COT con artículos sin stock | No valida — pasa directo |

### Notas de implementación
- Usar `dbo.vwExistencias` (vista ya existente en el proyecto) — no calcular existencia manualmente.
- Los componentes de bundle (`kar_bundle_padre != null`) deben excluirse de la validación individual — su existencia se valida a nivel del bundle padre.
- El error debe retornar HTTP 400 (Bad Request), no 500, para que el frontend pueda mostrarlo correctamente.
- Queries siempre parametrizadas — no interpolación de strings.

---

## Resumen de cambios solicitados

| # | Archivo | Función | Cambio |
|---|---------|---------|--------|
| 1 | `controllers/orderController.js` | `validarBundles()` / `createCompleteOrder` | Omitir validación de stock de bundles cuando `fac_tip_cod = 'COT'` |
| 2 | `controllers/orderController.js` | Nueva `validarExistenciasVTA()` | Validar existencias de artículos simples antes de crear/actualizar una VTA |
| 2 | `controllers/orderController.js` | `createCompleteOrder` y `updateOrderEndpoint` | Invocar `validarExistenciasVTA()` cuando `fac_tip_cod = 'VTA'` |

**No se requieren cambios en `models/orderModel.js` ni en la base de datos.**
