import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET: Obtener equipos eliminados
export async function GET(request: NextRequest) {
  try {
    console.log('API Equipos Eliminados GET llamada');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Consultar equipos eliminados lógicamente
    const equiposEliminados = await executeQuery(`
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        e.fechaEliminacion,
        e.usuarioEliminacion,
        te.nombreTipo AS TipoEquipo,
        ee.estatus AS EstatusEquipo,
        u.NombreUsuario AS UsuarioAsignado,
        DATEDIFF(CURDATE(), e.fechaEliminacion) AS diasEliminado
      FROM equipo e
      LEFT JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
      LEFT JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      LEFT JOIN usuarios u ON e.idUsuarios = u.idUsuarios
      WHERE e.eliminado = 1
      ORDER BY e.fechaEliminacion DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Contar total de equipos eliminados
    const totalResult = await executeQuery(`
      SELECT COUNT(*) as total 
      FROM equipo 
      WHERE eliminado = 1
    `);

    const total = (totalResult[0] as any)?.total || 0;

    return NextResponse.json({
      success: true,
      data: {
        equipos: equiposEliminados,
        pagination: {
          total,
          limit,
          offset,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: `${equiposEliminados.length} equipos eliminados obtenidos`
    }, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo equipos eliminados:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// PATCH: Restaurar equipo eliminado
export async function PATCH(request: NextRequest) {
  try {
    const { no_serie } = await request.json();
    
    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      }, { status: 400 });
    }

    // Verificar que el equipo existe y está eliminado
    const equipoResult = await executeQuery(`
      SELECT no_serie, nombreEquipo, eliminado 
      FROM equipo 
      WHERE no_serie = ?
    `, [no_serie]);

    if (equipoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 });
    }

    const equipo = equipoResult[0] as any;

    if (equipo.eliminado !== 1) {
      return NextResponse.json({
        success: false,
        error: 'El equipo no está eliminado'
      }, { status: 400 });
    }

    // Restaurar el equipo
    const result = await executeQuery(`
      UPDATE equipo 
      SET 
        eliminado = 0,
        fechaEliminacion = NULL,
        usuarioEliminacion = NULL
      WHERE no_serie = ? AND eliminado = 1
    `, [no_serie]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo restaurar el equipo'
      }, { status: 500 });
    }

    console.log('✅ Equipo restaurado:', no_serie);

    return NextResponse.json({
      success: true,
      data: {
        no_serie: equipo.no_serie,
        nombreEquipo: equipo.nombreEquipo
      },
      message: 'Equipo restaurado exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error restaurando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}