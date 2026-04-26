# SPEC: Cotizar Artículos Sin Saldo en POS

## Metadata
- **Tipo:** FEATURE
- **Fecha:** 26/04/2026
- **Prioridad estimada:** Alta
- **Complejidad estimada:** Baja
- **Requiere migración BD:** No
- **Impacta WooCommerce sync:** No
- **Estado:** ✅ APROBADO — Gaps resueltos el 26/04/2026

## Resumen Ejecutivo

Actualmente en `/pos`, el sistema bloquea completamente la adición de artículos con existencia <= 0 al pedido (cotización). El negocio necesita poder cotizar (generar pedidos tipo `COT`) con artículos sin stock — útil para cotizaciones que luego se convierten en compra/reabastecimiento — sin que esto afecte el kardex.

La regla de negocio es clara: un **pedido (COT) no afecta el kardex**, por lo que no debe haber bloqueo de stock en ese flujo. Sin embargo, al intentar **facturar (VTA)** un pedido que contiene artículos sin existencia, el sistema **sí debe bloquear** con un mensaje de error claro, ya que una factura sí consume el kardex.

## Estado Actual del Sistema

### Frontend (`/pos` — `src/POS2.jsx` + componentes)

El bloqueo ocurre en 3 puntos:

1. **`src/components/ProductCard.jsx:189`** — Botón "Agregar" deshabilitado con `disabled={product.existencia <= 0}` y clase visual `cursor-not-allowed`.
2. **`src/POS2.jsx:387`** — `addToOrder()` retorna inmediatamente si `product.existencia <= 0`.
3. **`src/POS2.jsx:391`** — Al incrementar cantidad: `if (exists.quantity >= product.existencia) return prev;` impide superar el stock disponible.

No hay validación de stock en `handlePlaceOrder()` (flujo COT) — el bloqueo es solo visual/funcional en el front.

### Backend (`controllers/orderController.js` + `models/orderModel.js`)

- **`createCompleteOrder`** (`orderController.js:66`): Llama a `validarBundles()` antes de crear la orden — esta función valida stock de **bundles** vía `validateBundleStock`. Necesita ajuste para omitir la validación cuando `fac_tip_cod = 'COT'`.
- **`_createCompleteOrderInternal`** (`orderModel.js:694`): Inserta directamente sin consultar existencias de artículos simples — ya OK para COT.
- **`updateOrder`** (`orderModel.js:144`): Tampoco valida stock — ya OK para COT.

### Archivos Relevantes Identificados

| Archivo | Rol | Impacto |
|---------|-----|---------|
| `src/components/ProductCard.jsx` | Tarjeta visual del producto — bloquea el botón "Agregar" | Alto |
| `src/POS2.jsx` | Pantalla POS — función `addToOrder()` y `handleFacturarOrder()` | Alto |
| `src/hooks/useProducts.jsx` | Hook de productos — filtro `tieneExistencia` a la API | Sin cambios |
| `controllers/orderController.js` (backend) | `validarBundles()` bloquea bundles sin stock incluso en COT | Requiere ajuste — ver SOLICITUD_BACKEND.md |

> `src/components/POS.jsx` está **deprecado y fuera de uso** — omitido.

## Requerimientos Funcionales

1. Permitir agregar artículos con `existencia <= 0` al carrito en el flujo COT (sin límite de cantidad).
2. Permitir agregar **bundles** con componentes sin stock al carrito en flujo COT.
3. Al agregar un artículo sin stock, mostrarlo con badge "Sin stock" pero sin bloquear el botón "Agregar".
4. No limitar el incremento de cantidad por existencia en el carrito para flujo COT (9999 unidades es válido).
5. La misma lógica aplica al **editar** un pedido COT existente (`/pos?fac_nro=COT123`).
6. Al intentar **facturar** (`handleFacturarOrder` → VTA), validar en el frontend si hay artículos con `existencia <= 0` y bloquear con mensaje de error descriptivo (nombre + código del artículo).
7. El botón "Agregar" en `ProductCard` debe habilitarse siempre, independientemente del stock.

## Requerimientos No Funcionales

- **UX:** Badge rojo "Sin stock" se mantiene informativo, sin bloquear la acción.
- **Seguridad:** La validación de stock para VTA también debe existir en el backend como segunda línea de defensa — gestionado vía `SOLICITUD_BACKEND.md`.

## Análisis Técnico

### Cambios en BD
**No se requieren cambios de base de datos.**

### Cambios en Frontend

#### 1. `src/components/ProductCard.jsx`

Eliminar `disabled` y el estilo `cursor-not-allowed` condicionado por stock. El badge visual "Sin stock" se conserva.

```jsx
// ANTES
disabled={product.existencia <= 0}
className={`... ${product.existencia <= 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ...}`}

// DESPUÉS — siempre habilitado
// disabled removido (o false)
className={`... ${tieneOferta ? '...' : esBundle ? '...' : 'bg-[#f58ea3] text-white hover:bg-[#f7b3c2]'}`}
```

#### 2. `src/POS2.jsx`

**`addToOrder()` (línea 386-398):**
- Eliminar guard: `if (product.existencia <= 0) return;`
- Eliminar restricción de cantidad: `if (exists.quantity >= product.existencia) return prev;`

**`handleFacturarOrder()` (línea 604):**
Añadir validación antes del payload:

```javascript
const articulosSinStock = order.filter(item => item.existencia <= 0);
if (articulosSinStock.length > 0) {
  const listaArticulos = articulosSinStock
    .map(item => `• ${item.name} (${item.codigo}) — Sin existencia`)
    .join('\n');
  Swal.fire({
    icon: 'error',
    title: 'No se puede generar la factura',
    html: `<p>Los siguientes artículos no tienen existencia:</p><pre style="text-align:left;font-size:12px">${listaArticulos}</pre>`,
    confirmButtonColor: '#f58ea3',
  });
  return;
}
```

### Cambios en Backend

**Flujo COT:** Requiere ajuste en `validarBundles()` para saltarse la validación de stock cuando el tipo de documento es `COT`. Detallado en `SOLICITUD_BACKEND.md`.

**Flujo VTA:** Requiere nueva validación de existencias para artículos simples como segunda línea de defensa. Detallado en `SOLICITUD_BACKEND.md`.

### Principios SOLID Aplicados

- **SRP:** `ProductCard` solo presenta — la lógica de negocio (si se puede cotizar sin stock) vive en `addToOrder()`.
- **OCP:** Se extiende sin romper: el badge informativo "Sin stock" se conserva; solo se elimina el bloqueo de acción.
- **DIP:** `ProductCard` depende de `onAdd` (abstracción inyectada), no de reglas de stock embebidas.

## Plan de Implementación

### Fase 1: Desbloquear adición al carrito (COT)
- [ ] `src/components/ProductCard.jsx`: eliminar `disabled={product.existencia <= 0}` y clase `cursor-not-allowed` por stock
- [ ] `src/POS2.jsx:addToOrder()`: eliminar guard de existencia (línea 387)
- [ ] `src/POS2.jsx:addToOrder()`: eliminar restricción de cantidad máxima (línea 391)

### Fase 2: Bloquear facturación (VTA) con artículos sin stock
- [ ] `src/POS2.jsx:handleFacturarOrder()`: añadir validación de existencia antes del payload
- [ ] Mostrar SweetAlert2 con lista de artículos sin stock

### Dependencia Backend (bloqueante para producción)
- [ ] Esperar ajuste en `validarBundles()` del backend para que COT no bloquee bundles sin stock
- [ ] Esperar nueva validación VTA en backend (segunda línea de defensa)

## Casos de Prueba

### Happy Path
1. **Agregar artículo simple sin stock a COT** — badge "Sin stock" visible, se agrega al carrito
2. **Agregar bundle con componentes sin stock a COT** — se agrega sin error (requiere fix backend)
3. **Cotización con 9999 unidades de artículo en stock 0** — se acepta sin límite
4. **Editar COT existente con artículo sin stock** — permite modificar cantidad libremente
5. **Facturar pedido con todos los artículos con stock** — flujo normal sin bloqueo

### Edge Cases
1. **Mezcla con y sin stock al facturar** — bloquea, muestra solo artículos sin stock en el error
2. **Artículo con existencia negativa** — debe tratarse igual que existencia = 0 (sin stock)

### Error Cases
1. **Facturar con artículos sin stock** — SweetAlert2 con lista, NO se llama a la API

## Gaps Resueltos (26/04/2026)

| # | Duda | Respuesta |
|---|------|-----------|
| 1 | ¿Límite de cantidad en COT? | No hay límite. 9999 unidades es válido. |
| 2 | ¿Aplica a edición de COT? | Sí, misma lógica. |
| 3 | ¿Bundles sin stock pueden cotizarse? | Sí. Requiere ajuste en backend — ver SOLICITUD_BACKEND.md. |
| 4 | ¿Segunda línea de defensa en backend para VTA? | Sí, se solicita formalmente — ver SOLICITUD_BACKEND.md. |
| 5 | ¿`POS.jsx` en uso activo? | No. Omitido. |

## Estimación
- **Frontend (Fases 1+2):** 1-2 horas
- **Testing manual:** 1 hora
- **Total frontend:** ~2 horas
- **Backend:** gestionado por separado vía SOLICITUD_BACKEND.md
