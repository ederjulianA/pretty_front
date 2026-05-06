# SPEC: Nuevo Formato de Impresión de Cotizaciones (Carta)

## Metadata
- **Tipo:** FEATURE
- **Fecha:** 26/04/2026
- **Prioridad estimada:** Alta
- **Complejidad estimada:** Media
- **Requiere migración BD:** No
- **Impacta WooCommerce sync:** No

## Resumen Ejecutivo

Se requiere crear un nuevo hook de impresión `usePrintCotizacion` que genere un PDF profesional en tamaño carta (216×279 mm) para cotizaciones de venta, con diseño acorde a la imagen de marca PrettyMakeup COL. El formato actual (`usePrintOrder`) NO debe modificarse; este nuevo hook coexiste con él y reemplaza únicamente la impresión cuando el documento es de tipo `COT`.

El objetivo estratégico es profesionalizar y estandarizar los comprobantes emitidos desde la aplicación, sirviendo como plantilla base reutilizable para futuros formatos (compras, ajustes de inventario, etc.), alineados con la normativa colombiana y la imagen de marca.

## Estado Actual del Sistema

El sistema usa `usePrintOrder` ([src/hooks/usePrintOrder.jsx](src/hooks/usePrintOrder.jsx)) para imprimir cotizaciones. Este hook genera un PDF en tamaño A4 sin manejo de múltiples páginas: la tabla de productos crece indefinidamente y puede pisar el pie de página, o el pie de página no aparece en páginas secundarias. No incluye vigencia, datos de pago, ni totales en palabras.

El hook actual se llama desde `POS2.jsx` en tres puntos:
- Después de crear cotización (línea ~520)
- Después de crear factura (línea ~568)
- Después de editar cotización (línea ~750 y ~798)

La API expone el endpoint `GET /api/order/:fac_nro` que retorna `{ header, details }`:

**Header disponible:** `fac_sec`, `fac_fec`, `fac_tip_cod`, `nit_ide`, `nit_nom`, `nit_dir`, `nit_tel`, `nit_email`, `fac_nro`, `fac_est_fac`, `fac_descuento_general`, `ciu_nom`, `total_detalles`, `descuento_general`, `total_final`

**Detalle disponible por línea:** `art_cod`, `art_nom`, `kar_uni`, `kar_pre_pub`, `kar_des_uno`, `kar_total`, `es_componente_bundle`, `kar_bundle_padre`, `art_bundle`, `kar_descripcion_promocion`, `fac_obs` (en header)

### Archivos Relevantes Identificados

| Archivo | Rol | Impacto |
|---------|-----|---------|
| [src/hooks/usePrintOrder.jsx](src/hooks/usePrintOrder.jsx) | Hook actual de impresión | Bajo — no se modifica |
| [src/POS2.jsx](src/POS2.jsx) | Llama `printOrder` al guardar COT | Alto — cambiar llamada a nuevo hook cuando es COT |
| [src/assets/prettyLogo1.png](src/assets/prettyLogo1.png) | Logo para PDF | Reutilizar |
| [src/utils/dateUtils.js](src/utils/dateUtils.js) | `formatDate` para fechas | Reutilizar |
| [src/utils/index.js](src/utils/index.js) | `formatValue`, `formatName` | Reutilizar |

## Requerimientos Funcionales

### RF-01 — Tamaño carta y márgenes
El documento debe usar `jsPDF` con formato `'letter'` (215.9×279.4 mm). Márgenes: 20 mm izquierda/derecha, 15 mm superior/inferior.

### RF-02 — Header en todas las páginas
Cada página debe incluir:
- Logo PrettyMakeup (izquierda, ~45×20 mm)
- Nombre empresa + datos fiscales (NIT, dirección, teléfono) en texto pequeño bajo el logo
- Título "Cotización de venta" en tipografía cursiva/italic grande (derecha)
- Número `COT-XXXX`, Fecha, Válida hasta (derecha, debajo del título)
- Línea divisoria horizontal rosada al final del header

### RF-03 — Sección Cliente (solo primera página)
Bloque con fondo gris muy claro conteniendo:
- Etiqueta "CLIENTE" en gris pequeño
- Razón social, Identificación, Teléfono, Ciudad en columnas
- Dirección en línea separada

### RF-04 — Tabla de productos con control de paginación
- Columnas: Código | Artículo | Cant. | Vlr. Unit. | % Dto. | Total
- Líneas de componente de bundle: precio "—", total en cursiva "Obsequio", badge/tag "CORTESÍA" en rosado bajo el nombre del artículo
- **Control de límite de página:** antes de dibujar cada fila, verificar si la posición Y actual + altura de fila supera el `pageHeight - footerHeight - marginBottom`. Si supera → `doc.addPage()` → redibujar header → continuar tabla en la nueva página
- El header de la tabla (fila de encabezados: Código, Artículo…) se repite en cada página nueva

### RF-05 — Sección de totales y observaciones (última página)
Debe aparecer al final de la tabla de productos, en la última página:
- Bloque izquierdo: "OBSERVACIONES" con texto de vigencia estándar + texto `fac_obs` si existe + nota de artículos cortesía si aplica
- Bloque derecho: Subtotal | Descuento | IVA (No aplica) | **Total a pagar** (grande)
- Línea en palabras: "Trescientos... pesos m/cte." (número en letras)

### RF-06 — Sección Datos para pago (última página)
Bloque con fondo gris claro con 3 columnas:
- Bancolombia · Ahorros · Número de cuenta
- Nequi · Número
- Daviplata · Número + instrucción

### RF-07 — Footer en todas las páginas
Línea divisoria + texto centrado o izquierda con:
- `PrettyMakeup COL · Bucaramanga, Santander`
- `@prettymakeup.col · WhatsApp 321 420 7398 · prettymakeup.col@gmail.com`
- `Documento de carácter informativo · No equivale a factura de venta · Generado por software administrativo MiPunto`

### RF-08 — Vigencia automática
La fecha "Válida hasta" se calcula sumando 14 días calendario a `fac_fec`.

### RF-09 — Integración en POS2
Cuando `fac_tip_cod === 'COT'` y el usuario hace clic en "Imprimir PDF", llamar al nuevo `usePrintCotizacion` en lugar de `usePrintOrder`.

### RF-10 — Nombre del archivo PDF
`cotizacion_prettymakeup_{fac_nro}_{dd}_{mm}_{yyyy}.pdf`

## Requerimientos No Funcionales

- **Performance:** PDF generado en < 3 segundos para cotizaciones de hasta 50 líneas
- **Seguridad:** Reutilizar token `x-access-token` como lo hace el hook actual
- **Fonts:** Usar fuentes estándar de jsPDF (`helvetica`). El título "Cotización de venta" en `italic` para efecto caligráfico
- **Reutilizabilidad:** El hook debe ser parametrizable para futuros formatos; extraer las funciones de header/footer como helpers internos reutilizables

## Análisis Técnico

### Cambios Propuestos en BD
Ninguno. Todos los datos necesarios ya están disponibles en `getOrder`.

### Estructura del nuevo hook

```
src/hooks/usePrintCotizacion.jsx   ← NUEVO
```

**Lógica de paginación manual** (sin `autoTable` para el body, o usando `autoTable` con `didDrawPage` callback para redibujar header/footer):

```js
// Opción preferida: usar autoTable con callbacks
doc.autoTable({
  didDrawPage: (data) => {
    drawHeader(doc, header, pageWidth, marginLeft);
    drawFooter(doc, pageWidth, pageHeight, marginLeft);
  },
  willDrawCell: (data) => {
    // Para badge CORTESÍA dentro de la celda nombre
  },
  // ...
});
```

**Funciones helper internas:**
- `drawHeader(doc, header, pageWidth, marginLeft)` — dibuja logo + datos empresa + número/fecha
- `drawFooter(doc, pageWidth, pageHeight, marginLeft)` — dibuja pie de página
- `numberToWords(n)` — convierte total a letras en español (implementar sin librería externa)
- `addValidezDate(fac_fec)` — suma 14 días

### Columnas de la tabla

| Col | Header | Width | Align |
|-----|--------|-------|-------|
| 0 | Código | 18mm | center |
| 1 | Artículo | 72mm | left |
| 2 | Cant. | 14mm | center |
| 3 | Vlr. Unit. | 26mm | right |
| 4 | % Dto. | 16mm | center |
| 5 | Total | 26mm | right |

### Principios SOLID Aplicados

- **SRP:** `usePrintCotizacion` tiene una única responsabilidad: generar el PDF de cotización. Las funciones `drawHeader`, `drawFooter`, `numberToWords` son helpers cohesivos dentro del mismo módulo
- **OCP:** `usePrintOrder` no se toca. El nuevo hook extiende la capacidad de impresión sin modificar lo existente
- **DIP:** Recibe `fac_nro` y hace su propia llamada a la API, igual que `usePrintOrder` — sin acoplamiento a estado del componente padre

## Plan de Implementación

### Fase 1: Utilidades base
- [ ] Implementar función `numberToWords(n)` para conversión a letras en español
- [ ] Implementar función `addDays(dateStr, days)` para cálculo de vigencia
- [ ] Implementar función `drawHeader(doc, data, pageWidth, margin)` con logo + datos empresa + número/fecha
- [ ] Implementar función `drawFooter(doc, pageWidth, pageHeight, margin)` con datos de pie

### Fase 2: Tabla de productos con paginación
- [ ] Construir `tableRows` procesando `details`: detectar `es_componente_bundle` para badge CORTESÍA y texto "Obsequio"
- [ ] Configurar `doc.autoTable` con `didDrawPage` callback para header/footer automáticos
- [ ] Validar comportamiento con cotizaciones de 1, 10, 20, y 50+ líneas

### Fase 3: Secciones finales
- [ ] Sección Cliente (solo en p.1 — usar `startY` calculado post-header)
- [ ] Sección Observaciones + Totales en última página
- [ ] Sección Datos para Pago
- [ ] Nombre del archivo y descarga

### Fase 4: Integración en POS2
- [ ] Importar `usePrintCotizacion` en `POS2.jsx`
- [ ] Reemplazar llamadas a `printOrder(fac_nro)` → `printCotizacion(fac_nro)` cuando `fac_tip_cod === 'COT'`
- [ ] Verificar que las 3 llamadas existentes en POS2 funcionen correctamente

## Casos de Prueba Propuestos

### Happy Path
1. **Cotización 1 página:** COT con 5 artículos normales → PDF 1 página, header y footer visibles
2. **Cotización multipágina:** COT con 25+ artículos → PDF 2+ páginas, header y footer en cada una, totales solo en última
3. **Cotización con bundles:** Items con `es_componente_bundle=1` → badge "CORTESÍA", precio "—", total "Obsequio" en cursiva
4. **Cotización con descuento general:** `fac_descuento_general > 0` → línea descuento visible en totales
5. **Cotización con `fac_obs`:** Texto de observación visible en sección Observaciones

### Edge Cases
1. **Cliente sin dirección:** `nit_dir` vacío → campo en blanco, sin crash
2. **Cliente sin ciudad:** `ciu_nom` null → campo en blanco
3. **Total 0:** Cotización solo de cortesías → "Total a pagar $0", letras "Cero pesos m/cte."
4. **Nombre artículo muy largo:** >70 chars → autoTable hace wrap, badge CORTESÍA sigue visible

### Error Cases
1. **API falla:** `catch` → `console.error` sin crash de la aplicación (igual que hook actual)

## ⚠️ Gaps y Dudas

### Dudas de Negocio

1. **Datos de pago:** Las cuentas bancarias (Bancolombia, Nequi, Daviplata) ¿son estáticas o vienen de configuración de BD? Si cambian en el tiempo, ¿debe ser un parámetro de la API?
2. **Texto de observaciones estándar:** El texto "Cotización válida por 14 días..." ¿es siempre el mismo? ¿Puede variar según el tipo de cliente (mayorista/minorista)?
3. **Nota de cortesía:** El texto "Los artículos marcados como *cortesía*..." ¿debe aparecer siempre o solo cuando la cotización incluye items de bundle/promoción?
4. **`fac_obs`:** ¿Este campo ya trae el texto de observación específica del pedido (ej: "Promoción San Valentín")? ¿O hay otro campo?
5. **IVA:** El formato muestra "No aplica". ¿Es siempre así para cotizaciones, o hay productos gravados?

### Dudas Técnicas

1. **`fac_obs` en `getOrder`:** La query actual en `getOrder` no selecciona `f.fac_obs` en el header. ¿Hay que agregar ese campo al endpoint? Verificar en `orderModel.js` línea ~590.
2. **Número en letras:** ¿Se requiere soporte para valores > 999.999.999? (billones en español colombiano)
3. **Logo:** `prettyLogo1.png` funciona con `import` estático en el hook actual. Confirmar que el mismo import funciona en el nuevo hook.

### Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| `fac_obs` no viene en la API response | Media | Medio | Verificar `getOrder` y agregar si falta (solo lectura, sin riesgo) |
| Badge CORTESÍA dentro de celda autoTable difícil de posicionar | Media | Bajo | Usar color de fondo rosado en la fila y texto "[CORTESÍA]" como alternativa si el badge es complejo |
| `numberToWords` para montos colombianos (>1M) con acentos | Baja | Bajo | Implementar y probar con valores representativos |
| Performance con 50+ líneas en PDF | Baja | Bajo | autoTable es eficiente; riesgo mínimo |

## Dependencias

- [x] jsPDF + jspdf-autotable ya instalados (`^2.5.2` y `^3.8.4`)
- [ ] Confirmar que `f.fac_obs` está disponible en response de `GET /api/order/:fac_nro`
- [ ] Confirmación del usuario sobre datos bancarios (¿estáticos o de BD?)
- [ ] Confirmación del usuario sobre textos fijos de observaciones

## Estimación

- **Implementación:** 3-4 horas
- **Testing manual:** 1 hora
- **Total:** ~4-5 horas
