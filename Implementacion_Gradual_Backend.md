# Plan de Implementación Gradual - Backend para Sistema de Roles y Permisos

Este documento detalla un plan de implementación gradual para incorporar el sistema de roles y permisos en el backend sin romper la funcionalidad existente del sistema POS.

## Fase 1: Preparación y Estructura de Datos (Semana 1)

### 1.1. Crear nuevas tablas en la base de datos

Ejecutar los scripts SQL para crear las siguientes tablas:
- `Roles`
- `UsuariosRoles`
- `Modulos`
- `Acciones`
- `RolesPermisos`
- `RolesPermisosAcciones`

> **Nota:** El script completo está disponible en el archivo `Estructura_Tablas_Roles_Permisos.md`

### 1.2. Cargar datos iniciales

1. Insertar roles predeterminados:
   - Administrador
   - Vendedor
   - Supervisor

2. Insertar módulos del sistema:
   - dashboard
   - products
   - clients
   - orders
   - pos
   - ajustes
   - conteos
   - admin

3. Insertar acciones por módulo según se especifica en el script.

### 1.3. Asignar rol Administrador a usuarios clave

```sql
-- Ejemplo: Asignar el rol Administrador al usuario 'admin'
DECLARE @admin_rol_id INT
SELECT @admin_rol_id = rol_id FROM [dbo].[Roles] WHERE rol_nombre = 'Administrador'

INSERT INTO [dbo].[UsuariosRoles] ([usu_cod], [rol_id])
VALUES ('admin', @admin_rol_id)
```

> **Objetivo de la fase:** Tener la estructura de datos lista sin afectar la funcionalidad existente.

## Fase 2: Modificación del Sistema de Autenticación (Semana 2)

### 2.1. Crear la función para obtener permisos en formato JSON

Implementar la función `fn_GetUserPermissionsJSON` como se define en el archivo de estructura de tablas.

### 2.2. Modificar el endpoint de login existente

Modificar el endpoint de login para incluir información de permisos, pero sin eliminar el comportamiento actual:

```javascript
// Controller de autenticación (ejemplo en Node.js)
const login = async (req, res) => {
  try {
    const { usu_cod, usu_pass } = req.body;
    
    // Código existente para validar credenciales
    // ...
    
    // Obtener permisos del usuario si las credenciales son válidas
    const permisos = await db.query(`SELECT dbo.fn_GetUserPermissionsJSON('${usu_cod}') AS permisos`);
    
    // Incluir permisos en la respuesta junto con el token y datos de usuario
    res.json({
      success: true,
      token: generatedToken,
      usuario: user.usu_nom,
      // Campo nuevo que no afecta el código existente
      permisos: JSON.parse(permisos[0].permisos || '{}')
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión' 
    });
  }
}
```

### 2.3. Implementar endpoint para obtener permisos actualizados

```javascript
// GET /auth/permissions
const getPermissions = async (req, res) => {
  try {
    const usu_cod = req.userData.usu_cod; // Extraído del token JWT
    
    const permisos = await db.query(`SELECT dbo.fn_GetUserPermissionsJSON('${usu_cod}') AS permisos`);
    
    res.json({
      success: true,
      permisos: JSON.parse(permisos[0].permisos || '{}')
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener permisos' 
    });
  }
}
```

> **Prueba de regresión:** Verificar que las aplicaciones cliente existentes siguen funcionando con el endpoint de login modificado.

## Fase 3: Implementación de API de Roles (Semana 3)

### 3.1. Desarrollar endpoints CRUD para roles

Implementar los siguientes endpoints:
- `GET /roles` - Listar roles
- `GET /roles/{id}` - Obtener rol específico
- `POST /roles` - Crear rol
- `PUT /roles/{id}` - Actualizar rol
- `DELETE /roles/{id}` - Eliminar rol

### 3.2. Ejemplo de implementación para listar roles

```javascript
// GET /roles
const getRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const active = req.query.active === 'true' ? 1 : (req.query.active === 'false' ? 0 : null);
    
    let query = `
      SELECT 
        rol_id as id,
        rol_nombre as name,
        rol_descripcion as description,
        rol_activo as active
      FROM 
        [dbo].[Roles]
    `;
    
    if (active !== null) {
      query += ` WHERE rol_activo = ${active}`;
    }
    
    query += ` ORDER BY rol_nombre
              OFFSET ${offset} ROWS
              FETCH NEXT ${limit} ROWS ONLY`;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM [dbo].[Roles]
      ${active !== null ? `WHERE rol_activo = ${active}` : ''}
    `;
    
    const roles = await db.query(query);
    const totalItems = await db.query(countQuery);
    const count = totalItems[0].total;
    
    res.json({
      success: true,
      roles,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener roles' 
    });
  }
}
```

### 3.3. Proteger los endpoints con middleware de autenticación básico

```javascript
// Middleware de autenticación básico
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers['x-access-token'];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido o expirado' 
    });
  }
};

// Aplicar a las rutas
router.get('/roles', authMiddleware, rolesController.getRoles);
```

> **Objetivo de la fase:** Tener una API funcional para gestionar roles, pero sin afectar el flujo actual de la aplicación.

## Fase 4: Implementación de API de Usuarios-Roles (Semana 4)

### 4.1. Desarrollar endpoints para gestionar usuarios y sus roles

Implementar los siguientes endpoints:
- `GET /users` - Listar usuarios con sus roles
- `GET /users/{usu_cod}/roles` - Obtener roles de un usuario
- `PUT /users/{usu_cod}/roles` - Asignar roles a un usuario

### 4.2. Ejemplo de implementación para asignar roles a usuario

```javascript
// PUT /users/{usu_cod}/roles
const assignRolesToUser = async (req, res) => {
  try {
    const { usu_cod } = req.params;
    const { roles } = req.body;
    
    // Verificar que el usuario existe
    const userExists = await db.query(`
      SELECT COUNT(*) as count FROM [dbo].[Usuarios] WHERE usu_cod = '${usu_cod}'
    `);
    
    if (userExists[0].count === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }
    
    // Verificar que los roles existen
    const roleIds = roles.join(',');
    const rolesExist = await db.query(`
      SELECT rol_id, rol_nombre FROM [dbo].[Roles] 
      WHERE rol_id IN (${roleIds})
    `);
    
    if (rolesExist.length !== roles.length) {
      return res.status(400).json({ 
        success: false, 
        message: 'Roles inválidos',
        errors: ['Uno o más roles no existen']
      });
    }
    
    // Eliminar roles actuales
    await db.query(`
      DELETE FROM [dbo].[UsuariosRoles] 
      WHERE usu_cod = '${usu_cod}'
    `);
    
    // Asignar nuevos roles
    for (const rolId of roles) {
      await db.query(`
        INSERT INTO [dbo].[UsuariosRoles] (usu_cod, rol_id)
        VALUES ('${usu_cod}', ${rolId})
      `);
    }
    
    // Obtener los roles asignados para la respuesta
    const assignedRoles = await db.query(`
      SELECT r.rol_id as id, r.rol_nombre as name
      FROM [dbo].[UsuariosRoles] ur
      JOIN [dbo].[Roles] r ON ur.rol_id = r.rol_id
      WHERE ur.usu_cod = '${usu_cod}'
    `);
    
    res.json({
      success: true,
      message: 'Roles asignados exitosamente',
      user: {
        usu_cod,
        roles: assignedRoles
      }
    });
  } catch (error) {
    console.error('Error al asignar roles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al asignar roles' 
    });
  }
}
```

> **Objetivo de la fase:** Tener la capacidad de asignar roles a usuarios desde el backend.

## Fase 5: Implementación de Middleware de Permisos (Semana 5)

### 5.1. Desarrollar middleware para validar permisos

```javascript
// Middleware para validar permisos
const permissionMiddleware = (module, action = null) => {
  return async (req, res, next) => {
    try {
      const usu_cod = req.userData.usu_cod;
      
      // Obtener permisos del usuario
      const permissionsResult = await db.query(`
        SELECT dbo.fn_GetUserPermissionsJSON('${usu_cod}') AS permisos
      `);
      
      const permissions = JSON.parse(permissionsResult[0].permisos || '{}');
      
      // Verificar acceso al módulo
      if (!permissions[module] || !permissions[module].access) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para acceder a este recurso'
        });
      }
      
      // Si se especifica una acción, verificar el permiso para esa acción
      if (action && (!permissions[module].actions || !permissions[module].actions.includes(action))) {
        return res.status(403).json({
          success: false,
          message: 'No tiene permisos para realizar esta acción'
        });
      }
      
      next();
    } catch (error) {
      console.error('Error al validar permisos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al validar permisos' 
      });
    }
  };
};
```

### 5.2. Aplicar middleware a rutas seleccionadas para pruebas

Identificar algunas rutas no críticas para aplicar el middleware de permisos:

```javascript
// Aplicar a rutas de administración primero
router.get('/modules', [authMiddleware, permissionMiddleware('admin')], modulesController.getModules);
router.get('/modules/:id/actions', [authMiddleware, permissionMiddleware('admin')], modulesController.getModuleActions);
```

### 5.3. Implementar caché de permisos (opcional)

Para mejorar el rendimiento, implementar un sistema de caché para los permisos:

```javascript
// Ejemplo usando Redis (requiere instalación de módulo redis)
const redis = require('redis');
const client = redis.createClient();

// Middleware con caché de permisos
const permissionMiddlewareWithCache = (module, action = null) => {
  return async (req, res, next) => {
    try {
      const usu_cod = req.userData.usu_cod;
      const cacheKey = `permissions:${usu_cod}`;
      
      // Intentar obtener permisos de la caché
      client.get(cacheKey, async (err, cachedPermissions) => {
        if (err) throw err;
        
        let permissions;
        
        if (cachedPermissions) {
          permissions = JSON.parse(cachedPermissions);
        } else {
          // Obtener permisos de la base de datos
          const permissionsResult = await db.query(`
            SELECT dbo.fn_GetUserPermissionsJSON('${usu_cod}') AS permisos
          `);
          
          permissions = JSON.parse(permissionsResult[0].permisos || '{}');
          
          // Guardar en caché por 15 minutos
          client.setex(cacheKey, 900, JSON.stringify(permissions));
        }
        
        // Lógica de validación de permisos igual que antes
        // ...
        
        next();
      });
    } catch (error) {
      console.error('Error al validar permisos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al validar permisos' 
      });
    }
  };
};
```

> **Objetivo de la fase:** Tener un sistema funcional de validación de permisos aplicado a rutas seleccionadas.

## Fase 6: Extensión y Pruebas (Semana 6)

### 6.1. Desarrollar endpoints para módulos y acciones

Implementar los endpoints para listar módulos y acciones:
- `GET /modules` - Listar módulos 
- `GET /modules/{moduleId}/actions` - Listar acciones por módulo

### 6.2. Aplicar middleware de permisos a más rutas

Extender gradualmente la aplicación del middleware de permisos a más rutas:

```javascript
// Ejemplos:
router.get('/products', [authMiddleware, permissionMiddleware('products', 'view')], productsController.index);
router.post('/products', [authMiddleware, permissionMiddleware('products', 'create')], productsController.create);
// ...
```

### 6.3. Implementar sistema de logs para cambios en roles y permisos

```javascript
// Middleware para registrar cambios en roles y permisos
const logRoleChanges = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(body) {
    try {
      const response = JSON.parse(body);
      
      if (response.success) {
        // Registrar cambio en la base de datos
        const usu_cod = req.userData.usu_cod;
        const action = req.method;
        const resource = req.originalUrl;
        const details = JSON.stringify({
          body: req.body,
          params: req.params
        });
        
        db.query(`
          INSERT INTO [dbo].[LogActividades] 
          (usu_cod, accion, recurso, detalles, fecha)
          VALUES ('${usu_cod}', '${action}', '${resource}', '${details}', GETDATE())
        `);
      }
    } catch (error) {
      console.error('Error al registrar log:', error);
    }
    
    originalSend.call(this, body);
  };
  
  next();
};

// Aplicar a rutas de roles y permisos
router.use('/roles', logRoleChanges);
router.use('/users/:usu_cod/roles', logRoleChanges);
```

### 6.4. Pruebas exhaustivas

1. Verificar que todas las rutas funcionan correctamente con los permisos adecuados
2. Probar casos límite y errores
3. Comprobar que la caché de permisos funciona correctamente
4. Validar que los logs se registran adecuadamente

> **Objetivo de la fase:** Tener un sistema completo de roles y permisos funcionando en la API.

## Fase 7: Documentación y Finalización (Semana 7)

### 7.1. Documentar API completa

Completar la documentación de la API con ejemplos de uso para todos los endpoints:
- Crear documentación detallada para desarrolladores front-end
- Incluir ejemplos de requests y responses
- Documentar códigos de error y sus significados

### 7.2. Implementar renovación de tokens

```javascript
// Endpoint para renovar token sin reautenticación
const refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers['x-access-token'];
    
    if (!oldToken) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }
    
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Verificar que el token no ha expirado hace más de 24 horas
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp + 86400 < currentTime) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado hace más de 24 horas, inicie sesión nuevamente' 
      });
    }
    
    // Generar nuevo token
    const usu_cod = decoded.sub;
    const newToken = jwt.sign(
      { 
        sub: usu_cod,
        name: decoded.name,
        role: decoded.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    // Obtener permisos actualizados
    const permisos = await db.query(`
      SELECT dbo.fn_GetUserPermissionsJSON('${usu_cod}') AS permisos
    `);
    
    res.json({
      success: true,
      token: newToken,
      permisos: JSON.parse(permisos[0].permisos || '{}')
    });
  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Agregar ruta
router.post('/auth/refresh-token', refreshToken);
```

### 7.3. Integración con aplicación frontend

Coordinar con el equipo de frontend para la integración con el nuevo sistema de permisos:
- Explicar el formato de datos
- Proporcionar ejemplos de integración
- Responder dudas sobre la implementación

> **Objetivo de la fase:** Finalizar la implementación del sistema de roles y permisos con documentación completa.

## Consideraciones Adicionales

### Seguridad
1. Utilizar siempre consultas parametrizadas para prevenir inyecciones SQL
2. Implementar rate limiting para prevenir ataques de fuerza bruta
3. Configurar HTTPS en todas las comunicaciones
4. Aplicar principios de privilegio mínimo en la asignación de permisos

### Rendimiento
1. Implementar caché para permisos frecuentemente consultados
2. Optimizar consultas SQL con índices adecuados
3. Monitorear el rendimiento de endpoints críticos

### Compatibilidad
1. Mantener compatibilidad con clientes existentes
2. Proporcionar un período de adaptación para nuevos cambios
3. Considerar una estrategia de versionado de API si hay cambios significativos

## Plan de Contingencia

En caso de problemas en producción:

1. Tener scripts de rollback preparados para cada fase
2. Implementar un switch que permita deshabilitar temporalmente la validación de permisos
3. Mantener logs detallados para diagnóstico de problemas
4. Establecer un proceso claro para reportar y resolver incidentes

---

Este plan de implementación gradual permite incorporar el sistema de roles y permisos sin afectar la funcionalidad existente, priorizando la estabilidad y permitiendo validar cada fase antes de avanzar a la siguiente. 