// =============================================
// API: TRANSFERENCIAS DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, callStoredProcedure } from '@/lib/database';
import { ApiResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipos, // Array de números de serie
      sucursalOrigen,
      sucursalDestino,
      layoutDestino,
      tipoMovimiento = 'TRASLADO',
      observaciones = '',
      fechaProgramada = null,
      urgencia = 'NORMAL', // BAJA, NORMAL, ALTA, URGENTE
      responsableTraslado,
      motivo = ''
    } = body;

    // Validaciones básicas
    if (!equipos || !Array.isArray(equipos) || equipos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debe especificar al menos un equipo para transferir'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!sucursalOrigen || !sucursalDestino) {
      return NextResponse.json({
        success: false,
        error: 'Sucursal origen y destino son requeridas'
      } as ApiResponse<any>, { status: 400 });
    }

    if (sucursalOrigen === sucursalDestino) {
      return NextResponse.json({
        success: false,
        error: 'La sucursal origen debe ser diferente a la destino'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!responsableTraslado) {
      return NextResponse.json({
        success: false,
        error: 'Responsable del traslado es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que todas las sucursales existen
    const sucursalesQuery = `
      SELECT id, nombre FROM sucursales 
      WHERE id IN (?, ?)
    `;
    const sucursalesResult = await executeQuery(sucursalesQuery, [sucursalOrigen, sucursalDestino]);
    
    if (sucursalesResult.length !== 2) {
      return NextResponse.json({
        success: false,
        error: 'Una o ambas sucursales no existen'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que todos los equipos existen y están en la sucursal origen
    const equiposQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        ee.nombre as estatus,
        s.id as sucursalActual,
        s.nombre as nombreSucursal
      FROM equipo e
      INNER JOIN layout l ON e.idLayout = l.id
      INNER JOIN sucursales s ON l.centro = s.id
      INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
      WHERE e.no_serie IN (${equipos.map(() => '?').join(',')})
    `;
    
    const equiposResult = await executeQuery(equiposQuery, equipos);

    // Verificar que se encontraron todos los equipos
    if (equiposResult.length !== equipos.length) {
      const equiposEncontrados = equiposResult.map(e => e.no_serie);
      const equiposNoEncontrados = equipos.filter(e => !equiposEncontrados.includes(e));
      
      return NextResponse.json({
        success: false,
        error: `Equipos no encontrados: ${equiposNoEncontrados.join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que todos los equipos están en la sucursal origen
    const equiposEnOrigen = equiposResult.filter(e => e.sucursalActual === sucursalOrigen);
    if (equiposEnOrigen.length !== equipos.length) {
      const equiposEnOtraSucursal = equiposResult.filter(e => e.sucursalActual !== sucursalOrigen);
      
      return NextResponse.json({
        success: false,
        error: `Los siguientes equipos no están en la sucursal origen: ${equiposEnOtraSucursal.map(e => `${e.no_serie} (en ${e.nombreSucursal})`).join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que ningún equipo tenga movimientos abiertos
    const movimientosAbiertosQuery = `
      SELECT mi.no_serie, tm.nombre as tipoMovimiento
      FROM movimientoinventario mi
      INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
      INNER JOIN estatusmovimiento em ON mi.idEstatusMov = em.id
      WHERE mi.no_serie IN (${equipos.map(() => '?').join(',')})
        AND em.nombre = 'ABIERTO'
    `;
    
    const movimientosAbiertos = await executeQuery(movimientosAbiertosQuery, equipos);
    
    if (movimientosAbiertos.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Los siguientes equipos tienen movimientos abiertos: ${movimientosAbiertos.map(m => `${m.no_serie} (${m.tipoMovimiento})`).join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar layout destino si se especifica
    if (layoutDestino) {
      const layoutQuery = `
        SELECT id, nombre, centro 
        FROM layout 
        WHERE id = ? AND centro = ?
      `;
      const layoutResult = await executeQuery(layoutQuery, [layoutDestino, sucursalDestino]);
      
      if (layoutResult.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'El layout destino no existe o no pertenece a la sucursal destino'
        } as ApiResponse<any>, { status: 400 });
      }
    }

    // Obtener ID del tipo de movimiento
    const tipoMovQuery = `SELECT id FROM tipomovimiento WHERE nombre = ?`;
    const tipoMovResult = await executeQuery(tipoMovQuery, [tipoMovimiento]);
    
    if (tipoMovResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de movimiento no válido'
      } as ApiResponse<any>, { status: 400 });
    }

    const idTipoMov = tipoMovResult[0].id;

    // Obtener ID del estatus "ABIERTO"
    const estatusQuery = `SELECT id FROM estatusmovimiento WHERE nombre = 'ABIERTO'`;
    const estatusResult = await executeQuery(estatusQuery, []);
    const idEstatusAbierto = estatusResult[0].id;

    // Crear registros de transferencia para cada equipo
    const transferenciasCreadas = [];
    const fechaMovimiento = fechaProgramada || new Date().toISOString().split('T')[0];

    for (const no_serie of equipos) {
      try {
        // Insertar registro de movimiento
        const insertMovQuery = `
          INSERT INTO movimientoinventario (
            fecha,
            idTipoMov,
            origen_idCentro,
            destino_idCentro,
            idEstatusMov,
            observaciones,
            idUsuarios,
            no_serie,
            urgencia,
            motivo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const movimientoResult = await executeQuery(insertMovQuery, [
          fechaMovimiento,
          idTipoMov,
          sucursalOrigen,
          sucursalDestino,
          idEstatusAbierto,
          observaciones,
          responsableTraslado,
          no_serie,
          urgencia,
          motivo
        ]);

        transferenciasCreadas.push({
          no_serie,
          idMovimiento: (movimientoResult as any).insertId || Date.now(), // Fallback for ID
          fecha: fechaMovimiento,
          tipo: tipoMovimiento,
          urgencia
        });

      } catch (error) {
        console.error(`Error creando transferencia para equipo ${no_serie}:`, error);
        // Si falla uno, continuar con los demás pero registrar el error
      }
    }

    if (transferenciasCreadas.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo crear ninguna transferencia'
      } as ApiResponse<any>, { status: 500 });
    }

    // Crear resumen de la transferencia
    const resumen = {
      totalEquipos: equipos.length,
      transferenciasCreadas: transferenciasCreadas.length,
      sucursalOrigen: sucursalesResult.find(s => s.id === sucursalOrigen)?.nombre,
      sucursalDestino: sucursalesResult.find(s => s.id === sucursalDestino)?.nombre,
      tipoMovimiento,
      urgencia,
      fechaProgramada: fechaMovimiento,
      transferencias: transferenciasCreadas,
      equiposIncluidos: equiposResult.map(e => ({
        no_serie: e.no_serie,
        nombre: e.nombreEquipo,
        estatus: e.estatus
      }))
    };

    return NextResponse.json({
      success: true,
      data: resumen,
      message: `Se crearon ${transferenciasCreadas.length} transferencias de ${equipos.length} equipos`
    } as ApiResponse<any>, { status: 201 });

  } catch (error) {
    console.error('Error creando transferencias:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// GET: Obtener transferencias pendientes o en proceso
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursal = searchParams.get('sucursal');
    const estatus = searchParams.get('estatus') || 'ABIERTO';
    const urgencia = searchParams.get('urgencia');
    const tipo = searchParams.get('tipo');

    const whereConditions = ['em.nombre = ?'];
    const queryParams = [estatus];

    if (sucursal) {
      whereConditions.push('(mi.origen_idCentro = ? OR mi.destino_idCentro = ?)');
      queryParams.push(sucursal, sucursal);
    }

    if (urgencia) {
      whereConditions.push('mi.urgencia = ?');
      queryParams.push(urgencia);
    }

    if (tipo) {
      whereConditions.push('tm.nombre = ?');
      queryParams.push(tipo);
    }

    const transferenciasQuery = `
      SELECT 
        mi.id,
        mi.fecha,
        mi.fechaFin,
        mi.urgencia,
        mi.motivo,
        mi.observaciones,
        tm.nombre AS tipoMovimiento,
        em.nombre AS estatus,
        s_origen.nombre AS sucursalOrigen,
        s_destino.nombre AS sucursalDestino,
        e.no_serie,
        e.nombreEquipo,
        te.nombre AS tipoEquipo,
        u.nombre AS responsable,
        DATEDIFF(CURDATE(), mi.fecha) AS diasTranscurridos
      FROM movimientoinventario mi
      INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
      INNER JOIN estatusmovimiento em ON mi.idEstatusMov = em.id
      INNER JOIN sucursales s_origen ON mi.origen_idCentro = s_origen.id
      INNER JOIN sucursales s_destino ON mi.destino_idCentro = s_destino.id
      INNER JOIN equipo e ON mi.no_serie = e.no_serie
      INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
      INNER JOIN usuarios u ON mi.idUsuarios = u.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE mi.urgencia 
          WHEN 'URGENTE' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'NORMAL' THEN 3
          WHEN 'BAJA' THEN 4
        END,
        mi.fecha ASC
    `;

    const transferencias = await executeQuery(transferenciasQuery, queryParams);

    return NextResponse.json({
      success: true,
      data: transferencias,
      message: `Se encontraron ${transferencias.length} transferencias`
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo transferencias:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}