import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipos,
      sucursalOrigen,
      sucursalDestino,
      posicionDestino,
      tipoMovimiento = 'TRASLADO',
      observaciones = '',
      responsableTraslado,
      motivo = ''
    } = body;

    console.log('Datos de transferencia recibidos:', { equipos, sucursalDestino, responsableTraslado });

    if (!equipos || !Array.isArray(equipos) || equipos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debe especificar al menos un equipo para transferir'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!sucursalDestino) {
      return NextResponse.json({
        success: false,
        error: 'Sucursal destino es requerida'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!responsableTraslado) {
      return NextResponse.json({
        success: false,
        error: 'Responsable del traslado es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    const equiposStr = equipos.map(() => '?').join(',');
    const equiposQuery = `SELECT no_serie, nombreEquipo, idPosicion FROM equipo WHERE no_serie IN (${equiposStr})`;
    
    const equiposResult = await executeQuery(equiposQuery, equipos);
    
    if (equiposResult.length !== equipos.length) {
      return NextResponse.json({
        success: false,
        error: 'Algunos equipos no fueron encontrados'
      } as ApiResponse<any>, { status: 400 });
    }

    const transferenciasRealizadas = [];
    
    for (const equipo of equiposResult) {
      try {
        // Actualizar la posición del equipo
        const updateQuery = `UPDATE equipo SET idPosicion = ? WHERE no_serie = ?`;
        
        await executeQuery(updateQuery, [
          posicionDestino || 1, // Usar ID de posición, por defecto 1
          equipo.no_serie
        ]);

        transferenciasRealizadas.push({
          no_serie: equipo.no_serie,
          nombreEquipo: equipo.nombreEquipo,
          sucursalNueva: sucursalDestino,
          areaNueva: posicionDestino
        });

      } catch (error) {
        console.error('Error actualizando equipo:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${transferenciasRealizadas.length} equipo(s) transferido(s) exitosamente`,
      data: { transferenciasRealizadas }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error en transferencia:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}
