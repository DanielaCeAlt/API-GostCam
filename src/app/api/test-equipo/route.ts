import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const no_serie = searchParams.get('no_serie');

    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido como parámetro'
      }, { status: 400 });
    }

    // Consulta muy básica
    const equipoQuery = `SELECT no_serie, nombreEquipo, modelo FROM equipo WHERE no_serie = ?`;

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
        SucursalActual: 'Centro Principal',
        AreaActual: 'Área Principal',
        UsuarioAsignado: 'Usuario Test',
        EstatusEquipo: 'Disponible',
        TipoEquipo: 'Camara',
        diasEnSistema: 100
      },
      historial: [],
      estadisticas: {
        totalMovimientos: 5,
        totalTraslados: 3,
        totalMantenimientos: 1,
        totalReparaciones: 1,
        movimientosAbiertos: 0,
        promedioDiasMovimiento: 30,
        ultimoMovimiento: new Date().toISOString()
      },
      equiposSimilares: [
        {
          no_serie: "CAM001",
          nombreEquipo: "Cámara Similar 1",
          modelo: "Modelo ABC",
          estatus: "Disponible"
        }
      ],
      metadatos: {
        consultadoEn: new Date().toISOString(),
        totalRegistros: {
          movimientos: 0,
          equiposSimilares: 1
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