import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Obtener todas las posiciones con sus sucursales
    const posiciones = await executeQuery(`
      SELECT p.idPosicion, p.idCentro, p.NombrePosicion, s.Sucursal
      FROM posicionequipo p 
      LEFT JOIN sucursales s ON p.idCentro = s.idCentro
      ORDER BY s.Sucursal, p.NombrePosicion
    `);

    return NextResponse.json({
      success: true,
      data: posiciones,
      message: 'Posiciones disponibles obtenidas'
    });

  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}