-- Crear tabla de posiciones para el sistema de ubicaciones
CREATE TABLE IF NOT EXISTS posiciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sucursalId VARCHAR(50) NOT NULL,
    descripcion TEXT,
    tipo ENUM('Fija', 'Temporal', 'Almacen', 'Oficina', 'Produccion') DEFAULT 'Fija',
    activa BOOLEAN DEFAULT TRUE,
    fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechaModificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar posiciones iniciales para cada sucursal
INSERT INTO posiciones (nombre, sucursalId, descripcion, tipo) VALUES
-- Sucursales principales
('Recepción', 'SUC001', 'Área de recepción principal', 'Fija'),
('Oficina Administrativa', 'SUC001', 'Área administrativa principal', 'Oficina'),
('Almacén General', 'SUC001', 'Almacén principal de equipos', 'Almacen'),
('Sala de Juntas', 'SUC001', 'Sala de reuniones ejecutiva', 'Oficina'),
('Entrada Principal', 'SUC001', 'Acceso principal del edificio', 'Fija'),

('Recepción', 'SUC002', 'Área de recepción sucursal 2', 'Fija'),
('Oficina Local', 'SUC002', 'Oficina local sucursal 2', 'Oficina'),
('Almacén Local', 'SUC002', 'Almacén local sucursal 2', 'Almacen'),
('Área de Trabajo', 'SUC002', 'Área de trabajo general', 'Produccion'),

('Recepción', 'SUC003', 'Área de recepción sucursal 3', 'Fija'),
('Oficina Gerencial', 'SUC003', 'Oficina gerencial sucursal 3', 'Oficina'),
('Depósito', 'SUC003', 'Depósito de equipos', 'Almacen'),

-- Posiciones genéricas para sucursales sin configuración específica
('Sin Asignar', 'GENERAL', 'Ubicación temporal sin asignar', 'Temporal'),
('En Tránsito', 'GENERAL', 'Equipo en proceso de traslado', 'Temporal'),
('Mantenimiento', 'GENERAL', 'Área de mantenimiento', 'Temporal');