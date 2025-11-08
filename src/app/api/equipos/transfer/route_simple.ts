// =============================================
// API: TRANSFERENCIAS DE EQUIPOS (SIMPLIFICADA)
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipos, // Array de números de serie
      sucursalOrigen,
      sucursalDestino,
      posicionDestino,
      tipoMovimiento = 'TRASLADO',
      observaciones = '',
      fechaProgramada = null,
      responsableTraslado,
      motivo = ''
    } = body;

    console.log('Datos de transferencia recibidos:', {
      equipos,
      sucursalOrigen,
      sucursalDestino,
      posicionDestino,
      responsableTraslado
    });

    // Validaciones básicas
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

    // Verificar que todos los equipos existen
    const equiposStr = equipos.map(() => '?').join(',');
    const equiposQuery = `
      SELECT no_serie, nombreEquipo, SucursalActual, AreaActual
      FROM equipos 
      WHERE no_serie IN (${equiposStr})
      AND (eliminado = 0 OR eliminado IS NULL)
    `;
    
    const equiposResult = await executeQuery(equiposQuery, equipos);
    
    if (equiposResult.length !== equipos.length) {
      const equiposEncontrados = equiposResult.map((e: any) => e.no_serie);
      const equiposNoEncontrados = equipos.filter(eq => !equiposEncontrados.includes(eq));
      
      return NextResponse.json({
        success: false,
        error: `Equipos no encontrados: ${equiposNoEncontrados.join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Obtener nombre de posición destino
    let nombrePosicionDestino = posicionDestino;
    if (posicionDestino && !isNaN(Number(posicionDestino))) {
      try {
        const posicionQuery = `SELECT nombre FROM posiciones WHERE id = ?`;
        const posicionResult = await executeQuery(posicionQuery, [posicionDestino]);
        if (posicionResult && posicionResult.length > 0) {
          nombrePosicionDestino = posicionResult[0].nombre;
        }
      } catch (error) {
        console.warn('No se pudo obtener nombre de posición:', error);
      }
    }

    // Actualizar ubicación de equipos
    const transferenciasRealizadas = [];
    
    for (const equipo of equiposResult) {
      try {
        // Actualizar equipo
        const updateQuery = `
          UPDATE equipos 
          SET 
            SucursalActual = ?,
            AreaActual = ?,
            fechaModificacion = NOW()
          WHERE no_serie = ?
        `;
        
        await executeQuery(updateQuery, [
          sucursalDestino,
          nombrePosicionDestino || 'Sin Especificar',
          equipo.no_serie
        ]);

        transferenciasRealizadas.push({
          no_serie: equipo.no_serie,
          nombreEquipo: equipo.nombreEquipo,
          sucursalAnterior: equipo.SucursalActual,
          areaAnterior: equipo.AreaActual,
          sucursalNueva: sucursalDestino,
          areaNueva: nombrePosicionDestino,
          fecha: new Date().toISOString()
        });

        console.log(`Equipo ${equipo.no_serie} transferido exitosamente`);

      } catch (error) {
        console.error(`Error actualizando equipo ${equipo.no_serie}:`, error);
        // Continuar con los demás equipos
      }
    }

    // Intentar registrar en tabla de movimientos si existe
    try {
      for (const transferencia of transferenciasRealizadas) {
        try {
          const movimientoQuery = `
            INSERT INTO movimientos_equipos (
              no_serie,
              tipo_movimiento,
              sucursal_origen,
              sucursal_destino,
              area_origen,
              area_destino,
              responsable,
              motivo,
              observaciones,
              fecha_movimiento,
              estatus
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'COMPLETADO')
          `;
          
          await executeQuery(movimientoQuery, [
            transferencia.no_serie,
            tipoMovimiento,
            transferencia.sucursalAnterior,
            transferencia.sucursalNueva,
            transferencia.areaAnterior,
            transferencia.areaNueva,
            responsableTraslado,
            motivo,
            observaciones
          ]);
        } catch (error) {
          console.warn('No se pudo registrar el movimiento en la tabla de movimientos:', error);
          // No es crítico, continuar
        }
      }
    } catch (error) {
      console.warn('Tabla de movimientos no disponible:', error);
    }

    return NextResponse.json({
      success: true,
      message: `${transferenciasRealizadas.length} equipo(s) transferido(s) exitosamente`,
      data: {
        transferenciasRealizadas,
        resumen: {
          totalEquipos: equipos.length,
          transferenciasExitosas: transferenciasRealizadas.length,
          sucursalDestino,
          posicionDestino: nombrePosicionDestino,
          responsable: responsableTraslado,
          fecha: new Date().toISOString()
        }
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error en transferencia:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<any>, { status: 500 });
  }
}