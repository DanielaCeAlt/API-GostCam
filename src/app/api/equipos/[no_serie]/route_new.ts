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

    // Consulta principal para obtener detalles del equipo
    const equipoQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        e.idTipoEquipo as idTipoEquipo,
        te.nombreTipo AS TipoEquipo,
        te.descripcion AS DescripcionTipo,
        e.idEstatus as idEstatus,
        ee.estatus AS EstatusEquipo,
        e.idUsuarios as idUsuario,
        u.NombreUsuario AS UsuarioAsignado,
        u.Correo AS CorreoUsuario,
        u.NivelUsuario AS NivelUsuario,
        s.idCentro as idSucursal,
        s.Sucursal AS SucursalActual,
        e.idPosicion as idLayout,
        p.NombrePosicion AS AreaActual,
        p.Descripcion AS DescripcionArea,
        p.TipoArea,
        z.idZona as idZona,
        z.Zona AS ZonaSucursal,
        est.idEstado as idEstado,
        est.Estado AS EstadoSucursal,
        m.idMunicipios as idMunicipio,
        m.Municipio AS MunicipioSucursal,
        -- Cálculos adicionales
        DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema,
        CASE 
          WHEN ee.estatus = 'Disponible' THEN 'success'
          WHEN ee.estatus = 'En uso' THEN 'info'
          WHEN ee.estatus = 'Mantenimiento' THEN 'warning'
          WHEN ee.estatus = 'Dañado' THEN 'danger'
          ELSE 'secondary'
        END AS colorEstatus
      FROM GostCAM.Equipo e
      INNER JOIN GostCAM.TipoEquipo te ON e.idTipoEquipo = te.idTipoEquipo
      INNER JOIN GostCAM.EstatusEquipo ee ON e.idEstatus = ee.idEstatus
      INNER JOIN GostCAM.Usuarios u ON e.idUsuarios = u.idUsuarios
      INNER JOIN GostCAM.PosicionEquipo p ON e.idPosicion = p.idPosicion
      INNER JOIN GostCAM.Sucursales s ON p.idCentro = s.idCentro
      INNER JOIN GostCAM.Zonas z ON s.idZona = z.idZona
      INNER JOIN GostCAM.Estados est ON s.idEstado = est.idEstado
      INNER JOIN GostCAM.Municipios m ON s.idMunicipios = m.idMunicipios
      WHERE e.no_serie = ?
    `;

    const equipoResult = await executeQuery(equipoQuery, [no_serie]);

    if (equipoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    const equipo = equipoResult[0];

    // Obtener historial de movimientos del equipo
    const movimientosQuery = `
      SELECT 
        m.idMovimientoInv,
        tm.tipoMovimiento,
        m.fecha,
        s_origen.Sucursal as sucursalOrigen,
        s_destino.Sucursal as sucursalDestino,
        z_origen.Zona as zonaOrigen,
        z_destino.Zona as zonaDestino,
        m.estatusMovimiento,
        m.fechaFin,
        CASE 
          WHEN m.fechaFin IS NOT NULL 
          THEN DATEDIFF(m.fechaFin, m.fecha)
          ELSE DATEDIFF(CURDATE(), m.fecha)
        END AS duracionDias
      FROM GostCAM.MovimientoInventario m
      INNER JOIN GostCAM.TipoMovimiento tm ON m.idTipoMov = tm.idTipoMov
      INNER JOIN GostCAM.Sucursales s_origen ON m.origen_idCentro = s_origen.idCentro
      INNER JOIN GostCAM.Sucursales s_destino ON m.destino_idCentro = s_destino.idCentro
      INNER JOIN GostCAM.Zonas z_origen ON s_origen.idZona = z_origen.idZona
      INNER JOIN GostCAM.Zonas z_destino ON s_destino.idZona = z_destino.idZona
      INNER JOIN GostCAM.DetMovimiento d ON m.idMovimientoInv = d.idMovimientoInv
      WHERE d.no_serie = ?
      ORDER BY m.fecha DESC
      LIMIT 10
    `;

    const movimientos = await executeQuery(movimientosQuery, [no_serie]);

    // Obtener estadísticas del equipo
    const estadisticasQuery = `
      SELECT 
        COUNT(*) as totalMovimientos,
        SUM(CASE WHEN tm.tipoMovimiento = 'TRASLADO' THEN 1 ELSE 0 END) as totalTraslados,
        SUM(CASE WHEN tm.tipoMovimiento = 'MANTENIMIENTO' THEN 1 ELSE 0 END) as totalMantenimientos,
        SUM(CASE WHEN tm.tipoMovimiento = 'REPARACIÓN' THEN 1 ELSE 0 END) as totalReparaciones,
        SUM(CASE WHEN m.estatusMovimiento = 'ABIERTO' THEN 1 ELSE 0 END) as movimientosAbiertos,
        AVG(CASE 
          WHEN m.fechaFin IS NOT NULL 
          THEN DATEDIFF(m.fechaFin, m.fecha)
          ELSE NULL
        END) as promedioDiasMovimiento,
        MAX(m.fecha) as ultimoMovimiento
      FROM GostCAM.MovimientoInventario m
      INNER JOIN GostCAM.TipoMovimiento tm ON m.idTipoMov = tm.idTipoMov
      INNER JOIN GostCAM.DetMovimiento d ON m.idMovimientoInv = d.idMovimientoInv
      WHERE d.no_serie = ?
    `;

    const estadisticas = await executeQuery(estadisticasQuery, [no_serie]);

    // Obtener equipos similares (mismo tipo y sucursal)
    const equiposSimilaresQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        ee.estatus AS estatus
      FROM GostCAM.Equipo e
      INNER JOIN GostCAM.EstatusEquipo ee ON e.idEstatus = ee.idEstatus
      INNER JOIN GostCAM.PosicionEquipo p ON e.idPosicion = p.idPosicion
      WHERE e.idTipoEquipo = ? 
        AND p.idCentro = (
          SELECT p2.idCentro 
          FROM GostCAM.Equipo e2 
          INNER JOIN GostCAM.PosicionEquipo p2 ON e2.idPosicion = p2.idPosicion 
          WHERE e2.no_serie = ?
        )
        AND e.no_serie != ?
      LIMIT 5
    `;

    // Definir interfaces para tipado
    interface EquipoSimilar {
      no_serie: string;
      nombreEquipo: string;
      modelo: string;
      estatus: string;
    }

    interface MovimientoHistorial {
      idMovimientoInv: number;
      tipoMovimiento: string;
      fecha: Date;
      sucursalOrigen: string;
      sucursalDestino: string;
      zonaOrigen: string;
      zonaDestino: string;
      estatusMovimiento: string;
      fechaFin: Date | null;
      duracionDias: number;
    }

    interface EstadisticasEquipo {
      totalMovimientos: number;
      totalTraslados: number;
      totalMantenimientos: number;
      totalReparaciones: number;
      movimientosAbiertos: number;
      promedioDiasMovimiento: number | null;
      ultimoMovimiento: Date | null;
    }

    const equiposSimilares = await executeQuery(equiposSimilaresQuery, [
      (equipo as any).idTipoEquipo,
      no_serie,
      no_serie
    ]) as EquipoSimilar[];

    // Construir respuesta completa
    return NextResponse.json({
      success: true,
      data: {
        equipo: {
          ...(equipo as any),
          fechaAlta: new Date((equipo as any).fechaAlta).toISOString(),
          ubicacion: {
            zona: (equipo as any).ZonaSucursal,
            sucursal: (equipo as any).SucursalActual,
            area: (equipo as any).AreaActual
          }
        },
        historial: (movimientos as unknown as MovimientoHistorial[]).map(mov => ({
          ...mov,
          fecha: new Date(mov.fecha).toISOString(),
          fechaFin: mov.fechaFin ? new Date(mov.fechaFin).toISOString() : null
        })),
        estadisticas: {
          ...(estadisticas[0] as unknown as EstadisticasEquipo),
          ultimoMovimiento: (estadisticas[0] as unknown as EstadisticasEquipo)?.ultimoMovimiento 
            ? new Date((estadisticas[0] as unknown as EstadisticasEquipo).ultimoMovimiento!).toISOString() 
            : null,
          promedioDiasMovimiento: Math.round((estadisticas[0] as unknown as EstadisticasEquipo)?.promedioDiasMovimiento || 0)
        },
        equiposSimilares,
        metadatos: {
          consultadoEn: new Date().toISOString(),
          totalRegistros: {
            movimientos: movimientos.length,
            equiposSimilares: equiposSimilares.length
          }
        }
      }
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo detalles del equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al obtener los detalles del equipo',
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
    const data = await request.json();

    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Validar campos requeridos (basados en la nueva estructura)
    const { nombreEquipo, modelo, idTipoEquipo, idEstatus, idPosicion, idUsuarios } = data;
    if (!nombreEquipo || !modelo || !idTipoEquipo || !idEstatus || !idPosicion || !idUsuarios) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: nombreEquipo, modelo, idTipoEquipo, idEstatus, idPosicion, idUsuarios'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que el equipo existe
    const equipoExistente = await executeQuery(
      'SELECT no_serie FROM GostCAM.Equipo WHERE no_serie = ?',
      [no_serie]
    );

    if (!equipoExistente || equipoExistente.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    // Preparar la consulta de actualización
    let updateQuery = `
      UPDATE GostCAM.Equipo SET 
        nombreEquipo = ?,
        modelo = ?,
        idTipoEquipo = ?,
        idEstatus = ?,
        idPosicion = ?,
        idUsuarios = ?
    `;
    
    const updateParams = [
      nombreEquipo,
      modelo,
      idTipoEquipo,
      idEstatus,
      idPosicion,
      idUsuarios
    ];

    // Si se proporciona número de activo, incluirlo en la actualización
    if (data.numeroActivo) {
      updateQuery += ', numeroActivo = ?';
      updateParams.push(data.numeroActivo);
    }

    updateQuery += ' WHERE no_serie = ?';
    updateParams.push(no_serie);

    // Ejecutar la actualización
    const result = await executeQuery(updateQuery, updateParams);

    if (!result || (result as any).affectedRows === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo actualizar el equipo'
      } as ApiResponse<any>, { status: 500 });
    }

    // Obtener el equipo actualizado con toda la información
    const equipoActualizado = await executeQuery(`
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
        e.idUsuarios,
        u.NombreUsuario AS UsuarioAsignado,
        e.idPosicion,
        p.NombrePosicion AS PosicionActual,
        s.Sucursal AS SucursalActual,
        e.fecha_actualizacion
      FROM GostCAM.Equipo e
      INNER JOIN GostCAM.TipoEquipo te ON e.idTipoEquipo = te.idTipoEquipo
      INNER JOIN GostCAM.EstatusEquipo ee ON e.idEstatus = ee.idEstatus
      INNER JOIN GostCAM.Usuarios u ON e.idUsuarios = u.idUsuarios
      INNER JOIN GostCAM.PosicionEquipo p ON e.idPosicion = p.idPosicion
      INNER JOIN GostCAM.Sucursales s ON p.idCentro = s.idCentro
      WHERE e.no_serie = ?
    `, [no_serie]);

    return NextResponse.json({
      success: true,
      data: equipoActualizado?.[0] || null,
      message: 'Equipo actualizado exitosamente'
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<any>, { status: 500 });
  }
}