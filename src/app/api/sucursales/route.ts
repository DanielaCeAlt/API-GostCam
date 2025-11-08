import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    // Intentar obtener sucursales basándose en los datos reales de la tabla equipo
    let sucursales = [];
    
    try {
      // Obtener las posiciones distintas de los equipos existentes
      const posicionesQuery = `
        SELECT DISTINCT idPosicion, COUNT(*) as cantidad
        FROM equipo 
        WHERE idPosicion IS NOT NULL 
        AND (eliminado IS NULL OR eliminado = 0)
        GROUP BY idPosicion
        ORDER BY idPosicion
      `;
      
      const posicionesData = await executeQuery(posicionesQuery);
      
      if (posicionesData && posicionesData.length > 0) {
        // Mapear las posiciones reales de la base de datos a nombres de sucursal
        sucursales = posicionesData.map((p: any) => {
          const posId = p.idPosicion;
          let nombre = 'Sucursal General';
          
          // Mapear IDs de posición a nombres de sucursal lógicos
          if (posId === 1) nombre = 'Centro Principal';
          else if (posId === 2) nombre = 'Sucursal Norte';
          else if (posId === 3) nombre = 'Sucursal Sur';
          else if (posId === 4) nombre = 'Almacén Central';
          else if (posId === 5) nombre = 'Sede Administrativa';
          else nombre = `Posición ${posId}`;
          
          return { 
            id: nombre, 
            nombre: nombre,
            posicionId: posId,
            equiposAsignados: p.cantidad 
          };
        });
        
        console.log('Sucursales obtenidas de BD:', sucursales);
      }
    } catch (error) {
      console.warn('No se pudieron obtener sucursales de equipos:', error);
    }

    // Si no hay sucursales de la BD, usar valores por defecto
    if (sucursales.length === 0) {
      sucursales = [
        { id: 'Centro Principal', nombre: 'Centro Principal', posicionId: 1 },
        { id: 'Sucursal Norte', nombre: 'Sucursal Norte', posicionId: 2 },
        { id: 'Sucursal Sur', nombre: 'Sucursal Sur', posicionId: 3 },
        { id: 'Almacén Central', nombre: 'Almacén Central', posicionId: 4 },
        { id: 'General', nombre: 'General', posicionId: null }
      ];
    }

    return NextResponse.json({
      success: true,
      data: sucursales
    });

  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener sucursales',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}