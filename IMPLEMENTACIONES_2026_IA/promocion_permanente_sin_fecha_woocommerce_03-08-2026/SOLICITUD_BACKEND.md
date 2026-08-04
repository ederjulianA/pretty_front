---
slug: promocion-permanente-sin-fecha-woocommerce
origen: SPEC.md del frontend POS Pretty
fecha: 2026-08-03
estado: pendiente
---

# Solicitud Formal al Backend: Promoción permanente sin fecha de cierre

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.

## Contexto

La pantalla `/promociones` (creación y edición de promociones, `PromocionNew.jsx`) necesita permitir marcar una promoción como "permanente" — sin fecha de cierre real — para que la sincronización hacia WooCommerce no envíe `date_on_sale_to`, evitando que la tienda muestre un contador de cuenta regresiva falso en productos de liquidación (ej. "Mercadillo Virtual") que no tienen fecha de cierre real.

Hoy esto es imposible: la columna `pro_fecha_fin` en `dbo.promociones` es `datetime NOT NULL` (confirmado contra BD real), y no existe ningún campo `permanente` en el modelo, controller, ni tabla.

Ya existen 55 productos en producción con este problema (categoría "Mercadillo Virtual") — su promoción tiene una fecha de fin puesta a futuro lejano solo para poder guardarla. El dato en WooCommerce ya se corrigió como parche temporal, pero el origen (ERP) sigue mal y el problema reaparecerá la próxima vez que alguien edite esa promoción.

## Solicitudes

### [SOLICITUD-1] Permitir promociones sin fecha de cierre en el esquema

- **Tipo:** Modificación de esquema de BD
- **Tabla:** `dbo.promociones`
- **Problema / Necesidad:** `pro_fecha_fin` es `datetime NOT NULL`. Se necesita poder guardar una promoción sin fecha de fin cuando es "permanente".
- **Opciones a evaluar por backend** (decisión del equipo backend, el frontend es indiferente al mecanismo mientras el contrato de API sea consistente):
  - A) Relajar `pro_fecha_fin` a `NULL`-able y usar `NULL` para promociones permanentes.
  - B) Mantener `NOT NULL` y usar una fecha centinela (ej. `9999-12-31`) — en este caso, el backend debe garantizar que esa fecha centinela **nunca** se envíe a WooCommerce como `date_on_sale_to` cuando `permanente = true`.
- **Importante:** antes de relajar el constraint (opción A), revisar todos los usos de `pro_fecha_fin` en el código (`grep -rn "pro_fecha_fin" .`) — reportes, jobs, u otras queries podrían asumir NOT NULL.
- **Impacto si no se resuelve:** el resto de las solicitudes no pueden implementarse; el frontend queda bloqueado indefinidamente.

### [SOLICITUD-2] Nuevo campo `permanente` en modelo/controller de promociones

- **Tipo:** Nuevo campo + modificación de endpoints existentes
- **Endpoints:** `POST /api/promociones`, `PUT /api/promociones/:pro_sec`, `GET /api/promociones/:pro_sec`, `GET /api/promociones` (listado, si retorna el detalle completo)
- **Archivos backend actuales:**
  - `controllers/promocionController.js:5-31` (delgado, pasa `req.body` a `promocionModel`)
  - `models/promocionModel.js:17-47` (crear — agregar manejo del campo)
  - Función de actualizar en `promocionModel.js` (mismo tratamiento)
- **Problema / Necesidad:** no existe ningún campo `permanente`/`es_permanente` hoy — confirmado con grep sin resultados en `promocionModel.js` completo.
- **Request esperado (crear/editar):**
  ```json
  {
    "codigo": "string",
    "descripcion": "string",
    "fecha_inicio": "2026-08-01T00:00:00.000Z",
    "fecha_fin": null,
    "permanente": true,
    "tipo": "OFERTA",
    "observaciones": "string",
    "articulos": [ "... sin cambios ..." ]
  }
  ```
  Cuando `permanente: true`, `fecha_fin` puede venir `null` o ausente — el backend no debe rechazar la request por falta de `fecha_fin` en ese caso. Cuando `permanente: false` (o ausente, para compatibilidad con promociones existentes), el comportamiento de validación debe seguir exactamente igual al actual (fecha_fin requerida).
- **Response 200 esperado (GET detalle, para precargar el form de edición):**
  ```json
  {
    "pro_sec": "123",
    "pro_codigo": "PROMO01",
    "pro_fecha_inicio": "2026-08-01T00:00:00.000Z",
    "pro_fecha_fin": null,
    "pro_permanente": true,
    "...": "resto de campos sin cambios"
  }
  ```
  **Confirmar con frontend el tipo exacto** (`boolean` vs `char 'S'/'N'`, siguiendo el patrón de `pro_activa` que ya es `char(1)`) antes de considerar esta solicitud cerrada — el frontend debe mapear el mismo formato que el backend implemente.
- **Errores esperados:** 400 si `permanente=false` y falta `fecha_fin` (validación actual sin cambios).
- **Impacto si no se resuelve:** el checkbox del frontend no tiene dónde persistir su valor; la funcionalidad completa queda bloqueada.

### [SOLICITUD-3] Rama "permanente" en la sincronización a WooCommerce

- **Tipo:** Modificación de lógica existente (no endpoint nuevo)
- **Archivos backend actuales:**
  - `jobs/updateWooProductPrices.js:318-364` (productos simples, batch)
  - `models/promocionModel.js:856-898` (variaciones, actualización individual vía `PUT products/{parent}/variations/{id}`)
- **Problema / Necesidad:** ambos bloques hoy solo manejan dos casos: (a) `tiene_oferta && fechaInicio && fechaFin` → setea `date_on_sale_from`/`date_on_sale_to` con las fechas reales, o (b) sin oferta → limpia todo con `sale_price=''`, `date_on_sale_from=''`, `date_on_sale_to=''`. No existe el caso "oferta activa, pero sin fecha de fin (permanente)".
- **Comportamiento requerido:** cuando la promoción del artículo/variación tiene `permanente = true` y el artículo está activo en la promoción:
  - Enviar `date_on_sale_from` normal (con `fecha_inicio` real).
  - Enviar `date_on_sale_to = ''` **explícitamente** (no omitir la key) — esto es crítico para el caso donde el producto ya tenía una fecha vieja en WooCommerce de una promoción anterior; omitir la key deja el valor viejo intacto en WooCommerce (WooCommerce interpreta ausencia de campo como "no tocar"), mientras que el código actual ya prueba que `''` sí limpia el valor (ver rama "sin oferta" en `updateWooProductPrices.js:356-357`, patrón ya validado en producción).
  - `sale_price` y el resto del payload se arman exactamente igual que hoy (sin cambios).
- **Request esperado (ejemplo del payload interno hacia WooCommerce, `wooData`):**
  ```json
  {
    "id": 12345,
    "regular_price": "50000",
    "sale_price": "35000",
    "date_on_sale_from": "2026-08-01T00:00:00",
    "date_on_sale_to": "",
    "meta_data": [ "..." ]
  }
  ```
- **Origen del flag `permanente` en este contexto:** el job/modelo necesita recibir `permanente` (o `pro_permanente`) como parte de `opciones.fechasPromocion` (línea 333 de `updateWooProductPrices.js`) o de `articleData` (línea 337-340), y de `fechasPromocion` en `promocionModel.js:876`. Ajustar la fuente de datos (query SQL que arma `fechasPromocion`/`articleData`) para incluir el nuevo campo `pro_permanente`.
- **Errores esperados:** ninguno nuevo — mismo manejo de error que hoy (catch por producto/variación, no aborta el batch completo).
- **Impacto si no se resuelve:** el checkbox se puede guardar en BD, pero la sincronización real a WooCommerce seguirá enviando (u omitiendo sin limpiar) `date_on_sale_to`, y el contador de cuenta regresiva seguirá apareciendo — el requerimiento de negocio no se cumple aunque el campo exista en BD.

## Notas para el Backend

- `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- Fechas como string `'YYYY-MM-DD'` o ISO — cuidado con el bug de timezone conocido del driver mssql en este proyecto.
- El patrón `date_on_sale_to = ''` para limpiar en WooCommerce ya está probado en producción (rama "sin oferta") — reutilizar el mismo mecanismo, no inventar uno nuevo.
- Revisar ambos puntos de sincronización (`updateWooProductPrices.js` para simples, `promocionModel.js` para variaciones) — deben quedar simétricos, como ya lo están hoy para el resto de la lógica de fechas.
- Una vez implementado, la promoción "Mercadillo Virtual" existente en producción debe marcarse manualmente como `permanente = true` desde la UI (una vez el frontend esté implementado) y re-sincronizarse — no requiere script de backend, es una acción manual post-deploy.

## Criterios de aceptación backend

- [ ] `POST`/`PUT /api/promociones` aceptan y persisten `permanente` sin exigir `fecha_fin` cuando es `true`
- [ ] `GET /api/promociones/:pro_sec` retorna el nuevo campo con tipo confirmado con frontend
- [ ] Esquema de `dbo.promociones` permite guardar sin fecha de fin real (NULL o centinela documentado)
- [ ] Sincronización a WooCommerce (simples y variaciones) respeta `permanente`: envía `date_on_sale_from` real y `date_on_sale_to=''` explícito
- [ ] Validado manualmente en staging: un producto de prueba con fecha vieja en WooCommerce, al sincronizarse con `permanente=true`, queda sin contador de cuenta regresiva
- [ ] Compatibilidad retroactiva: promociones existentes sin el campo `permanente` (o con `false`) siguen funcionando exactamente igual que hoy
- [ ] Queries parametrizadas (nunca concatenación de strings SQL)
