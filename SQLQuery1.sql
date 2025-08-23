CREATE TABLE [dbo].[promociones](
    [pro_sec] [decimal](18, 0) IDENTITY(1,1) NOT NULL,
    [pro_codigo] [varchar](20) NOT NULL,
    [pro_descripcion] [varchar](200) NOT NULL,
    [pro_fecha_inicio] [datetime] NOT NULL,
    [pro_fecha_fin] [datetime] NOT NULL,
    [pro_activa] [char](1) DEFAULT 'S',               -- S/N
    [pro_tipo] [varchar](20) DEFAULT 'OFERTA',        -- OFERTA, DESCUENTO, etc.
    [pro_observaciones] [varchar](500) NULL,
    [pro_fecha_creacion] [datetime] DEFAULT GETDATE(),
    [pro_usuario_creacion] [varchar](50) NULL,
    [pro_fecha_modificacion] [datetime] NULL,
    [pro_usuario_modificacion] [varchar](50) NULL,
    PRIMARY KEY CLUSTERED ([pro_sec] ASC)
);

-- Tabla detalle de promociones (artículos)
CREATE TABLE [dbo].[promociones_detalle](
    [pro_det_sec] [decimal](18, 0) IDENTITY(1,1) NOT NULL,
    [pro_sec] [decimal](18, 0) NOT NULL,
    [art_sec] [varchar](30) NOT NULL,
    [pro_det_precio_oferta] [decimal](17, 2) NOT NULL,
    [pro_det_descuento_porcentaje] [decimal](5, 2) NULL,
    [pro_det_observaciones] [varchar](200) NULL,
    [pro_det_fecha_creacion] [datetime] DEFAULT GETDATE(),
    [pro_det_usuario_creacion] [varchar](50) NULL,
    PRIMARY KEY CLUSTERED ([pro_det_sec] ASC)
);

-- Índices para optimización
CREATE NONCLUSTERED INDEX IDX_Promociones_Codigo
ON dbo.promociones (pro_codigo);

CREATE NONCLUSTERED INDEX IDX_Promociones_Fechas
ON dbo.promociones (pro_fecha_inicio, pro_fecha_fin, pro_activa);

CREATE NONCLUSTERED INDEX IDX_PromocionesDetalle_ProSec
ON dbo.promociones_detalle (pro_sec);

CREATE NONCLUSTERED INDEX IDX_PromocionesDetalle_ArtSec
ON dbo.promociones_detalle (art_sec);

-- Foreign keys
ALTER TABLE [dbo].[promociones_detalle] 
ADD CONSTRAINT [FK_PromocionesDetalle_Promociones] 
FOREIGN KEY([pro_sec]) REFERENCES [dbo].[promociones] ([pro_sec]);

ALTER TABLE [dbo].[promociones_detalle] 
ADD CONSTRAINT [FK_PromocionesDetalle_Articulos] 
FOREIGN KEY([art_sec]) REFERENCES [dbo].[articulos] ([art_sec]);


/*2222222222222222222222222222222*/

-- Script para agregar campo estado a promociones_detalle
-- Ejecutar este script para actualizar la estructura de la base de datos

-- Agregar campo estado con valor por defecto 'A' (Activo)
ALTER TABLE dbo.promociones_detalle 
ADD pro_det_estado CHAR(1) DEFAULT 'A';

-- Agregar constraint para validar valores permitidos
ALTER TABLE dbo.promociones_detalle 
ADD CONSTRAINT CK_promociones_detalle_estado 
CHECK (pro_det_estado IN ('A', 'I'));

-- Agregar campos de auditoría para modificaciones
ALTER TABLE dbo.promociones_detalle 
ADD pro_det_fecha_modificacion DATETIME NULL,
    pro_det_usuario_modificacion VARCHAR(50) NULL;

-- Actualizar registros existentes para que tengan estado 'A'
UPDATE dbo.promociones_detalle 
SET pro_det_estado = 'A' 
WHERE pro_det_estado IS NULL;

-- Crear índice para mejorar performance en consultas por estado
CREATE INDEX IX_promociones_detalle_estado 
ON dbo.promociones_detalle (pro_det_estado);

-- Verificar la estructura actualizada
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'promociones_detalle' 
AND TABLE_SCHEMA = 'dbo'
ORDER BY ORDINAL_POSITION; 


/*333333333333333333333333333333333333333333333333333333333333*/

-- =============================================
-- SCRIPT PARA AGREGAR MÓDULO DE PROMOCIONES
-- =============================================

-- 1. Insertar el módulo de promociones
IF NOT EXISTS (SELECT 1 FROM [dbo].[Modulos] WHERE mod_codigo = 'promociones')
BEGIN
    INSERT INTO [dbo].[Modulos] ([mod_codigo], [mod_nombre], [mod_descripcion]) 
    VALUES ('promociones', 'Promociones', 'Gestión de promociones y descuentos')
    PRINT 'Módulo de promociones creado exitosamente'
END
ELSE
BEGIN
    PRINT 'El módulo de promociones ya existe'
END

-- 2. Obtener el ID del módulo de promociones
DECLARE @promociones_mod_id INT
SELECT @promociones_mod_id = mod_id FROM [dbo].[Modulos] WHERE mod_codigo = 'promociones'

-- 3. Insertar acciones para el módulo de promociones
IF NOT EXISTS (SELECT 1 FROM [dbo].[Acciones] WHERE mod_id = @promociones_mod_id AND acc_codigo = 'view')
BEGIN
    INSERT INTO [dbo].[Acciones] ([mod_id], [acc_codigo], [acc_nombre], [acc_descripcion]) 
    VALUES 
        (@promociones_mod_id, 'view', 'Ver', 'Ver lista de promociones'),
        (@promociones_mod_id, 'create', 'Crear', 'Crear nuevas promociones'),
        (@promociones_mod_id, 'edit', 'Editar', 'Editar promociones existentes'),
        (@promociones_mod_id, 'delete', 'Eliminar', 'Eliminar promociones')
    PRINT 'Acciones del módulo de promociones creadas exitosamente'
END
ELSE
BEGIN
    PRINT 'Las acciones del módulo de promociones ya existen'
END

-- 4. Obtener el ID del rol Administrador
DECLARE @admin_rol_id INT
SELECT @admin_rol_id = rol_id FROM [dbo].[Roles] WHERE rol_nombre = 'Administrador'

-- 5. Dar acceso al módulo de promociones al rol Administrador
IF NOT EXISTS (SELECT 1 FROM [dbo].[RolesPermisos] WHERE rol_id = @admin_rol_id AND mod_id = @promociones_mod_id)
BEGIN
    INSERT INTO [dbo].[RolesPermisos] ([rol_id], [mod_id], [acceso])
    VALUES (@admin_rol_id, @promociones_mod_id, 1)
    PRINT 'Acceso al módulo de promociones asignado al rol Administrador'
END
ELSE
BEGIN
    PRINT 'El rol Administrador ya tiene acceso al módulo de promociones'
END

-- 6. Obtener el ID del permiso de rol-módulo
DECLARE @rolperm_id INT
SELECT @rolperm_id = rolperm_id FROM [dbo].[RolesPermisos] 
WHERE rol_id = @admin_rol_id AND mod_id = @promociones_mod_id

-- 7. Dar permiso a todas las acciones del módulo de promociones
INSERT INTO [dbo].[RolesPermisosAcciones] ([rolperm_id], [acc_id], [permitido])
SELECT @rolperm_id, acc_id, 1
FROM [dbo].[Acciones] 
WHERE mod_id = @promociones_mod_id
AND NOT EXISTS (
    SELECT 1 FROM [dbo].[RolesPermisosAcciones] rpa 
    JOIN [dbo].[RolesPermisos] rp ON rpa.rolperm_id = rp.rolperm_id
    WHERE rp.rol_id = @admin_rol_id 
    AND rpa.acc_id = [dbo].[Acciones].acc_id
)

PRINT 'Permisos de acciones asignados al rol Administrador para el módulo de promociones'
PRINT 'Script completado exitosamente'
GO