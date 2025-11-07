-- Script para agregar campo de eliminación lógica a la tabla equipo
-- Este campo permitirá marcar registros como eliminados sin borrarlos físicamente

ALTER TABLE equipo 
ADD COLUMN eliminado TINYINT(1) DEFAULT 0 COMMENT 'Eliminación lógica: 0=Activo, 1=Eliminado';

ALTER TABLE equipo 
ADD COLUMN fechaEliminacion DATETIME NULL COMMENT 'Fecha y hora de eliminación lógica';

ALTER TABLE equipo 
ADD COLUMN usuarioEliminacion VARCHAR(100) NULL COMMENT 'Usuario que realizó la eliminación';

-- Crear índice para optimizar consultas de registros activos
CREATE INDEX idx_equipo_eliminado ON equipo(eliminado);

-- Verificar la estructura actualizada
DESCRIBE equipo;