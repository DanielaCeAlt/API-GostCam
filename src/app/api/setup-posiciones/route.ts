import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST() {
  try {
    // Crear tabla de posiciones
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS posiciones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          sucursalId VARCHAR(50) NOT NULL,
          descripcion TEXT,
          tipo ENUM('Fija', 'Temporal', 'Almacen', 'Oficina', 'Produccion') DEFAULT 'Fija',
          activa BOOLEAN DEFAULT TRUE,
          fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          fechaModificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Verificar si ya hay datos
    const existingData = await executeQuery('SELECT COUNT(*) as count FROM posiciones');
    const hasData = existingData && existingData[0] && existingData[0].count > 0;

    if (!hasData) {
      // Insertar posiciones iniciales
      const posicionesIniciales = [
        ['Recepción', 'SUC001', 'Área de recepción principal', 'Fija'],
        ['Oficina Administrativa', 'SUC001', 'Área administrativa principal', 'Oficina'],
        ['Almacén General', 'SUC001', 'Almacén principal de equipos', 'Almacen'],
        ['Sala de Juntas', 'SUC001', 'Sala de reuniones ejecutiva', 'Oficina'],
        ['Entrada Principal', 'SUC001', 'Acceso principal del edificio', 'Fija'],
        
        ['Recepción', 'SUC002', 'Área de recepción sucursal 2', 'Fija'],
        ['Oficina Local', 'SUC002', 'Oficina local sucursal 2', 'Oficina'],
        ['Almacén Local', 'SUC002', 'Almacén local sucursal 2', 'Almacen'],
        ['Área de Trabajo', 'SUC002', 'Área de trabajo general', 'Produccion'],
        
        ['Recepción', 'SUC003', 'Área de recepción sucursal 3', 'Fija'],
        ['Oficina Gerencial', 'SUC003', 'Oficina gerencial sucursal 3', 'Oficina'],
        ['Depósito', 'SUC003', 'Depósito de equipos', 'Almacen'],
        
        ['Sin Asignar', 'GENERAL', 'Ubicación temporal sin asignar', 'Temporal'],
        ['En Tránsito', 'GENERAL', 'Equipo en proceso de traslado', 'Temporal'],
        ['Mantenimiento', 'GENERAL', 'Área de mantenimiento', 'Temporal']
      ];

      for (const posicion of posicionesIniciales) {
        await executeQuery(
          'INSERT INTO posiciones (nombre, sucursalId, descripcion, tipo) VALUES (?, ?, ?, ?)',
          posicion
        );
      }
    }

    // Verificar la tabla creada
    const posiciones = await executeQuery('SELECT * FROM posiciones ORDER BY sucursalId, nombre');

    return NextResponse.json({
      success: true,
      message: 'Tabla de posiciones creada exitosamente',
      data: {
        totalPosiciones: posiciones?.length || 0,
        posiciones: posiciones || []
      }
    });

  } catch (error) {
    console.error('Error creando tabla de posiciones:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al crear tabla de posiciones',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Verificar si la tabla existe
    const tables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'posiciones'
    `);

    const tableExists = tables && tables.length > 0;

    if (tableExists) {
      const posiciones = await executeQuery('SELECT * FROM posiciones ORDER BY sucursalId, nombre');
      return NextResponse.json({
        success: true,
        tableExists: true,
        data: posiciones || []
      });
    } else {
      return NextResponse.json({
        success: true,
        tableExists: false,
        message: 'La tabla posiciones no existe. Use POST para crearla.'
      });
    }

  } catch (error) {
    console.error('Error verificando tabla de posiciones:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al verificar tabla de posiciones',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}