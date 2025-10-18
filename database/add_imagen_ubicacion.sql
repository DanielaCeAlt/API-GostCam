-- =============================================
-- SCRIPT: Agregar campo imagen_ubicacion a tabla Equipo
-- Descripción: Añade un campo para almacenar la imagen de ubicación de equipos
-- Versión: 1.0
-- Fecha: Diciembre 2024
-- =============================================

USE [GostCAM]
GO

-- Verificar si la columna ya existe
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Equipo') 
    AND name = 'imagen_ubicacion'
)
BEGIN
    -- Agregar la columna imagen_ubicacion
    ALTER TABLE [dbo].[Equipo]
    ADD [imagen_ubicacion] [TEXT] NULL
    
    PRINT 'Campo imagen_ubicacion agregado exitosamente a la tabla Equipo'
END
ELSE
BEGIN
    PRINT 'El campo imagen_ubicacion ya existe en la tabla Equipo'
END
GO

-- Opcional: Agregar índice para mejorar rendimiento si se necesita buscar por este campo
-- Comentado por defecto ya que TEXT no se puede indexar directamente
/*
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE object_id = OBJECT_ID('Equipo') 
    AND name = 'IX_Equipo_imagen_ubicacion'
)
BEGIN
    CREATE INDEX IX_Equipo_imagen_ubicacion 
    ON [dbo].[Equipo] ([imagen_ubicacion])
    PRINT 'Índice IX_Equipo_imagen_ubicacion creado exitosamente'
END
*/

-- Verificar la estructura actualizada
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Equipo'
AND COLUMN_NAME = 'imagen_ubicacion'

PRINT 'Script ejecutado correctamente'
GO