# Estructura de Tablas para Sistema de Roles y Permisos

Este documento detalla la estructura de tablas necesaria para implementar un sistema de roles y permisos en la aplicación POS, basado en la estructura actual de usuarios.

## Tabla de Usuarios (Existente)

```sql
CREATE TABLE [dbo].[Usuarios](
	[usu_cod] [varchar](100) NOT NULL,
	[usu_nom] [varchar](40) NOT NULL,
	[usu_email] [varchar](40) NOT NULL,
	[usu_pass] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[usu_cod] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
```

## 1. Tabla de Roles

```sql
CREATE TABLE [dbo].[Roles](
    [rol_id] [int] IDENTITY(1,1) NOT NULL,
    [rol_nombre] [varchar](50) NOT NULL,
    [rol_descripcion] [varchar](200) NULL,
    [rol_activo] [bit] NOT NULL DEFAULT 1,
    [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
    [fecha_modificacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
    [rol_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

-- Crear roles predeterminados
INSERT INTO [dbo].[Roles] ([rol_nombre], [rol_descripcion]) 
VALUES 
    ('Administrador', 'Acceso completo a todas las funcionalidades del sistema'),
    ('Vendedor', 'Acceso a POS y funciones básicas de ventas'),
    ('Supervisor', 'Acceso a reportes y funciones de supervisión')
GO
```

## 2. Tabla de Asignación Usuario-Rol

```sql
CREATE TABLE [dbo].[UsuariosRoles](
    [usurol_id] [int] IDENTITY(1,1) NOT NULL,
    [usu_cod] [varchar](100) NOT NULL,
    [rol_id] [int] NOT NULL,
    [fecha_asignacion] [datetime] NOT NULL DEFAULT GETDATE(),
PRIMARY KEY CLUSTERED 
(
    [usurol_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_UsuariosRoles_Usuarios] FOREIGN KEY ([usu_cod]) REFERENCES [dbo].[Usuarios] ([usu_cod]),
CONSTRAINT [FK_UsuariosRoles_Roles] FOREIGN KEY ([rol_id]) REFERENCES [dbo].[Roles] ([rol_id])
) ON [PRIMARY]
GO

-- Índice para mejorar búsquedas por usuario
CREATE NONCLUSTERED INDEX [IX_UsuariosRoles_UsuCod] ON [dbo].[UsuariosRoles]
(
    [usu_cod] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
```

## 3. Tabla de Módulos del Sistema

```sql
CREATE TABLE [dbo].[Modulos](
    [mod_id] [int] IDENTITY(1,1) NOT NULL,
    [mod_codigo] [varchar](50) NOT NULL,
    [mod_nombre] [varchar](100) NOT NULL,
    [mod_descripcion] [varchar](200) NULL,
    [mod_activo] [bit] NOT NULL DEFAULT 1,
PRIMARY KEY CLUSTERED 
(
    [mod_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [UK_Modulos_Codigo] UNIQUE NONCLUSTERED ([mod_codigo] ASC)
) ON [PRIMARY]
GO

-- Insertar módulos predefinidos
INSERT INTO [dbo].[Modulos] ([mod_codigo], [mod_nombre], [mod_descripcion]) 
VALUES 
    ('dashboard', 'Dashboard', 'Panel de control principal'),
    ('products', 'Productos', 'Gestión de productos'),
    ('clients', 'Clientes', 'Gestión de clientes'),
    ('orders', 'Órdenes', 'Gestión de órdenes'),
    ('pos', 'POS', 'Punto de venta'),
    ('ajustes', 'Ajustes', 'Ajustes de inventario'),
    ('conteos', 'Conteos', 'Conteos de inventario'),
    ('admin', 'Administración', 'Funciones administrativas del sistema')
GO
```

## 4. Tabla de Acciones por Módulo

```sql
CREATE TABLE [dbo].[Acciones](
    [acc_id] [int] IDENTITY(1,1) NOT NULL,
    [mod_id] [int] NOT NULL,
    [acc_codigo] [varchar](50) NOT NULL,
    [acc_nombre] [varchar](100) NOT NULL,
    [acc_descripcion] [varchar](200) NULL,
PRIMARY KEY CLUSTERED 
(
    [acc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_Acciones_Modulos] FOREIGN KEY ([mod_id]) REFERENCES [dbo].[Modulos] ([mod_id]),
CONSTRAINT [UK_Acciones_ModCodigo] UNIQUE NONCLUSTERED ([mod_id], [acc_codigo] ASC)
) ON [PRIMARY]
GO

-- Procedimiento para insertar acciones por módulo
DECLARE @dashboard_id INT, @products_id INT, @clients_id INT, @orders_id INT, @pos_id INT, @ajustes_id INT, @conteos_id INT, @admin_id INT

-- Obtener IDs de los módulos
SELECT @dashboard_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'dashboard'
SELECT @products_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'products'
SELECT @clients_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'clients'
SELECT @orders_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'orders'
SELECT @pos_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'pos'
SELECT @ajustes_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'ajustes'
SELECT @conteos_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'conteos'
SELECT @admin_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'admin'

-- Insertar acciones por módulo
-- Dashboard
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@dashboard_id, 'view', 'Ver', 'Acceso de visualización al dashboard'),
    (@dashboard_id, 'export', 'Exportar', 'Exportar datos del dashboard')

-- Products
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@products_id, 'view', 'Ver', 'Ver lista de productos'),
    (@products_id, 'create', 'Crear', 'Crear nuevos productos'),
    (@products_id, 'edit', 'Editar', 'Editar productos existentes'),
    (@products_id, 'delete', 'Eliminar', 'Eliminar productos')

-- Clients
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@clients_id, 'view', 'Ver', 'Ver lista de clientes'),
    (@clients_id, 'create', 'Crear', 'Crear nuevos clientes'),
    (@clients_id, 'edit', 'Editar', 'Editar clientes existentes'),
    (@clients_id, 'delete', 'Eliminar', 'Eliminar clientes')

-- Orders
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@orders_id, 'view', 'Ver', 'Ver órdenes'),
    (@orders_id, 'create', 'Crear', 'Crear nuevas órdenes'),
    (@orders_id, 'cancel', 'Cancelar', 'Cancelar órdenes')

-- POS
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@pos_id, 'view', 'Ver', 'Acceder al POS'),
    (@pos_id, 'create_order', 'Crear Orden', 'Crear órdenes desde el POS'),
    (@pos_id, 'apply_discount', 'Aplicar Descuento', 'Aplicar descuentos en ventas')

-- Ajustes
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@ajustes_id, 'view', 'Ver', 'Ver ajustes de inventario'),
    (@ajustes_id, 'create', 'Crear', 'Crear ajustes de inventario'),
    (@ajustes_id, 'edit', 'Editar', 'Editar ajustes de inventario')

-- Conteos
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@conteos_id, 'view', 'Ver', 'Ver conteos de inventario'),
    (@conteos_id, 'create', 'Crear', 'Crear conteos de inventario'),
    (@conteos_id, 'edit', 'Editar', 'Editar conteos de inventario')

-- Admin
INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion])
VALUES 
    (@admin_id, 'manage_roles', 'Administrar Roles', 'Administrar roles y permisos'),
    (@admin_id, 'manage_users', 'Administrar Usuarios', 'Administrar usuarios del sistema')
GO
```

## 5. Tabla de Permisos por Rol

```sql
CREATE TABLE [dbo].[RolesPermisos](
    [rolperm_id] [int] IDENTITY(1,1) NOT NULL,
    [rol_id] [int] NOT NULL,
    [mod_id] [int] NOT NULL,
    [acceso] [bit] NOT NULL DEFAULT 0,
    [fecha_creacion] [datetime] NOT NULL DEFAULT GETDATE(),
    [fecha_modificacion] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
    [rolperm_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_RolesPermisos_Roles] FOREIGN KEY ([rol_id]) REFERENCES [dbo].[Roles] ([rol_id]),
CONSTRAINT [FK_RolesPermisos_Modulos] FOREIGN KEY ([mod_id]) REFERENCES [dbo].[Modulos] ([mod_id]),
CONSTRAINT [UK_RolesPermisos_RolMod] UNIQUE NONCLUSTERED ([rol_id], [mod_id] ASC)
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_RolesPermisos_RolId] ON [dbo].[RolesPermisos]
(
    [rol_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
```

## 6. Tabla de Permisos de Acciones por Rol

```sql
CREATE TABLE [dbo].[RolesPermisosAcciones](
    [rolpermacc_id] [int] IDENTITY(1,1) NOT NULL,
    [rolperm_id] [int] NOT NULL,
    [acc_id] [int] NOT NULL,
    [permitido] [bit] NOT NULL DEFAULT 0,
PRIMARY KEY CLUSTERED 
(
    [rolpermacc_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
CONSTRAINT [FK_RolesPermisosAcciones_RolesPermisos] FOREIGN KEY ([rolperm_id]) REFERENCES [dbo].[RolesPermisos] ([rolperm_id]),
CONSTRAINT [FK_RolesPermisosAcciones_Acciones] FOREIGN KEY ([acc_id]) REFERENCES [dbo].[Acciones] ([acc_id]),
CONSTRAINT [UK_RolesPermisosAcciones_PermAcc] UNIQUE NONCLUSTERED ([rolperm_id], [acc_id] ASC)
) ON [PRIMARY]
GO

CREATE NONCLUSTERED INDEX [IX_RolesPermisosAcciones_RolPermId] ON [dbo].[RolesPermisosAcciones]
(
    [rolperm_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
```

## 7. Procedimiento para asignar todos los permisos al rol Administrador

```sql
-- Procedimiento para asignar todos los permisos al rol de Administrador
DECLARE @admin_rol_id INT
SELECT @admin_rol_id = rol_id FROM [dbo].[Roles] WHERE rol_nombre = 'Administrador'

-- Dar acceso a todos los módulos
INSERT INTO [dbo].[RolesPermisos] ([rol_id], [mod_id], [acceso])
SELECT @admin_rol_id, mod_id, 1 FROM [dbo].[Modulos]

-- Dar permiso a todas las acciones
INSERT INTO [dbo].[RolesPermisosAcciones] ([rolperm_id], [acc_id], [permitido])
SELECT rp.rolperm_id, a.acc_id, 1
FROM [dbo].[RolesPermisos] rp
JOIN [dbo].[Acciones] a ON a.mod_id = rp.mod_id
WHERE rp.rol_id = @admin_rol_id
GO
```

## 8. Vista para facilitar la consulta de permisos

```sql
CREATE VIEW [dbo].[vw_UsuarioPermisos] AS
SELECT 
    u.usu_cod,
    u.usu_nom,
    r.rol_id,
    r.rol_nombre,
    m.mod_codigo,
    m.mod_nombre,
    rp.acceso AS modulo_acceso,
    a.acc_codigo,
    a.acc_nombre,
    rpa.permitido AS accion_permitida
FROM 
    [dbo].[Usuarios] u
JOIN 
    [dbo].[UsuariosRoles] ur ON u.usu_cod = ur.usu_cod
JOIN 
    [dbo].[Roles] r ON ur.rol_id = r.rol_id
JOIN 
    [dbo].[RolesPermisos] rp ON r.rol_id = rp.rol_id
JOIN 
    [dbo].[Modulos] m ON rp.mod_id = m.mod_id
JOIN 
    [dbo].[RolesPermisosAcciones] rpa ON rp.rolperm_id = rpa.rolperm_id
JOIN 
    [dbo].[Acciones] a ON rpa.acc_id = a.acc_id
WHERE 
    r.rol_activo = 1 AND m.mod_activo = 1 AND rp.acceso = 1 AND rpa.permitido = 1
GO
```

## 9. Función para obtener permisos en formato JSON

```sql
CREATE FUNCTION [dbo].[fn_GetUserPermissionsJSON] (@usu_cod VARCHAR(100))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @result NVARCHAR(MAX) = '{'
    
    -- Obtener módulos y sus permisos
    SELECT @result = @result + 
        CASE WHEN @result = '{' THEN '' ELSE ',' END +
        '"' + m.mod_codigo + '":' +
        '{' +
        '"access":1,' +
        '"actions":[' +
        STUFF((
            SELECT ',' + '"' + a.acc_codigo + '"'
            FROM [dbo].[vw_UsuarioPermisos] p
            JOIN [dbo].[Acciones] a ON p.acc_codigo = a.acc_codigo
            WHERE p.usu_cod = @usu_cod 
            AND p.mod_codigo = m.mod_codigo
            FOR XML PATH('')
        ), 1, 1, '') +
        ']}'
    FROM [dbo].[vw_UsuarioPermisos] p
    JOIN [dbo].[Modulos] m ON p.mod_codigo = m.mod_codigo
    WHERE p.usu_cod = @usu_cod
    GROUP BY m.mod_codigo
    
    SET @result = @result + '}'
    
    RETURN @result
END
GO
```

## 10. Script para asignar rol de Administrador al usuario admin

```sql
-- Obtener el ID del rol Administrador
DECLARE @admin_rol_id INT
SELECT @admin_rol_id = rol_id 
FROM [dbo].[Roles] 
WHERE rol_nombre = 'Administrador'

-- Insertar la asignación del rol
INSERT INTO [dbo].[UsuariosRoles] ([usu_cod], [rol_id])
VALUES ('admin', @admin_rol_id)
GO
```

## Notas y Recomendaciones:

1. **Consideraciones de migración**:
   - No se modifica la tabla de Usuarios existente para minimizar el impacto
   - Se utiliza el campo `usu_cod` como clave foránea para mantener la integridad

2. **Estructura de los datos**:
   - La estructura permite mantener roles con permisos a módulos completos o a acciones específicas
   - El diseño facilita consultas rápidas al separar el acceso al módulo de los permisos a acciones específicas

3. **Rendimiento**:
   - Se incluyen índices en las columnas frecuentemente consultadas
   - La vista y función para consultar permisos optimizan el tiempo de desarrollo

4. **Pasos siguientes**:
   - Asignar al menos un usuario al rol Administrador para comenzar las pruebas
   - Implementar las API necesarias para administrar roles y permisos
   - Integrar con el frontend desarrollado

5. **Seguridad**:
   - El diseño soporta el principio de privilegio mínimo
   - Es compatible con la implementación de auditoría de cambios

## Diagrama de Relaciones

```
Usuarios (1) ------- (*) UsuariosRoles (*) ------- (1) Roles
                                                     |
                                                     |
                                                     |
                                                     v
                                                RolesPermisos
                                                     |
                                    +----------------+----------------+
                                    |                                 |
                                    v                                 v
                                Modulos                       RolesPermisosAcciones
                                    |                                 |
                                    |                                 |
                                    v                                 v
                                Acciones -----------> (referenciada) Acciones
``` 