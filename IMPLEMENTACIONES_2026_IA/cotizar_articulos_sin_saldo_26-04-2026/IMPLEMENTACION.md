# Implementación: Cotizar Artículos Sin Saldo en POS

**Fecha de implementación:** 26/04/2026
**Estado:** Completado (frontend) — Backend pendiente según SOLICITUD_BACKEND.md

## Archivos Modificados

- `src/components/ProductCard.jsx`
  - Eliminado guard `if (product.existencia <= 0) return;` en `handleClick()`
  - Eliminado `disabled={product.existencia <= 0}` del botón "Agregar"
  - Eliminada clase condicional `bg-gray-200 text-gray-400 cursor-not-allowed` por stock cero
  - El badge visual "Sin stock" / "N en stock" se conserva sin cambios

- `src/POS2.jsx`
  - `addToOrder()`: eliminado guard de existencia `if (product.existencia <= 0) return;`
  - `addToOrder()`: eliminada restricción de cantidad `if (exists.quantity >= product.existencia) return prev;`
  - `handleFacturarOrder()`: añadida validación previa al payload — si hay artículos con `existencia <= 0`, muestra SweetAlert2 con lista y retorna sin llamar a la API

## Desviaciones del SPEC

- Ninguna. Se implementó exactamente lo especificado.
- Nota: se usó `(item.existencia ?? 0) <= 0` en lugar de `item.existencia <= 0` para cubrir el edge case de existencia `null`/`undefined` (artículos cargados al editar un COT donde `existencia` podría no venir del backend).

## Pruebas Manuales Recomendadas

1. **Artículo simple sin stock → COT**
   - Buscar un artículo con badge "Sin stock" en `/pos`
   - Clic en "Agregar" → debe añadirse al carrito normalmente
   - Incrementar cantidad varias veces → no debe haber límite

2. **Cotización con artículo sin stock → guardar pedido**
   - Con artículo sin stock en carrito, seleccionar cliente
   - Clic en "Realizar Pedido" → debe crear la COT sin error
   - Verificar que el pedido aparece en `/orders`

3. **Intentar facturar con artículo sin stock**
   - Con artículo sin stock en carrito, clic en "Facturar"
   - Debe aparecer SweetAlert2: "No se puede generar la factura" con el nombre y código del artículo
   - NO debe ejecutarse ninguna llamada a la API

4. **Mezcla: artículos con y sin stock al facturar**
   - Carrito con artículo A (con stock) + artículo B (sin stock)
   - Clic en "Facturar" → error muestra solo artículo B

5. **Editar COT existente con artículo sin stock**
   - Abrir `/pos?fac_nro=COT123` con un COT que tenga artículo sin stock
   - Debe cargar normalmente y permitir modificar cantidades sin límite

6. **Artículo con existencia negativa**
   - Debe tratarse como sin stock (bloquea facturación, no bloquea cotización)

## Pendiente — Backend (SOLICITUD_BACKEND.md)

Los siguientes cambios están fuera del alcance del frontend y documentados en `SOLICITUD_BACKEND.md`:

1. **`validarBundles()` en `orderController.js`** — Actualmente bloquea bundles sin stock incluso para COT. Hasta que esto se resuelva, los bundles sin stock seguirán sin poder cotizarse.
2. **`validarExistenciasVTA()`** — Segunda línea de defensa para VTA en el backend. Hasta que esto se implemente, la validación de stock antes de facturar existe solo en el frontend.
