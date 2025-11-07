import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

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

    // Consulta básica para obtener detalles del equipo
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
        DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema
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
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    const equipo = equipoResult[0] as any;

    // Datos mock para el historial y estadísticas por ahora
    const response = {
      equipo: {
        ...equipo,
        fechaAlta: new Date(equipo.fechaAlta).toISOString()
      },
      historial: [],
      estadisticas: {
        totalMovimientos: 0,
        totalTraslados: 0,
        totalMantenimientos: 0,
        totalReparaciones: 0,
        movimientosAbiertos: 0,
        promedioDiasMovimiento: 0,
        ultimoMovimiento: null
      },
      equiposSimilares: [],
      metadatos: {
        consultadoEn: new Date().toISOString(),
        totalRegistros: {
          movimientos: 0,
          equiposSimilares: 0
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