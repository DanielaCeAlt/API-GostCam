import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function POST() {
  try {
    console.log('🔧 Agregando campos de eliminación lógica...');

    // Verificar si ya existen los campos
    const existingColumns = await executeQuery(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'gostcam' 
      AND TABLE_NAME = 'equipo' 
      AND COLUMN_NAME IN ('eliminado', 'fechaEliminacion', 'usuarioEliminacion')
    `);

    if (existingColumns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Los campos de eliminación lógica ya existen',
        data: existingColumns
      });
    }

    // Agregar campo eliminado
    await executeQuery(`
      ALTER TABLE equipo 
      ADD COLUMN eliminado TINYINT(1) DEFAULT 0 COMMENT 'Eliminación lógica: 0=Activo, 1=Eliminado'
    `);

    // Agregar campo fechaEliminacion  
    await executeQuery(`
      ALTER TABLE equipo 
      ADD COLUMN fechaEliminacion DATETIME NULL COMMENT 'Fecha y hora de eliminación lógica'
    `);

    // Agregar campo usuarioEliminacion
    await executeQuery(`
      ALTER TABLE equipo 
      ADD COLUMN usuarioEliminacion VARCHAR(100) NULL COMMENT 'Usuario que realizó la eliminación'
    `);

    // Crear índice para optimizar consultas
    await executeQuery(`
      CREATE INDEX idx_equipo_eliminado ON equipo(eliminado)
    `);

    // Verificar estructura actualizada
    const updatedColumns = await executeQuery(`
      DESCRIBE equipo
    `);

    console.log('✅ Campos de eliminación lógica agregados exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Campos de eliminación lógica agregados exitosamente',
      data: {
        newFields: ['eliminado', 'fechaEliminacion', 'usuarioEliminacion'],
        tableStructure: updatedColumns
      }
    });

  } catch (error) {
    console.error('❌ Error agregando campos de eliminación lógica:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}