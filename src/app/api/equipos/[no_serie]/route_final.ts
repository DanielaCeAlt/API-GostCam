import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

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
      }, { status: 400 });
    }

    // Consulta muy simple
    const equipoQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        te.nombreTipo AS TipoEquipo,
        ee.estatus AS EstatusEquipo,
        u.NombreUsuario AS UsuarioAsignado,
        DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema
      FROM equipo e
      LEFT JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
      LEFT JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      LEFT JOIN usuarios u ON e.idUsuarios = u.idUsuarios
      WHERE e.no_serie = ?
    `;

    const equipoResult = await executeQuery(equipoQuery, [no_serie]);

    if (equipoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 });
    }

    const equipo = equipoResult[0] as any;

    const response = {
      equipo: {
        ...equipo,
        fechaAlta: new Date(equipo.fechaAlta).toISOString(),
        SucursalActual: 'Centro Principal',
        AreaActual: 'Área Principal',
        DescripcionArea: 'Sin descripción',
        ZonaSucursal: 'CDMX',
        EstadoSucursal: 'Ciudad de México',
        MunicipioSucursal: 'Benito Juárez',
        CorreoUsuario: 'usuario@correo.com'
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
    }, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo detalles del equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}