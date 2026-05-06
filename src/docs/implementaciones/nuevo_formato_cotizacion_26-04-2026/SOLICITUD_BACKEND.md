# SOLICITUD BACKEND — Nuevo Formato Cotización

**Fecha:** 26/04/2026  
**Solicitado por:** Frontend (POS Pretty)  
**Motivo:** Soportar nuevo hook `usePrintCotizacion` que genera PDF profesional de cotizaciones

---

## Cambio 1 — Agregar `fac_obs` al response de `GET /api/order/:fac_nro`

### Problema

La función `getOrder` en `models/orderModel.js` (línea ~588) no incluye `f.fac_obs` en el SELECT del header. El nuevo formato de impresión necesita mostrar las observaciones del pedido en la sección "OBSERVACIONES" del PDF.

### Cambio requerido

**Archivo:** `models/orderModel.js`  
**Función:** `getOrder`  
**Línea aproximada:** 590 (SELECT del headerQuery)

Agregar `f.fac_obs` al SELECT:

```sql
SELECT 
  f.fac_sec,
  f.fac_fec,
  f.fac_tip_cod,
  f.nit_sec,
  n.nit_ide,
  n.nit_nom,
  n.nit_dir,
  n.nit_tel,
  n.nit_email,
  f.fac_nro,
  f.fac_nro_woo,
  f.fac_est_fac,
  f.fac_descuento_general,
  f.fac_total_woo,
  f.fac_obs,          -- ← AGREGAR ESTA LÍNEA
  c.ciu_nom
FROM dbo.factura f  
LEFT JOIN dbo.nit n ON n.nit_sec = f.nit_sec
LEFT JOIN dbo.Ciudad c ON c.ciu_cod = n.ciu_cod
WHERE f.fac_nro = @fac_nro;
```

### Impacto
- Sin riesgo: es solo agregar un campo al SELECT
- No rompe consumidores actuales (los campos existentes no cambian)
- `fac_obs` puede ser NULL — el frontend lo maneja con fallback a cadena vacía

---

## Cambio 2 — Nuevo endpoint para datos de pago de cotizaciones

### Problema

Los datos bancarios (Bancolombia, Nequi, Daviplata) que aparecen al pie de la cotización deben ser configurables desde BD, no hardcodeados en el frontend. Se propone almacenarlos en la tabla `dbo.parametros` existente.

### Datos a almacenar

Se propone un único parámetro con código `datos_pago_cotizacion` cuyo valor es un JSON:

```json
{
  "bancolombia": {
    "tipo": "Ahorros",
    "numero": "123 45678901",
    "titular": "Eder Álvarez · CC 1.098.747.037"
  },
  "nequi": {
    "numero": "321 420 7398",
    "instruccion": "Confirma el pago enviando el comprobante"
  },
  "daviplata": {
    "numero": "321 420 7398",
    "instruccion": "Pago contra entrega disponible en Bucaramanga"
  }
}
```

### Script SQL de inserción inicial

```sql
INSERT INTO dbo.parametros (par_cod, par_value)
VALUES (
  'datos_pago_cotizacion',
  '{"bancolombia":{"tipo":"Ahorros","numero":"123 45678901","titular":"Eder Álvarez · CC 1.098.747.037"},"nequi":{"numero":"321 420 7398","instruccion":"Confirma el pago enviando el comprobante"},"daviplata":{"numero":"321 420 7398","instruccion":"Pago contra entrega disponible en Bucaramanga"}}'
);
```

> Ajustar los valores reales (número de cuenta Bancolombia, titular, etc.) antes de ejecutar.

### Endpoint requerido

```
GET /api/parametros/datos-pago-cotizacion
```

**Auth:** Sí (`x-access-token`)  
**Response esperado:**

```json
{
  "success": true,
  "data": {
    "bancolombia": {
      "tipo": "Ahorros",
      "numero": "123 45678901",
      "titular": "Eder Álvarez · CC 1.098.747.037"
    },
    "nequi": {
      "numero": "321 420 7398",
      "instruccion": "Confirma el pago enviando el comprobante"
    },
    "daviplata": {
      "numero": "321 420 7398",
      "instruccion": "Pago contra entrega disponible en Bucaramanga"
    }
  }
}
```

### Implementación sugerida

**`models/parametrosModel.js`** — agregar función:

```js
const getDatosPagoCotizacion = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('par_cod', sql.VarChar(50), 'datos_pago_cotizacion')
            .query("SELECT par_value FROM dbo.parametros WHERE par_cod = @par_cod");
        
        if (result.recordset.length === 0) {
            throw new Error('Parámetro datos_pago_cotizacion no encontrado');
        }
        
        return JSON.parse(result.recordset[0].par_value);
    } catch (error) {
        throw error;
    }
};
```

**`controllers/parametrosController.js`** — agregar handler:

```js
const getDatosPagoCotizacion = async (req, res) => {
    try {
        const data = await parametrosModel.getDatosPagoCotizacion();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
```

**`routes/parametrosRoutes.js`** — agregar ruta:

```js
router.get('/datos-pago-cotizacion', authMiddleware, parametrosController.getDatosPagoCotizacion);
```

### Impacto
- No modifica lógica existente — solo agrega función/ruta nueva
- El parámetro es editable vía el endpoint `PUT /api/parametros/:par_cod` ya existente
- Si en el futuro se necesitan datos de pago distintos por sucursal o tipo de cliente, se puede extender el JSON sin cambiar el contrato

---

## Resumen de cambios

| # | Tipo | Archivo | Cambio | Riesgo |
|---|------|---------|--------|--------|
| 1 | Modificación | `models/orderModel.js` | Agregar `f.fac_obs` al SELECT de `getOrder` | Ninguno |
| 2 | Nuevo | `models/parametrosModel.js` | Función `getDatosPagoCotizacion` | Ninguno |
| 2 | Nuevo | `controllers/parametrosController.js` | Handler `getDatosPagoCotizacion` | Ninguno |
| 2 | Nuevo | `routes/parametrosRoutes.js` | `GET /datos-pago-cotizacion` | Ninguno |
| 2 | Script SQL | `dbo.parametros` | INSERT registro `datos_pago_cotizacion` | Ninguno |
