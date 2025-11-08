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

    // Consulta para obtener detalles del equipo (solo activos)
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
      WHERE e.no_serie = ? AND (e.eliminado = 0 OR e.eliminado IS NULL)
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ no_serie: string }> }
) {
  try {
    const { no_serie } = await params;
    const body = await request.json();

    console.log('PUT equipo:', no_serie, body);

    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      }, { status: 400 });
    }

    // Validar que el equipo existe - TODO: agregar filtro eliminados
    const existeQuery = `SELECT no_serie FROM equipo WHERE no_serie = ?`;
    const existeResult = await executeQuery(existeQuery, [no_serie]);

    if (existeResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 });
    }

    // Construir la consulta de actualización dinámicamente
    const campos = [];
    const valores = [];

    if (body.nombreEquipo !== undefined) {
      campos.push('nombreEquipo = ?');
      valores.push(body.nombreEquipo);
    }
    if (body.modelo !== undefined) {
      campos.push('modelo = ?');
      valores.push(body.modelo);
    }
    if (body.numeroActivo !== undefined) {
      campos.push('numeroActivo = ?');
      valores.push(body.numeroActivo);
    }
    if (body.idTipoEquipo !== undefined && body.idTipoEquipo !== '' && body.idTipoEquipo !== null) {
      campos.push('idTipoEquipo = ?');
      valores.push(parseInt(body.idTipoEquipo) || null);
    }
    if (body.idEstatus !== undefined && body.idEstatus !== '' && body.idEstatus !== null) {
      campos.push('idEstatus = ?');
      valores.push(parseInt(body.idEstatus) || null);
    }
    if (body.idUsuarios !== undefined && body.idUsuarios !== '' && body.idUsuarios !== null) {
      campos.push('idUsuarios = ?');
      valores.push(parseInt(body.idUsuarios) || null);
    }
    if (body.idPosicion !== undefined && body.idPosicion !== '' && body.idPosicion !== null) {
      campos.push('idPosicion = ?');
      valores.push(parseInt(body.idPosicion) || null);
    }

    if (campos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      }, { status: 400 });
    }

    // Agregar el parámetro no_serie al final para la cláusula WHERE
    valores.push(no_serie);

    const updateQuery = `
      UPDATE equipo 
      SET ${campos.join(', ')} 
      WHERE no_serie = ?
    `;

    console.log('Update query:', updateQuery);
    console.log('Update valores:', valores);

    await executeQuery(updateQuery, valores);

    // Obtener el equipo actualizado - TODO: agregar filtro eliminados
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

    const equipoActualizado = await executeQuery(equipoQuery, [no_serie]);

    return NextResponse.json({
      success: true,
      data: equipoActualizado[0],
      message: 'Equipo actualizado exitosamente'
    }, { status: 200 });

  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ no_serie: string }> }
) {
  try {
    const { no_serie } = await params;

    console.log('DELETE (Lógico) equipo:', no_serie);

    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      }, { status: 400 });
    }

    // Verificar que el equipo existe y no está ya eliminado
    const existeQuery = `
      SELECT no_serie, nombreEquipo, eliminado
      FROM equipo 
      WHERE no_serie = ?
    `;
    const existeResult = await executeQuery(existeQuery, [no_serie]);

    if (existeResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      }, { status: 404 });
    }

    const equipo = existeResult[0] as any;

    if (equipo.eliminado === 1) {
      return NextResponse.json({
        success: false,
        error: 'El equipo ya está eliminado'
      }, { status: 400 });
    }

    // ✅ ELIMINACIÓN LÓGICA: Marcar como eliminado sin borrar el registro
    const deleteQuery = `
      UPDATE equipo 
      SET 
        eliminado = 1,
        fechaEliminacion = NOW(),
        usuarioEliminacion = 'Sistema'
      WHERE no_serie = ? AND eliminado = 0
    `;
    const result = await executeQuery(deleteQuery, [no_serie]);

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo eliminar el equipo'
      }, { status: 500 });
    }

    console.log('✅ Equipo eliminado lógicamente:', no_serie);

    return NextResponse.json({
      success: true,
      data: {
        no_serie: equipo.no_serie,
        nombreEquipo: equipo.nombreEquipo,
        tipoEliminacion: 'lógica',
        fechaEliminacion: new Date().toISOString(),
        conservadoEnBD: true
      },
      message: 'Equipo eliminado exitosamente (el registro se conserva en la base de datos)'
    }, { status: 200 });

  } catch (error) {
    console.error('Error eliminando equipo lógicamente:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
