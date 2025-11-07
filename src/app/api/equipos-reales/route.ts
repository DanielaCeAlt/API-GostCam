import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Obtener los últimos equipos con sus posiciones reales
    const equipos = await executeQuery(`
      SELECT 
        e.no_serie, 
        e.nombreEquipo,
        e.idPosicion,
        p.NombrePosicion,
        p.idCentro,
        s.Sucursal
      FROM Equipo e
      LEFT JOIN posicionequipo p ON e.idPosicion = p.idPosicion
      LEFT JOIN sucursales s ON p.idCentro = s.idCentro
      ORDER BY e.fechaAlta DESC
      LIMIT 10
    `);

    return NextResponse.json({
      success: true,
      data: equipos,
      message: 'Equipos con sucursales reales obtenidos'
    });

  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}