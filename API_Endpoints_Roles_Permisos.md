# API Endpoints para Sistema de Roles y Permisos

Este documento detalla los endpoints necesarios para implementar el sistema de roles y permisos en la API del backend.

## 1. Endpoints de Autenticación

### 1.1. Login con Permisos

**Endpoint:** `POST /auth/login`

**Descripción:** 
Autenticar al usuario y devolver token con información de permisos

**Request:**
```json
{
  "usu_cod": "usuario123",
  "usu_pass": "contraseña123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": "Juan Pérez",
  "rol": "Administrador",
  "permisos": {
    "dashboard": {
      "access": true,
      "actions": ["view", "export"]
    },
    "products": {
      "access": true,
      "actions": ["view", "create", "edit", "delete"]
    },
    "clients": {
      "access": true,
      "actions": ["view", "create", "edit", "delete"]
    },
    "orders": {
      "access": true,
      "actions": ["view", "create", "cancel"]
    },
    "pos": {
      "access": true,
      "actions": ["view", "create_order", "apply_discount"]
    },
    "ajustes": {
      "access": true,
      "actions": ["view", "create", "edit"]
    },
    "conteos": {
      "access": true,
      "actions": ["view", "create", "edit"]
    },
    "admin": {
      "access": true,
      "actions": ["manage_roles", "manage_users"]
    }
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

### 1.2. Obtener Permisos Actualizados

**Endpoint:** `GET /auth/permissions`

**Descripción:**
Obtener los permisos actualizados del usuario autenticado

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "permisos": {
    "dashboard": {
      "access": true,
      "actions": ["view", "export"]
    },
    "products": {
      "access": true,
      "actions": ["view", "create", "edit", "delete"]
    },
    // Otros módulos...
  }
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Token inválido o expirado"
}
```

## 2. Endpoints de Gestión de Roles

### 2.1. Listar Roles

**Endpoint:** `GET /roles`

**Descripción:**
Obtener la lista de todos los roles disponibles

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (opcionales):**
```
page: 1
limit: 10
active: true
```

**Response (200 OK):**
```json
{
  "success": true,
  "roles": [
    {
      "id": 1,
      "name": "Administrador",
      "description": "Acceso completo al sistema",
      "active": true
    },
    {
      "id": 2,
      "name": "Vendedor",
      "description": "Acceso a POS y ventas",
      "active": true
    }
  ],
  "pagination": {
    "totalItems": 5,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

**Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "No tiene permisos para ver roles"
}
```

### 2.2. Obtener Rol Específico

**Endpoint:** `GET /roles/{id}`

**Descripción:**
Obtener detalles completos de un rol específico, incluyendo sus permisos

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "role": {
    "id": 1,
    "name": "Administrador",
    "description": "Acceso completo al sistema",
    "active": true,
    "permissions": {
      "dashboard": {
        "access": true,
        "actions": ["view", "export"]
      },
      "products": {
        "access": true,
        "actions": ["view", "create", "edit", "delete"]
      },
      // Otros módulos...
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Rol no encontrado"
}
```

### 2.3. Crear Nuevo Rol

**Endpoint:** `POST /roles`

**Descripción:**
Crear un nuevo rol con sus permisos

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Supervisor",
  "description": "Acceso a reportes y funciones de supervisión",
  "permissions": {
    "dashboard": {
      "access": true,
      "actions": ["view", "export"]
    },
    "products": {
      "access": true,
      "actions": ["view"]
    },
    "orders": {
      "access": true,
      "actions": ["view", "cancel"]
    }
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Rol creado exitosamente",
  "role": {
    "id": 3,
    "name": "Supervisor",
    "description": "Acceso a reportes y funciones de supervisión"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Datos inválidos",
  "errors": [
    "El nombre del rol es requerido"
  ]
}
```

### 2.4. Actualizar Rol

**Endpoint:** `PUT /roles/{id}`

**Descripción:**
Actualizar un rol existente y sus permisos

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Supervisor Avanzado",
  "description": "Acceso a reportes y funciones avanzadas de supervisión",
  "permissions": {
    "dashboard": {
      "access": true,
      "actions": ["view", "export"]
    },
    "products": {
      "access": true,
      "actions": ["view", "edit"]
    },
    "orders": {
      "access": true,
      "actions": ["view", "create", "cancel"]
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rol actualizado exitosamente",
  "role": {
    "id": 3,
    "name": "Supervisor Avanzado",
    "description": "Acceso a reportes y funciones avanzadas de supervisión"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Rol no encontrado"
}
```

### 2.5. Eliminar Rol

**Endpoint:** `DELETE /roles/{id}`

**Descripción:**
Eliminar un rol específico

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Rol eliminado exitosamente"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "No se puede eliminar el rol porque tiene usuarios asignados"
}
```

## 3. Endpoints de Gestión de Usuarios-Roles

### 3.1. Listar Usuarios con sus Roles

**Endpoint:** `GET /users`

**Descripción:**
Obtener la lista de usuarios con sus roles asignados

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (opcionales):**
```
page: 1
limit: 10
```

**Response (200 OK):**
```json
{
  "success": true,
  "users": [
    {
      "usu_cod": "admin123",
      "usu_nom": "Administrador Principal",
      "usu_email": "admin@example.com",
      "roles": [
        {
          "id": 1,
          "name": "Administrador"
        }
      ]
    },
    {
      "usu_cod": "vendedor1",
      "usu_nom": "Juan Vendedor",
      "usu_email": "juan@example.com",
      "roles": [
        {
          "id": 2,
          "name": "Vendedor"
        }
      ]
    }
  ],
  "pagination": {
    "totalItems": 10,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### 3.2. Obtener Roles de un Usuario

**Endpoint:** `GET /users/{usu_cod}/roles`

**Descripción:**
Obtener los roles asignados a un usuario específico

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "usu_cod": "vendedor1",
    "usu_nom": "Juan Vendedor",
    "roles": [
      {
        "id": 2,
        "name": "Vendedor"
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Usuario no encontrado"
}
```

### 3.3. Asignar Roles a Usuario

**Endpoint:** `PUT /users/{usu_cod}/roles`

**Descripción:**
Asignar uno o varios roles a un usuario

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "roles": [2, 3]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Roles asignados exitosamente",
  "user": {
    "usu_cod": "vendedor1",
    "roles": [
      {
        "id": 2,
        "name": "Vendedor"
      },
      {
        "id": 3,
        "name": "Supervisor"
      }
    ]
  }
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Roles inválidos",
  "errors": [
    "El rol con ID 5 no existe"
  ]
}
```

## 4. Endpoints de Módulos y Acciones

### 4.1. Listar Módulos

**Endpoint:** `GET /modules`

**Descripción:**
Obtener todos los módulos del sistema

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "modules": [
    {
      "id": 1,
      "code": "dashboard",
      "name": "Dashboard",
      "description": "Panel de control principal",
      "active": true
    },
    {
      "id": 2,
      "code": "products",
      "name": "Productos",
      "description": "Gestión de productos",
      "active": true
    },
    // Otros módulos...
  ]
}
```

### 4.2. Listar Acciones por Módulo

**Endpoint:** `GET /modules/{moduleId}/actions`

**Descripción:**
Obtener todas las acciones disponibles para un módulo específico

**Headers:**
```
x-access-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "module": {
    "id": 2,
    "code": "products",
    "name": "Productos"
  },
  "actions": [
    {
      "id": 3,
      "code": "view",
      "name": "Ver",
      "description": "Ver lista de productos"
    },
    {
      "id": 4,
      "code": "create",
      "name": "Crear",
      "description": "Crear nuevos productos"
    },
    {
      "id": 5,
      "code": "edit",
      "name": "Editar",
      "description": "Editar productos existentes"
    },
    {
      "id": 6,
      "code": "delete",
      "name": "Eliminar",
      "description": "Eliminar productos"
    }
  ]
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Módulo no encontrado"
}
```

## 5. Middleware de Validación de Permisos

### 5.1. Formato JSON Web Token (JWT)

El token generado debe incluir la siguiente información:

```javascript
{
  "sub": "usuario123",     // usu_cod del usuario
  "name": "Juan Pérez",    // nombre del usuario
  "role": "Administrador", // rol principal del usuario
  "iat": 1688115624,       // tiempo de emisión
  "exp": 1688144424        // tiempo de expiración (8 horas por defecto)
}
```

### 5.2. Middleware de Autenticación

Verifica que el token JWT es válido y no está expirado.

### 5.3. Middleware de Autorización

Verifica si el usuario tiene permisos para acceder a un recurso basado en su módulo y acción requerida.

**Ejemplo de uso en rutas:**

```javascript
// Verificar solo autenticación
app.get('/dashboard', authMiddleware, dashboardController.index);

// Verificar autenticación y permiso para módulo específico
app.get('/products', [authMiddleware, permissionMiddleware('products', 'view')], productsController.index);

// Verificar autenticación y permiso para acción específica
app.post('/products', [authMiddleware, permissionMiddleware('products', 'create')], productsController.create);
```

## 6. Recomendaciones para implementación

1. Utilizar JWT con fecha de expiración razonable (8 horas máximo)
2. Implementar renovación de tokens sin necesidad de reautenticación
3. Usar HTTPS para todas las comunicaciones de la API
4. Caché de permisos para mejorar el rendimiento
5. Log de actividades de modificación de roles y permisos
6. Considerar un sistema de notificación para cuando se modifiquen permisos de usuarios activos
7. Implementar validación de datos en todas las entradas
8. Aplicar rate limiting para prevenir abuso de API 