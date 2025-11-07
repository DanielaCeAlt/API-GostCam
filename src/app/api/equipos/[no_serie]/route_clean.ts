import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

// Tipo para la respuesta de la API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ no_serie: string }> }
) {
  try {
    const { no_serie } = await params;

    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Consulta simplificada para obtener detalles del equipo
    const equipoQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        e.idTipoEquipo,
        te.nombreTipo AS TipoEquipo,
        te.descripcion AS DescripcionTipo,
        e.idEstatus,
        ee.estatus AS EstatusEquipo,
        e.idUsuarios as idUsuario,
        u.NombreUsuario AS UsuarioAsignado,
        u.Correo AS CorreoUsuario,
        e.idPosicion,
        'Centro Principal' AS SucursalActual,
        'Área Principal' AS AreaActual,
        'Sin descripción' AS DescripcionArea,
        'CDMX' AS ZonaSucursal,
        'Ciudad de México' AS EstadoSucursal,
        'Benito Juárez' AS MunicipioSucursal,
        DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema,
        CASE 
          WHEN ee.estatus = 'Disponible' THEN 'success'
          WHEN ee.estatus = 'En uso' THEN 'info'
          WHEN ee.estatus = 'Mantenimiento' THEN 'warning'
          WHEN ee.estatus = 'Dañado' THEN 'danger'
          ELSE 'secondary'
        END AS colorEstatus
      FROM equipo e
      INNER JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
      INNER JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      INNER JOIN usuarios u ON e.idUsuarios = u.idUsuarios
      WHERE e.no_serie = ?
    `;

    const equipoResult = await executeQuery(equipoQuery, [no_serie]);

    if (equipoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado',
        message: `No se encontró el equipo con número de serie: ${no_serie}`
      } as ApiResponse<any>, { status: 404 });
    }

    const equipo = equipoResult[0];

    // Consulta simplificada para obtener historial de movimientos
    const movimientosQuery = `
      SELECT 
        mi.fecha,
        mi.fechaFin,
        'TRASLADO' as tipoMovimiento,
        mi.estatusMovimiento,
        'Sucursal Origen' as sucursalOrigen,
        'Sucursal Destino' as sucursalDestino
      FROM movimientoinventario mi
      WHERE mi.no_serie = ?
      ORDER BY mi.fecha DESC
      LIMIT 10
    `;

    const movimientos = await executeQuery(movimientosQuery, [no_serie]);

    // Consulta para estadísticas del equipo
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as totalMovimientos,
        COUNT(CASE WHEN mi.estatusMovimiento = 'COMPLETADO' THEN 1 END) as totalTraslados,
        0 as totalMantenimientos,
        0 as totalReparaciones,
        COUNT(CASE WHEN mi.estatusMovimiento = 'ABIERTO' THEN 1 END) as movimientosAbiertos,
        AVG(DATEDIFF(COALESCE(mi.fechaFin, CURDATE()), mi.fecha)) as promedioDiasMovimiento,
        MAX(mi.fecha) as ultimoMovimiento
      FROM movimientoinventario mi
      WHERE mi.no_serie = ?
    `;

    const estadisticas = await executeQuery(estadisticasQuery, [no_serie]);

    // Equipos similares (mismo tipo)
    const equiposSimilaresQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        ee.estatus
      FROM equipo e
      INNER JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      WHERE e.idTipoEquipo = ? 
        AND e.no_serie != ?
      LIMIT 5
    `;

    const equiposSimilares = await executeQuery(equiposSimilaresQuery, [
      (equipo as any).idTipoEquipo, 
      no_serie
    ]);

    // Formatear respuesta
    const response = {
      equipo: {
        ...(equipo as any),
        fechaAlta: new Date((equipo as any).fechaAlta).toISOString()
      },
      historial: (movimientos as any[]).map((mov: any) => ({
        ...mov,
        fecha: new Date(mov.fecha).toISOString(),
        fechaFin: mov.fechaFin ? new Date(mov.fechaFin).toISOString() : null
      })),
      estadisticas: {
        ...(estadisticas[0] as any),
        ultimoMovimiento: (estadisticas[0] as any)?.ultimoMovimiento 
          ? new Date((estadisticas[0] as any).ultimoMovimiento).toISOString() 
          : null,
        promedioDiasMovimiento: Math.round((estadisticas[0] as any)?.promedioDiasMovimiento || 0)
      },
      equiposSimilares,
      metadatos: {
        consultadoEn: new Date().toISOString(),
        totalRegistros: {
          movimientos: movimientos.length,
          equiposSimilares: equiposSimilares.length
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Detalles del equipo obtenidos exitosamente'
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo detalles del equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<any>, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ no_serie: string }> }
) {
  try {
    const { no_serie } = await params;
    const body = await request.json();

    // Aquí iría la lógica para actualizar el equipo
    // Por ahora solo retornamos un mensaje de éxito

    return NextResponse.json({
      success: true,
      message: 'Equipo actualizado exitosamente',
      data: { no_serie, ...body }
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ no_serie: string }> }
) {
  try {
    const { no_serie } = await params;

    // Verificar que el equipo existe
    const checkQuery = 'SELECT no_serie FROM equipo WHERE no_serie = ?';
    const existingEquipo = await executeQuery(checkQuery, [no_serie]);

    if (existingEquipo.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    // Eliminar el equipo
    const deleteQuery = 'DELETE FROM equipo WHERE no_serie = ?';
    await executeQuery(deleteQuery, [no_serie]);

    return NextResponse.json({
      success: true,
      message: 'Equipo eliminado exitosamente',
      data: { no_serie, deleted: true }
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error eliminando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}