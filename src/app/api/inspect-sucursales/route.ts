import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Obtener estructura de la tabla sucursales
    const sucursalesColumns = await executeQuery(`DESCRIBE sucursales`);
    
    // Obtener estructura de la tabla posicionequipo
    const posicionColumns = await executeQuery(`DESCRIBE posicionequipo`);

    // Obtener datos de sucursales para ver la relación
    const sucursalesData = await executeQuery(`SELECT * FROM sucursales LIMIT 10`);

    return NextResponse.json({
      success: true,
      data: {
        sucursalesColumns,
        posicionColumns,
        sucursalesData
      },
      message: 'Estructura de tablas relacionadas obtenida'
    });

  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}