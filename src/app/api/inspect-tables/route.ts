import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Obtener lista de tablas
    const tables = await executeQuery<{TABLE_NAME: string}>(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'gostcam'
      ORDER BY TABLE_NAME
    `);

    // Obtener estructura de tabla tipoequipo
    const tipoequipoColumns = await executeQuery<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_KEY: string;
    }>(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'tipoequipo'
      ORDER BY ORDINAL_POSITION
    `);

    // Obtener estructura de tabla estatusequipo
    const estatusequipoColumns = await executeQuery<{
      COLUMN_NAME: string;
      DATA_TYPE: string;
      IS_NULLABLE: string;
      COLUMN_KEY: string;
    }>(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'estatusequipo'
      ORDER BY ORDINAL_POSITION
    `);

    // Verificar si existe la tabla estatusmovimiento
    const estatusmovimientoExists = await executeQuery<{count: number}>(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'gostcam' AND TABLE_NAME = 'estatusmovimiento'
    `);

    return NextResponse.json({
      success: true,
      data: {
        tables: tables.map(t => t.TABLE_NAME),
        tipoequipoColumns,
        estatusequipoColumns,
        estatusmovimientoExists: estatusmovimientoExists[0]?.count > 0
      }
    });

  } catch (error) {
    console.error('Error inspeccionando tablas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al inspeccionar la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}