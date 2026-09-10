---
slug: peso-dimensiones-productos-envia
origen: SPEC.md del frontend POS Pretty
fecha: 2026-08-12
estado: pendiente
---

# Solicitud Formal al Backend: Peso y dimensiones de productos para envia.com

> Generado desde el SPEC frontend. Contiene SOLO lo que el frontend necesita del backend.
> Ver también el análisis de negocio completo en `negocio_prettymakeup/specs/011-peso-dimensiones-productos-envia.md`, que ya incluye diagnóstico de producción, decisión de arquitectura (no cargar en WooCommerce directo) y plan de captura de datos (estimación IA + medición priorizada).

## Contexto

El plugin de envia.com integrado en WooCommerce exige peso y dimensiones por producto para cotizar tarifas de envío (sin defaults en su API). Hoy el 100% de los 844 productos publicados tiene estos campos vacíos, y el plugin usa un fallback fijo (1 kg, 0 cm) que no refleja el producto real y viola el mínimo exigido por la API de envia.com (0.1 para dimensiones, 0.01 para peso).

`dbo.articulos` no tiene columnas de peso/dimensiones, y el sync hacia WooCommerce (`models/articulosModel.js`) no las incluye en ningún payload. El frontend (`CreateProduct.jsx`, `EditProduct.jsx`) va a agregar 4 inputs numéricos opcionales que necesitan persistirse y sincronizarse siguiendo el mismo patrón ya usado para `art_max_unidades_pedido`.

## Solicitudes

### [SOLICITUD-1] Migración SQL: columnas de peso/dimensiones + trazabilidad en `dbo.articulos`

- **Tipo:** Cambio de esquema de base de datos
- **Archivo de referencia:** `EstructuraDatos/` (seguir patrón existente, ej. `01_alter_articulos_variaciones.sql` + script de verificación)
- **Necesidad:** Agregar 4 columnas nuevas para peso y dimensiones, más 1 columna de trazabilidad de origen del dato.
- **Propuesta de columnas** (a validar/ajustar por el equipo backend):
  ```sql
  ALTER TABLE dbo.articulos ADD art_peso DECIMAL(10,3) NULL;      -- kg
  ALTER TABLE dbo.articulos ADD art_largo DECIMAL(10,2) NULL;     -- cm
  ALTER TABLE dbo.articulos ADD art_ancho DECIMAL(10,2) NULL;     -- cm
  ALTER TABLE dbo.articulos ADD art_alto DECIMAL(10,2) NULL;      -- cm
  ALTER TABLE dbo.articulos ADD art_peso_fuente VARCHAR(15) NULL; -- 'estimado_ia' | 'medido' | 'sin_dato'
  ```
- **Precedente confirmado en BD:** `art_max_unidades_pedido` (`int`, nullable) como campo numérico opcional; `art_woo_sync_status` (`varchar(10)`, nullable) como campo corto tipo estado.
- **Impacto si no se resuelve:** Bloquea todo lo demás — sin columnas no hay dónde persistir el dato.

### [SOLICITUD-2] Incluir peso/dimensiones en creación de producto

- **Tipo:** Modificación de endpoint existente
- **Endpoints:** `POST /articulos` (simple/bundle) y `POST /articulos/variable`
- **Archivo backend actual:** `models/articulosModel.js` — `createArticulo` y `createVariableProduct` (~línea 1341)
- **Problema/Necesidad:** Estas funciones no reciben ni persisten peso/dimensiones. Deben aceptar los 4 campos nuevos (+ opcionalmente `art_peso_fuente`, aunque el frontend no lo edita en esta fase) como opcionales en el body, con el mismo tratamiento null-safe que ya existe para `art_max_unidades_pedido` (ver `validarMaxUnidadesPedido`, línea 51, como precedente de función de validación).
- **Request esperado (agregar a payload actual):**
  ```json
  {
    "art_peso": 0.15,
    "art_largo": 10.5,
    "art_ancho": 5,
    "art_alto": 3
  }
  ```
  Todos opcionales/nullable.
- **Response 200 esperado:** sin cambios en la forma, el producto creado debe incluir estos 4 campos en la respuesta.
- **Errores esperados:** 400 si el valor no es numérico o es negativo (validación análoga a `validarMaxUnidadesPedido`).
- **Impacto si no se resuelve:** No se puede capturar peso/dimensiones al crear un producto nuevo.

### [SOLICITUD-3] Incluir peso/dimensiones en edición de producto + sync a WooCommerce

- **Tipo:** Modificación de endpoint existente
- **Endpoint:** `PUT /articulos/:id`
- **Archivo backend actual:** `models/articulosModel.js` — `updateArticulo` (línea 1065) que llama a `updateWooCommerceProduct` (línea 106)
- **Problema/Necesidad:**
  1. `updateArticulo` debe aceptar y persistir los 4 campos nuevos en `dbo.articulos` (mismo patrón que `art_max_unidades_pedido`, líneas 1086-1095).
  2. `updateWooCommerceProduct` debe agregar `weight` y `dimensions` al objeto `data` que arma el PUT hacia WooCommerce (líneas 150-160), como **campos nativos** del schema REST de WooCommerce — **no** como `meta_data` (a diferencia de `art_max_unidades_pedido`, que sí usa `meta_data` vía `WOO_META_MAX_UNIDADES`).
- **Request esperado (agregar a payload actual del PUT):**
  ```json
  {
    "art_peso": 0.15,
    "art_largo": 10.5,
    "art_ancho": 5,
    "art_alto": 3
  }
  ```
- **Payload nativo que WooCommerce REST API espera** (referencia, para armar `data` en `updateWooCommerceProduct`):
  ```json
  {
    "weight": "0.15",
    "dimensions": {
      "length": "10.5",
      "width": "5",
      "height": "3"
    }
  }
  ```
- **Duda a resolver por backend:** ¿cómo se representa "sin dato" al vaciar un campo ya cargado? `art_max_unidades_pedido` usa `value: ""` porque es `meta_data`; `weight`/`dimensions` son campos nativos del producto Woo, así que el comportamiento de "borrar" puede ser distinto (string vacío, omitir el campo, o no soportado por la API de Woo). Confirmar antes de implementar el frontend de edición.
- **Errores esperados:** 400 (validación numérica), mismo tratamiento de errores que el resto del payload de `updateArticulo`.
- **Impacto si no se resuelve:** Es el gap más crítico — sin esto, aunque el dato se capture en el frontend, nunca llega a WooCommerce y el plugin de envia.com sigue usando el fallback de 1 kg / 0 cm.

### [SOLICITUD-4] Confirmar si el producto variable propaga peso/dimensiones del padre a variaciones en Woo

- **Tipo:** Aclaración técnica / posible modificación
- **Archivo backend actual:** `articulosModel.js` — bloques de `wcApi.put`/`wcApi.post` para variaciones (líneas ~1815-1844, 2014, 2123, 2274)
- **Problema/Necesidad:** El SPEC de frontend asume que peso/dimensiones se capturan solo en el producto padre (5/844 productos son variables). Confirmar si WooCommerce requiere que cada variación tenga su propio peso/dimensiones para que el plugin de envia.com cotice correctamente, o si hereda del padre automáticamente. Si se requiere propagación explícita, indicar si eso lo resuelve el backend al sincronizar variaciones o si el frontend debe exponer el campo también en el formulario de variaciones (cambiaría el alcance del SPEC).
- **Impacto si no se resuelve:** Riesgo de que los 5 productos variables sigan cotizando mal aunque el padre tenga los datos correctos.

### [SOLICITUD-5] (Opcional, fuera del flujo de este formulario) Mecanismo de carga masiva para las 844 referencias existentes

- **Tipo:** Aclaración de arquitectura, no bloqueante para este SPEC
- **Problema/Necesidad:** El documento de negocio (`specs/011`, Tarea 2) señala que cargar 844 productos uno por uno vía el flujo normal de edición implicaría 844 llamadas a la API REST de WooCommerce. Confirmar si el equipo de backend construirá un script/endpoint bulk separado para la carga inicial (estimación IA + medición), o si se hará iterando el mismo `PUT /articulos/:id` producto por producto.
- **Impacto si no se resuelve:** No bloquea la implementación de este SPEC (que solo cubre el formulario para carga manual/individual), pero sí bloquea completar el criterio de aceptación de negocio "100% del catálogo con datos".

## Notas para el Backend

- `art_sec` es `VARCHAR(30)` — nunca asumir INT.
- Fechas como string `'YYYY-MM-DD'` (bug de timezone del driver mssql).
- `articulosdetalle` siempre con `bod_sec = '1'`.
- Secuencias vía `dbo.secuencia` con UPDLOCK/HOLDLOCK (nunca MAX+1) — no aplica directamente a esta solicitud (no se crean secuencias nuevas), pero se menciona por convención del proyecto.
- El patrón de `meta_data` con `value: ""` para borrar (usado en `WOO_META_MAX_UNIDADES`) **no aplica igual** a `weight`/`dimensions` por ser campos nativos de WooCommerce — verificar comportamiento real contra la API de WooCommerce antes de asumir paridad.
- Coordinar con el equipo si hay trabajo en paralelo sobre `articulosModel.js` o los formularios de producto (specs/009, specs/010 mencionados en el análisis de negocio) para evitar conflictos de merge.

## Criterios de aceptación backend

- [ ] Las 4 columnas nuevas (+ trazabilidad) existen en `dbo.articulos`, nullable, sin romper queries existentes.
- [ ] `POST /articulos` y `POST /articulos/variable` aceptan y persisten los 4 campos como opcionales.
- [ ] `PUT /articulos/:id` acepta, persiste y sincroniza los 4 campos hacia WooCommerce como campos nativos (`weight`, `dimensions`), no como `meta_data`.
- [ ] Auth vía `x-access-token` aplicado (sin cambios, ya existe en estos endpoints).
- [ ] Validación: numérico positivo o `null`, mismo tratamiento que `art_max_unidades_pedido`.
- [ ] Queries parametrizadas (nunca concatenación de strings SQL).
- [ ] Confirmación explícita sobre SOLICITUD-4 (variaciones) y SOLICITUD-5 (bulk) antes de considerar el gap cerrado.
