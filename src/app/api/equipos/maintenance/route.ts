// =============================================
// API: MANTENIMIENTO DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

// Interfaces para tipado de mantenimiento
interface MantenimientoResult {
  tecnico: string;
  estimacion_horas: number | null;
  horasReales: number | null;
  tipo_mantenimiento: 'PREVENTIVO' | 'CORRECTIVO' | 'URGENTE';
  prioridad_mantenimiento: string;
  fecha: string;
  fechaFin: string | null;
  diasTranscurridos: number;
  // Agregar otras propiedades según la query
  no_serie: string;
  nombreEquipo: string;
  tipoEquipo: string;
  sucursal: string;
  descripcion: string;
  observaciones: string;
  estatusMantenimiento: string;
}

interface EstadisticaTecnico {
  tecnico: string;
  totalMantenimientos: number;
  horasEstimadas: number;
  horasReales: number;
  preventivos: number;
  correctivos: number;
  urgentes: number;
}

// POST: Programar mantenimiento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipos, // Array de números de serie
      tipoMantenimiento, // PREVENTIVO, CORRECTIVO, URGENTE
      fechaProgramada,
      tecnicoAsignado,
      descripcion,
      prioridad = 'NORMAL', // BAJA, NORMAL, ALTA, CRITICA
      estimacionHoras = 1,
      observaciones = ''
    } = body;

    // Validaciones básicas
    if (!equipos || !Array.isArray(equipos) || equipos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Debe especificar al menos un equipo para mantenimiento'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!tipoMantenimiento || !['PREVENTIVO', 'CORRECTIVO', 'URGENTE'].includes(tipoMantenimiento)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de mantenimiento debe ser PREVENTIVO, CORRECTIVO o URGENTE'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!fechaProgramada) {
      return NextResponse.json({
        success: false,
        error: 'Fecha programada es requerida'
      } as ApiResponse<any>, { status: 400 });
    }

    if (!tecnicoAsignado) {
      return NextResponse.json({
        success: false,
        error: 'Técnico asignado es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que el técnico existe y tiene permisos
    const tecnicoQuery = `
      SELECT id, nombre, nivel 
      FROM usuarios 
      WHERE id = ? AND nivel IN (2, 3)
    `;
    const tecnicoResult = await executeQuery(tecnicoQuery, [tecnicoAsignado]);
    
    if (tecnicoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Técnico no encontrado o no tiene permisos para mantenimiento'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que todos los equipos existen
    const equiposQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        ee.nombre as estatus,
        s.nombre as sucursal,
        l.nombre as area
      FROM equipo e
      INNER JOIN layout l ON e.idLayout = l.id
      INNER JOIN sucursales s ON l.centro = s.id
      INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
      WHERE e.no_serie IN (${equipos.map(() => '?').join(',')})
    `;
    
    const equiposResult = await executeQuery(equiposQuery, equipos);

    if (equiposResult.length !== equipos.length) {
      const equiposEncontrados = equiposResult.map(e => e.no_serie);
      const equiposNoEncontrados = equipos.filter(e => !equiposEncontrados.includes(e));
      
      return NextResponse.json({
        success: false,
        error: `Equipos no encontrados: ${equiposNoEncontrados.join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que ningún equipo esté en mantenimiento actualmente
    const mantenimientoActivoQuery = `
      SELECT mi.no_serie
      FROM movimientoinventario mi
      INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
      INNER JOIN estatusmovimiento em ON mi.idEstatusMov = em.id
      WHERE mi.no_serie IN (${equipos.map(() => '?').join(',')})
        AND tm.nombre = 'MANTENIMIENTO'
        AND em.nombre = 'ABIERTO'
    `;
    
    const mantenimientoActivo = await executeQuery(mantenimientoActivoQuery, equipos);
    
    if (mantenimientoActivo.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Los siguientes equipos ya están en mantenimiento: ${mantenimientoActivo.map(m => m.no_serie).join(', ')}`
      } as ApiResponse<any>, { status: 400 });
    }

    // Obtener IDs necesarios
    const tipoMovQuery = `SELECT id FROM tipomovimiento WHERE nombre = 'MANTENIMIENTO'`;
    const tipoMovResult = await executeQuery(tipoMovQuery, []);
    const idTipoMov = tipoMovResult[0].id;

    const estatusQuery = `SELECT id FROM estatusmovimiento WHERE nombre = 'ABIERTO'`;
    const estatusResult = await executeQuery(estatusQuery, []);
    const idEstatusAbierto = estatusResult[0].id;

    // Crear registros de mantenimiento
    const mantenimientosCreados = [];
    
    for (const no_serie of equipos) {
      try {
        // Insertar registro de mantenimiento
        const insertMantQuery = `
          INSERT INTO movimientoinventario (
            fecha,
            idTipoMov,
            origen_idCentro,
            destino_idCentro,
            idEstatusMov,
            observaciones,
            idUsuarios,
            no_serie,
            tipo_mantenimiento,
            prioridad_mantenimiento,
            estimacion_horas,
            descripcion_trabajo
          ) VALUES (?, ?, 
            (SELECT l.centro FROM equipo e INNER JOIN layout l ON e.idLayout = l.id WHERE e.no_serie = ?),
            (SELECT l.centro FROM equipo e INNER JOIN layout l ON e.idLayout = l.id WHERE e.no_serie = ?),
            ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const mantResult = await executeQuery(insertMantQuery, [
          fechaProgramada,
          idTipoMov,
          no_serie, // para obtener origen
          no_serie, // para obtener destino (mismo lugar)
          idEstatusAbierto,
          observaciones,
          tecnicoAsignado,
          no_serie,
          tipoMantenimiento,
          prioridad,
          estimacionHoras,
          descripcion
        ]);

        // Actualizar estado del equipo a "Mantenimiento"
        const updateEquipoQuery = `
          UPDATE equipo 
          SET idEstatus = (SELECT id FROM estatusequipo WHERE nombre = 'Mantenimiento')
          WHERE no_serie = ?
        `;
        await executeQuery(updateEquipoQuery, [no_serie]);

        mantenimientosCreados.push({
          no_serie,
          idMantenimiento: (mantResult as any).insertId || Date.now(),
          fechaProgramada,
          tipo: tipoMantenimiento,
          prioridad,
          tecnico: tecnicoResult[0].nombre
        });

      } catch (error) {
        console.error(`Error creando mantenimiento para equipo ${no_serie}:`, error);
      }
    }

    if (mantenimientosCreados.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo programar ningún mantenimiento'
      } as ApiResponse<any>, { status: 500 });
    }

    const resumen = {
      totalEquipos: equipos.length,
      mantenimientosProgramados: mantenimientosCreados.length,
      tipoMantenimiento,
      fechaProgramada,
      tecnicoAsignado: tecnicoResult[0].nombre,
      estimacionTotalHoras: mantenimientosCreados.length * estimacionHoras,
      mantenimientos: mantenimientosCreados,
      equiposIncluidos: equiposResult.map(e => ({
        no_serie: e.no_serie,
        nombre: e.nombreEquipo,
        ubicacion: `${e.sucursal} - ${e.area}`
      }))
    };

    return NextResponse.json({
      success: true,
      data: resumen,
      message: `Se programaron ${mantenimientosCreados.length} mantenimientos de ${equipos.length} equipos`
    } as ApiResponse<any>, { status: 201 });

  } catch (error) {
    console.error('Error programando mantenimientos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// GET: Obtener mantenimientos programados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sucursal = searchParams.get('sucursal');
    const tecnico = searchParams.get('tecnico');
    const tipo = searchParams.get('tipo');
    const estatus = searchParams.get('estatus') || 'ABIERTO';
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    const whereConditions = ['em.nombre = ?'];
    const queryParams = [estatus];

    if (sucursal) {
      whereConditions.push('s.id = ?');
      queryParams.push(sucursal);
    }

    if (tecnico) {
      whereConditions.push('u.id = ?');
      queryParams.push(tecnico);
    }

    if (tipo) {
      whereConditions.push('mi.tipo_mantenimiento = ?');
      queryParams.push(tipo);
    }

    if (fechaDesde) {
      whereConditions.push('DATE(mi.fecha) >= ?');
      queryParams.push(fechaDesde);
    }

    if (fechaHasta) {
      whereConditions.push('DATE(mi.fecha) <= ?');
      queryParams.push(fechaHasta);
    }

    const mantenimientosQuery = `
      SELECT 
        mi.id,
        mi.fecha,
        mi.fechaFin,
        mi.tipo_mantenimiento,
        mi.prioridad_mantenimiento,
        mi.estimacion_horas,
        mi.descripcion_trabajo,
        mi.observaciones,
        em.nombre AS estatus,
        e.no_serie,
        e.nombreEquipo,
        te.nombre AS tipoEquipo,
        s.nombre AS sucursal,
        l.nombre AS area,
        u.nombre AS tecnico,
        DATEDIFF(CURDATE(), mi.fecha) AS diasTranscurridos,
        CASE 
          WHEN mi.fechaFin IS NOT NULL 
          THEN TIMESTAMPDIFF(HOUR, mi.fecha, mi.fechaFin)
          ELSE NULL
        END AS horasReales
      FROM movimientoinventario mi
      INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
      INNER JOIN estatusmovimiento em ON mi.idEstatusMov = em.id
      INNER JOIN equipo e ON mi.no_serie = e.no_serie
      INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
      INNER JOIN layout l ON e.idLayout = l.id
      INNER JOIN sucursales s ON l.centro = s.id
      INNER JOIN usuarios u ON mi.idUsuarios = u.id
      WHERE tm.nombre = 'MANTENIMIENTO' AND ${whereConditions.join(' AND ')}
      ORDER BY 
        CASE mi.prioridad_mantenimiento 
          WHEN 'CRITICA' THEN 1
          WHEN 'ALTA' THEN 2
          WHEN 'NORMAL' THEN 3
          WHEN 'BAJA' THEN 4
        END,
        mi.fecha ASC
    `;

    const mantenimientos = await executeQuery<MantenimientoResult>(mantenimientosQuery, queryParams);

    // Agrupar por técnico para estadísticas
    const estadisticasPorTecnico = mantenimientos.reduce((acc, m) => {
      if (!acc[m.tecnico]) {
        acc[m.tecnico] = {
          tecnico: m.tecnico,
          totalMantenimientos: 0,
          horasEstimadas: 0,
          horasReales: 0,
          preventivos: 0,
          correctivos: 0,
          urgentes: 0
        };
      }
      
      acc[m.tecnico].totalMantenimientos++;
      acc[m.tecnico].horasEstimadas += m.estimacion_horas || 0;
      acc[m.tecnico].horasReales += m.horasReales || 0;
      
      if (m.tipo_mantenimiento === 'PREVENTIVO') acc[m.tecnico].preventivos++;
      if (m.tipo_mantenimiento === 'CORRECTIVO') acc[m.tecnico].correctivos++;
      if (m.tipo_mantenimiento === 'URGENTE') acc[m.tecnico].urgentes++;
      
      return acc;
    }, {} as Record<string, EstadisticaTecnico>);

    return NextResponse.json({
      success: true,
      data: {
        mantenimientos,
        estadisticas: {
          total: mantenimientos.length,
          porTecnico: Object.values(estadisticasPorTecnico),
          porTipo: {
            preventivos: mantenimientos.filter(m => m.tipo_mantenimiento === 'PREVENTIVO').length,
            correctivos: mantenimientos.filter(m => m.tipo_mantenimiento === 'CORRECTIVO').length,
            urgentes: mantenimientos.filter(m => m.tipo_mantenimiento === 'URGENTE').length
          },
          porPrioridad: {
            critica: mantenimientos.filter(m => m.prioridad_mantenimiento === 'CRITICA').length,
            alta: mantenimientos.filter(m => m.prioridad_mantenimiento === 'ALTA').length,
            normal: mantenimientos.filter(m => m.prioridad_mantenimiento === 'NORMAL').length,
            baja: mantenimientos.filter(m => m.prioridad_mantenimiento === 'BAJA').length
          }
        }
      },
      message: `Se encontraron ${mantenimientos.length} mantenimientos`
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo mantenimientos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}