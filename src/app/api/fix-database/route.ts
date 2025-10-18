import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    const fixes: string[] = [];

    // 1. Verificar si existe la tabla estatusmovimiento
    const estatusmovimientoExists = await executeQuery<{count: number}>(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'estatusmovimiento'
    `);

    if (estatusmovimientoExists[0]?.count === 0) {
      // Crear tabla estatusmovimiento
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS estatusmovimiento (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50) NOT NULL UNIQUE,
          descripcion TEXT,
          activo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Insertar datos básicos
      await executeQuery(`
        INSERT INTO estatusmovimiento (nombre, descripcion) VALUES
        ('ABIERTO', 'Movimiento pendiente de completar'),
        ('EN_PROGRESO', 'Movimiento en proceso'),
        ('COMPLETADO', 'Movimiento finalizado exitosamente'),
        ('CANCELADO', 'Movimiento cancelado'),
        ('PAUSADO', 'Movimiento temporalmente pausado')
        ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
      `);

      fixes.push("✅ Tabla 'estatusmovimiento' creada con datos iniciales");
    } else {
      fixes.push("ℹ️ Tabla 'estatusmovimiento' ya existe");
    }

    // 2. Verificar estructura de tabla tipoequipo
    const tipoequipoColumns = await executeQuery<{
      COLUMN_NAME: string;
    }>(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'tipoequipo'
      ORDER BY ORDINAL_POSITION
    `);

    const hasIdColumn = tipoequipoColumns.some(col => col.COLUMN_NAME === 'id');
    
    if (!hasIdColumn) {
      // Verificar si tiene otra columna que pueda servir como ID
      const allColumns = tipoequipoColumns.map(col => col.COLUMN_NAME);
      
      if (allColumns.includes('idTipoEquipo')) {
        fixes.push("ℹ️ Tabla 'tipoequipo' usa 'idTipoEquipo' como ID principal");
      } else {
        // Añadir columna id si no existe
        await executeQuery(`
          ALTER TABLE tipoequipo 
          ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST
        `);
        fixes.push("✅ Columna 'id' añadida a tabla 'tipoequipo'");
      }
    } else {
      fixes.push("ℹ️ Tabla 'tipoequipo' ya tiene columna 'id'");
    }

    // 3. Verificar otras tablas importantes
    const tablesCheck = await executeQuery<{TABLE_NAME: string}>(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'gostcam' 
      AND TABLE_NAME IN ('tipomovimiento', 'estatusequipo', 'movimientoinventario')
      ORDER BY TABLE_NAME
    `);

    const existingTables = tablesCheck.map(t => t.TABLE_NAME);
    const requiredTables = ['tipomovimiento', 'estatusequipo', 'movimientoinventario'];
    
    for (const table of requiredTables) {
      if (!existingTables.includes(table)) {
        fixes.push(`⚠️ Tabla '${table}' no encontrada - necesita ser creada`);
      } else {
        fixes.push(`ℹ️ Tabla '${table}' existe`);
      }
    }

    // 4. Crear tabla tipomovimiento si no existe
    if (!existingTables.includes('tipomovimiento')) {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS tipomovimiento (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50) NOT NULL UNIQUE,
          descripcion TEXT,
          activo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await executeQuery(`
        INSERT INTO tipomovimiento (nombre, descripcion) VALUES
        ('MANTENIMIENTO', 'Movimiento para mantenimiento de equipos'),
        ('TRANSFERENCIA', 'Movimiento para transferencia entre ubicaciones'),
        ('ASIGNACION', 'Asignación de equipo a usuario'),
        ('RETIRO', 'Retiro de equipo del servicio')
        ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
      `);

      fixes.push("✅ Tabla 'tipomovimiento' creada con datos iniciales");
    }

    return NextResponse.json({
      success: true,
      message: "Estructura de base de datos verificada y reparada",
      fixes
    });

  } catch (error) {
    console.error('Error reparando base de datos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al reparar la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    // Forzar recreación de tablas faltantes
    const fixes: string[] = [];

    // Recrear estatusmovimiento
    await executeQuery(`DROP TABLE IF EXISTS estatusmovimiento`);
    await executeQuery(`
      CREATE TABLE estatusmovimiento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      INSERT INTO estatusmovimiento (nombre, descripcion) VALUES
      ('ABIERTO', 'Movimiento pendiente de completar'),
      ('EN_PROGRESO', 'Movimiento en proceso'),
      ('COMPLETADO', 'Movimiento finalizado exitosamente'),
      ('CANCELADO', 'Movimiento cancelado'),
      ('PAUSADO', 'Movimiento temporalmente pausado')
    `);

    fixes.push("🔄 Tabla 'estatusmovimiento' recreada completamente");

    // Recrear tipomovimiento
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS tipomovimiento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await executeQuery(`
      INSERT INTO tipomovimiento (nombre, descripcion) VALUES
      ('MANTENIMIENTO', 'Movimiento para mantenimiento de equipos'),
      ('TRANSFERENCIA', 'Movimiento para transferencia entre ubicaciones'),
      ('ASIGNACION', 'Asignación de equipo a usuario'),
      ('RETIRO', 'Retiro de equipo del servicio')
      ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion)
    `);

    fixes.push("🔄 Tabla 'tipomovimiento' verificada y actualizada");

    return NextResponse.json({
      success: true,
      message: "Base de datos reparada completamente",
      fixes
    });

  } catch (error) {
    console.error('Error en reparación forzada:', error);
    return NextResponse.json({
      success: false,
      error: 'Error en la reparación forzada',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}