import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Obtener estructura de la tabla Equipo
    const columns = await executeQuery(`
      DESCRIBE Equipo
    `);

    return NextResponse.json({
      success: true,
      data: columns,
      message: 'Estructura de tabla Equipo obtenida'
    });

  } catch (error) {
    console.error('Error obteniendo estructura de tabla:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}