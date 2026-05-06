# Implementación: Nuevo Formato de Impresión de Cotizaciones (Carta)

**Fecha de implementación:** 26/04/2026  
**Estado:** Completado

## Archivos Creados
- `src/hooks/usePrintCotizacion.jsx` — Hook que genera el PDF de cotización en tamaño carta con header/footer en cada página, paginación automática, badge CORTESÍA, totales en palabras y sección de datos de pago

## Archivos Modificados
- `src/POS2.jsx` — Líneas 22 y 40: import + destructuring del nuevo hook. Líneas 522 y 570: llamadas `printOrder` → `printCotizacion` en flujo COT (edición y creación de cotizaciones)

## Desviaciones del SPEC

- **Badge CORTESÍA:** Se implementó con `didDrawCell` dibujando un `roundedRect` rosado con texto blanco "CORTESÍA" encima de la celda nombre, en lugar de usar texto `[CORTESÍA]` en la celda. El resultado visual es el badge del diseño de referencia.
- **Sección cliente en primera página:** Se implementa dentro del callback `didDrawPage` usando `data.pageNumber === 1` en lugar de un `startY` calculado externamente, para garantizar que autoTable posicione la tabla correctamente después de la sección cliente.
- **Líneas COT vs VTA en POS2:** Solo se reemplazaron las 2 llamadas del flujo COT (crear cotización y editar cotización). Las 2 llamadas del flujo VTA (crear factura y editar/convertir factura) conservan `usePrintOrder` intacto.

## Pruebas Manuales Recomendadas

1. Crear una cotización desde el POS → clic "Imprimir PDF" → verificar PDF carta con header, sección cliente, tabla y footer
2. Editar una cotización existente → clic "Imprimir PDF" → mismo resultado
3. Crear una cotización con 20+ artículos → verificar que el PDF tiene múltiples páginas con header y footer en cada una, y totales solo en la última
4. Crear una cotización con un bundle → verificar badge "CORTESÍA" rosado, precio "—" y total en cursiva "Obsequio"
5. Crear una factura (VTA) → verificar que sigue usando el formato anterior (`usePrintOrder`)
6. Verificar que la sección "DATOS PARA PAGO" muestra los datos del endpoint `/parametros/datos-pago-cotizacion`
7. Edge case: cliente sin dirección o ciudad → no debe crashear

## Notas para el siguiente desarrollador

- `usePrintCotizacion` está diseñado para ser la base de futuros formatos (compras, ajustes). Las funciones `drawHeader`, `drawFooter`, `drawClientSection` y `numberToWords` están separadas dentro del módulo y son fácilmente extraíbles a un archivo `src/utils/pdfHelpers.js` cuando se necesite reutilizarlas entre múltiples hooks de impresión.
- El endpoint `GET /api/parametros/datos-pago-cotizacion` tiene un fallback: si falla, el PDF muestra un mensaje de contacto genérico en lugar de crashear.
- `HEADER_HEIGHT = 38` y `FOOTER_HEIGHT = 18` son las constantes que controlan el espacio reservado en cada página. Si se ajusta el diseño del header/footer, actualizar estas constantes.
