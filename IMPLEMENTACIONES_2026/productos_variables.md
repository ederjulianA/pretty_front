# Implementacion Frontend - Productos Variables

## Resumen

El backend implemento soporte para **productos variables** (tipo WooCommerce). Un producto variable es un producto padre que define atributos (Tono/Color) y tiene multiples variaciones hijas, cada una con su propio SKU, precio y stock.

### Jerarquia de Productos

```
Producto Variable (Padre)
├── art_woo_type = 'variable'
├── art_variable = 'S'
├── art_cod = "LAB001"
├── Define atributos: Tono = [Rojo Pasion, Rosa Nude, Ciruela Oscuro]
├── Precios de REFERENCIA (no se vende directamente)
├── SIN stock propio
│
└── Variaciones (Hijas)
    ├── Variacion 1: art_cod = "LAB001-ROJO-PASION"  → precio y stock propio
    ├── Variacion 2: art_cod = "LAB001-ROSA-NUDE"     → precio y stock propio
    └── Variacion 3: art_cod = "LAB001-CIRUELA-OSCURO" → precio y stock propio
```

---

## Endpoints Disponibles

### 1. Crear Producto Variable (Padre)

```
POST /api/articulos/variable
Content-Type: multipart/form-data
Header: x-access-token: {token}
```

**Campos requeridos:**
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `art_nom` | string | Nombre del producto |
| `art_cod` | string (max 30) | Codigo base del SKU |
| `subcategoria` | integer (SMALLINT) | inv_sub_gru_cod |
| `attributes` | JSON array | Atributos del producto |

**Campos opcionales:**
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `categoria` | string | inv_gru_cod para WooCommerce |
| `precio_detal_referencia` | decimal | Precio detal de referencia |
| `precio_mayor_referencia` | decimal | Precio mayor de referencia |
| `image1` a `image4` | file | Imagenes del producto (max 4) |

**Formato de `attributes`:**
```json
[
  {
    "name": "Tono",
    "options": ["Rojo Pasion", "Rosa Nude", "Ciruela Oscuro"]
  }
]
```

> **Importante:** Solo se permiten los atributos "Tono" o "Color".

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "art_sec": "50001",
    "art_cod": "LAB001",
    "art_nom": "Labial Mate Professional",
    "art_woo_id": 12345,
    "art_woo_type": "variable",
    "attributes": [{"name": "Tono", "options": ["Rojo Pasion", "Rosa Nude"]}],
    "images": ["https://res.cloudinary.com/.../LAB001_1.jpg"]
  },
  "errors": {}
}
```

### 2. Crear Variacion (Hija)

```
POST /api/articulos/variable/{parent_art_sec}/variations
Content-Type: multipart/form-data
Header: x-access-token: {token}
```

**Campos requeridos:**
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `art_nom` | string | Nombre de la variacion |
| `attributes` | JSON object | Atributo especifico de esta variacion |
| `precio_detal` | decimal | Precio detal de la variacion |
| `precio_mayor` | decimal | Precio mayor de la variacion |

**Campos opcionales:**
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `image1` | file | Imagen especifica de la variacion |

**Formato de `attributes` (objeto, NO array):**
```json
{"Tono": "Rojo Pasion"}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "art_sec": "50002",
    "art_cod": "LAB001-ROJO-PASION",
    "art_nom": "Labial Mate Professional - Rojo Pasion",
    "parent_art_sec": "50001",
    "art_woo_variation_id": 12346,
    "art_woo_type": "variation",
    "attributes": {"Tono": "Rojo Pasion"},
    "precio_detal": 48000,
    "precio_mayor": 38000,
    "images": [...]
  }
}
```

> **Nota:** El `art_cod` de la variacion se genera automaticamente: `{padre_cod}-{TONO-SLUG}` (max 30 chars).

### 3. Obtener Variaciones de un Producto

```
GET /api/articulos/variable/{parent_art_sec}/variations
Header: x-access-token: {token}
```

**Respuesta (200):**
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "art_sec": "50002",
      "art_cod": "LAB001-ROJO-PASION",
      "art_nom": "Labial Mate Professional - Rojo Pasion",
      "art_woo_variation_id": 12346,
      "art_variation_attributes": {"Tono": "Rojo Pasion"},
      "precio_detal": 48000,
      "precio_mayor": 38000,
      "existencia": 15
    }
  ]
}
```

---

## Reglas de Negocio Clave

1. **Stock:** El producto padre NO tiene stock. Cada variacion maneja su propio inventario.
2. **Precios:** El padre tiene precios de referencia. Cada variacion tiene sus precios reales de venta.
3. **Promociones:** Se registran a nivel del padre y las heredan todas las variaciones automaticamente.
4. **Atributos:** Solo se permiten "Tono" o "Color" como nombre de atributo.
5. **SKU:** Se genera automaticamente para variaciones: `{codigo_padre}-{TONO-EN-MAYUSCULAS}` (max 30 chars).
6. **Imagenes:** Tanto padre como variaciones soportan hasta 4 imagenes.

---

## Plan de Implementacion Frontend

### Fase 1: Selector de Tipo de Producto en CreateProduct

**Archivo:** `src/pages/CreateProduct.jsx`

**Cambio principal:** Agregar un selector al inicio del formulario que permita elegir entre "Producto Simple" y "Producto Variable".

#### Comportamiento segun tipo:

**Producto Simple (comportamiento actual, sin cambios):**
- Formulario actual intacto
- Se envia a `POST /api/crearArticulo` como siempre

**Producto Variable:**
- Mostrar campos del padre: nombre, codigo, categoria, subcategoria, imagenes
- Agregar seccion de **precios de referencia** (opcionales)
- Agregar seccion de **atributos**: selector de tipo (Tono/Color) + campo para agregar opciones (chips/tags)
- Ocultar los campos de precio obligatorio (precio_detal, precio_mayor) ya que son de referencia
- Se envia a `POST /api/articulos/variable`

#### Diseno UI del selector de tipo:

```
┌─────────────────────────────────────────────────┐
│  Crear Nuevo Producto                           │
│                                                 │
│  Tipo de Producto                               │
│  ┌──────────────────┐ ┌──────────────────┐      │
│  │  ☐ Simple        │ │  ☐ Variable      │      │
│  │  Producto unico  │ │  Con variaciones │      │
│  │  con un SKU      │ │  (tonos/colores) │      │
│  └──────────────────┘ └──────────────────┘      │
│                                                 │
│  ... campos del formulario segun tipo ...       │
└─────────────────────────────────────────────────┘
```

Usar dos cards seleccionables tipo radio con borde rosa al seleccionar. Debe ser lo primero en el formulario.

#### Diseno UI de atributos (solo para Variable):

```
┌─────────────────────────────────────────────────┐
│  Atributos                                      │
│                                                 │
│  Tipo de atributo                               │
│  ┌───────────────────────────────────────────┐  │
│  │ Tono                                    ▾ │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  Opciones                                       │
│  ┌──────────────────────────────┐ ┌────────┐   │
│  │ Agregar opcion...            │ │ + Add  │   │
│  └──────────────────────────────┘ └────────┘   │
│                                                 │
│  ┌─────────────┐ ┌───────────┐ ┌────────────┐  │
│  │ Rojo Pasion ✕│ │ Rosa Nude ✕│ │ Ciruela  ✕│  │
│  └─────────────┘ └───────────┘ └────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

Usar chips/tags con boton de eliminar (X). Input + boton para agregar. Se puede agregar con Enter o con click en el boton.

#### Estructura del formulario para Producto Variable:

```
1. Selector de tipo (Simple / Variable)
2. Codigo (con boton de generar)
3. Nombre
4. Categoria (select)
5. Subcategoria (select, dependiente de categoria)
6. Seccion Atributos:
   - Tipo de atributo: Tono | Color (select)
   - Input para agregar opciones + boton agregar
   - Lista de opciones como chips
7. Precios de Referencia (grid 2 cols, opcionales):
   - Precio Detal Referencia
   - Precio Mayor Referencia
8. Codigo WooCommerce (opcional, oculto para variable ya que se sincroniza automaticamente)
9. Imagenes (drag & drop, max 4)
10. Botones: Cancelar | Crear Producto
```

#### Flujo al enviar formulario Variable:

1. Validar que hay al menos 1 opcion de atributo
2. Construir FormData con los campos del padre
3. Enviar `attributes` como JSON string: `JSON.stringify([{name: tipo, options: [...]}])`
4. POST a `/api/articulos/variable`
5. En caso de exito:
   - Mostrar SweetAlert de exito
   - Redirigir a la pantalla de edicion del producto variable (`/products/edit/{art_sec}`)
   - Desde ahi el usuario podra crear las variaciones

### Fase 2: Gestion de Variaciones en EditProduct

**Archivo:** `src/pages/EditProduct.jsx`

**Cambio principal:** Si el producto cargado tiene `art_woo_type === 'variable'`, mostrar una seccion adicional debajo del formulario de edicion para gestionar las variaciones.

#### Deteccion del tipo:

Al cargar el producto en el useEffect existente, verificar `prod.art_woo_type`:
- Si es `'simple'` o undefined: mostrar formulario actual sin cambios
- Si es `'variable'`: mostrar formulario de edicion + seccion de variaciones
- Si es `'variation'`: mostrar formulario de edicion con campos limitados (es hijo)

#### Seccion de Variaciones (solo para tipo 'variable'):

```
┌─────────────────────────────────────────────────────────────────┐
│  Editar Producto                                                │
│  ... formulario actual de edicion (sin cambios) ...             │
│                                                                 │
│  ─────────────────────────────────────────────                  │
│                                                                 │
│  Variaciones                                          + Nueva   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SKU              Nombre                 Detal   Mayor  Stk │ │
│  │ LAB001-ROJO      Labial - Rojo Pasion  $48.000 $38.000  15│ │
│  │ LAB001-ROSA      Labial - Rosa Nude    $48.000 $38.000  22│ │
│  │ LAB001-CIRUELA   Labial - Ciruela      $45.000 $35.000   8│ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Modal para crear nueva variacion:

```
┌─────────────────────────────────────────────────┐
│  Nueva Variacion                            ✕   │
│                                                 │
│  Producto padre: Labial Mate Professional       │
│  Atributo: Tono                                 │
│                                                 │
│  Seleccionar Tono                               │
│  ┌───────────────────────────────────────────┐  │
│  │ Rojo Pasion                             ▾ │  │
│  └───────────────────────────────────────────┘  │
│  (Solo muestra opciones que no tienen           │
│   variacion creada aun)                         │
│                                                 │
│  Nombre de la variacion                         │
│  ┌───────────────────────────────────────────┐  │
│  │ Labial Mate Professional - Rojo Pasion    │  │
│  └───────────────────────────────────────────┘  │
│  (Se auto-genera al seleccionar tono)           │
│                                                 │
│  ┌──────────────────┐ ┌──────────────────────┐  │
│  │ Precio Detal     │ │ Precio Mayor         │  │
│  │ $48.000          │ │ $38.000              │  │
│  └──────────────────┘ └──────────────────────┘  │
│                                                 │
│  Imagen (opcional)                              │
│  ┌────────────────────────────────────┐         │
│  │  📷 Seleccionar imagen            │         │
│  └────────────────────────────────────┘         │
│                                                 │
│  ┌──────────┐ ┌─────────────────────┐           │
│  │ Cancelar │ │ Crear Variacion     │           │
│  └──────────┘ └─────────────────────┘           │
└─────────────────────────────────────────────────┘
```

#### Flujo crear variacion desde modal:

1. Cargar opciones disponibles del atributo (las que no tienen variacion creada)
2. Al seleccionar una opcion, auto-generar el nombre: `{nombre_padre} - {opcion}`
3. Pre-llenar precios con los precios de referencia del padre (si existen)
4. Validar campos requeridos
5. Construir FormData:
   - `art_nom`: nombre generado
   - `attributes`: JSON string `{"Tono": "Rojo Pasion"}`
   - `precio_detal`: precio ingresado
   - `precio_mayor`: precio ingresado
   - `image1`: imagen opcional
6. POST a `/api/articulos/variable/{parent_art_sec}/variations`
7. En caso de exito: cerrar modal, recargar lista de variaciones, toast de exito

### Fase 3: Visualizacion en Products (listado)

**Archivo:** `src/pages/Products.jsx`

**Cambios minimos:** Agregar indicadores visuales para distinguir tipos de producto en la grilla.

#### Indicadores en la tabla desktop:

- **Producto Simple:** Sin indicador (comportamiento actual)
- **Producto Variable:** Badge `VARIABLE` color morado al lado del codigo
- **Variacion:** Mostrar con indentacion o icono de sub-item, con referencia al padre

#### Indicadores en tarjetas mobile:

- Badge de tipo debajo del nombre (similar a los badges de categoria)

#### Consideraciones:

- Las variaciones (`art_woo_type === 'variation'`) podrian ocultarse del listado principal si el endpoint ya las filtra, o mostrarse con indentacion visual
- El badge de tipo debe ser pequeno y no intrusivo
- Click en un producto variable lleva a EditProduct donde se ven las variaciones

---

## Archivos a Modificar/Crear

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/CreateProduct.jsx` | Agregar selector de tipo, seccion de atributos, logica condicional de envio |
| `src/pages/EditProduct.jsx` | Cargar tipo de producto, mostrar seccion variaciones si es variable, integrar modal |
| `src/pages/Products.jsx` | Badges visuales de tipo de producto (minimo) |

### Archivos a Crear

| Archivo | Proposito |
|---------|-----------|
| `src/components/product/ProductTypeSelector.jsx` | Selector visual Simple/Variable (cards seleccionables) |
| `src/components/product/AttributeManager.jsx` | Gestion de atributos: tipo + opciones con chips |
| `src/components/product/VariationsTable.jsx` | Tabla de variaciones con SKU, nombre, precios, stock |
| `src/components/product/CreateVariationModal.jsx` | Modal para crear nueva variacion |

### Estructura de componentes nuevos

```
src/components/product/
├── ProductPhotoGallery/          (existente)
├── ProductTypeSelector.jsx       (nuevo)
├── AttributeManager.jsx          (nuevo)
├── VariationsTable.jsx           (nuevo)
└── CreateVariationModal.jsx      (nuevo)
```

---

## Consideraciones UX/UI

### Principios de Diseno

1. **No romper lo existente:** El flujo de producto simple debe permanecer exactamente igual. El selector de tipo es lo primero que aparece, y por defecto esta en "Simple".

2. **Progressive disclosure:** Mostrar campos adicionales solo cuando el usuario selecciona "Variable". No abrumar con toda la informacion de golpe.

3. **Mobile-first:** Todos los componentes nuevos deben funcionar perfectamente en mobile:
   - El selector de tipo debe ser vertical en mobile (una card encima de otra)
   - Los chips de atributos deben hacer wrap
   - La tabla de variaciones debe usar tarjetas en mobile
   - El modal de variacion debe ser fullscreen en mobile

4. **Feedback inmediato:**
   - Al agregar una opcion de atributo, mostrar el chip inmediatamente
   - Al crear una variacion, actualizar la tabla sin recargar la pagina completa
   - Usar toasts para confirmaciones rapidas, SweetAlert para errores criticos

5. **Consistencia visual:**
   - Usar la misma paleta de colores (#f58ea3, #f7b3c2, #f5cad4)
   - Bordes redondeados (rounded-xl, rounded-2xl)
   - Fondo glassmorphism (bg-white/80 backdrop-blur-md)
   - Mismos estilos de inputs, selects y botones que el resto del sistema

### Estilos de los Componentes Nuevos

#### ProductTypeSelector
- Dos cards con borde `border-[#f5cad4]`
- Card seleccionada: `border-[#f58ea3] bg-pink-50 shadow-md`
- Card no seleccionada: `border-gray-200 hover:border-[#f7b3c2]`
- Icono descriptivo en cada card
- En mobile: `grid-cols-1`, en desktop: `grid-cols-2`

#### AttributeManager
- Select de tipo con mismos estilos del formulario
- Input + boton para agregar con `gap-2`
- Chips con fondo `bg-[#fff5f7]`, borde `border-[#f5cad4]`, boton X rosa
- Animacion suave al agregar/quitar chips

#### VariationsTable
- Mismos estilos que la tabla de Products.jsx
- Header rosa claro `bg-[#fff5f7]`
- Filas con hover `hover:bg-pink-50/50`
- En mobile: tarjetas similares a las de Products

#### CreateVariationModal
- Overlay con `bg-black/50 backdrop-blur-sm`
- Card del modal con `bg-white rounded-2xl shadow-2xl`
- En mobile: `fixed inset-0` (fullscreen)
- En desktop: `max-w-lg mx-auto` centrado
- Mismos estilos de inputs del formulario de creacion

---

## Ejemplo de Llamadas API desde el Frontend

### Crear producto variable (desde CreateProduct.jsx)

```javascript
import axios from 'axios';
import { API_URL } from '../config';

const createVariableProduct = async (formData, images, attributes) => {
  const data = new FormData();
  data.append('art_nom', formData.art_nom);
  data.append('art_cod', formData.art_cod);
  data.append('subcategoria', formData.subcategoria);

  if (formData.categoria) data.append('categoria', formData.categoria);
  if (formData.precio_detal_referencia) data.append('precio_detal_referencia', formData.precio_detal_referencia);
  if (formData.precio_mayor_referencia) data.append('precio_mayor_referencia', formData.precio_mayor_referencia);

  // attributes debe ser: [{"name":"Tono","options":["Rojo","Rosa"]}]
  data.append('attributes', JSON.stringify(attributes));

  // Imagenes
  images.forEach((img, i) => data.append(`image${i + 1}`, img));

  const token = localStorage.getItem('pedidos_pretty_token');
  const response = await axios.post(`${API_URL}/articulos/variable`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
      'x-access-token': token
    }
  });

  return response.data;
};
```

### Crear variacion (desde CreateVariationModal.jsx)

```javascript
const createVariation = async (parentArtSec, variationData, image) => {
  const data = new FormData();
  data.append('art_nom', variationData.art_nom);
  data.append('precio_detal', variationData.precio_detal);
  data.append('precio_mayor', variationData.precio_mayor);

  // attributes debe ser: {"Tono":"Rojo Pasion"} (objeto, NO array)
  data.append('attributes', JSON.stringify(variationData.attributes));

  if (image) data.append('image1', image);

  const token = localStorage.getItem('pedidos_pretty_token');
  const response = await axios.post(
    `${API_URL}/articulos/variable/${parentArtSec}/variations`,
    data,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-access-token': token
      }
    }
  );

  return response.data;
};
```

### Obtener variaciones (desde EditProduct.jsx)

```javascript
const fetchVariations = async (parentArtSec) => {
  const token = localStorage.getItem('pedidos_pretty_token');
  const response = await axios.get(
    `${API_URL}/articulos/variable/${parentArtSec}/variations`,
    { headers: { 'x-access-token': token } }
  );

  return response.data; // { success, count, data: [...] }
};
```

---

## Orden de Implementacion Sugerido

1. **Crear componentes nuevos** (ProductTypeSelector, AttributeManager) - sin integrar aun
2. **Modificar CreateProduct.jsx** - integrar selector de tipo y logica condicional
3. **Crear VariationsTable y CreateVariationModal** - componentes standalone
4. **Modificar EditProduct.jsx** - integrar seccion de variaciones
5. **Modificar Products.jsx** - agregar badges de tipo (cambio minimo)
6. **Testing completo** - probar flujo simple (no se rompio nada) y flujo variable
