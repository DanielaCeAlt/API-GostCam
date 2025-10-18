// =============================================
// API: REPORTES AVANZADOS DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

// Interfaces para tipado de reportes
interface EquipoReporte {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  marca: string;
  estatus: string;
  tipoEquipo: string;
  sucursal: string;
  valorEstimado: number;
  fecha_adquisicion: string;
  ubicacionActual: string;
  responsable: string;
  // Agregar otras propiedades según las queries específicas
}

interface MovimientoReporte {
  no_serie: string;
  totalMovimientos: number;
  tipoMovimiento: string;
  fecha: string;
  tecnico: string;
  // Agregar otras propiedades según las queries específicas
}

interface MantenimientoReporte {
  no_serie: string;
  tecnico: string;
  tipo_mantenimiento: string;
  fecha: string;
  costoEstimado: number;
  totalHorasEstimadas: number;
  cantidadMantenimientos: number;
  horasReales: number;
  porcentajeUtilizacion: number;
  estatusActual: string;
  sucursal: string;
  zona: string;
  // Agregar otras propiedades según las queries específicas
}

// GET: Generar reportes específicos de equipos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipoReporte = searchParams.get('tipo');
    const sucursal = searchParams.get('sucursal');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const formato = searchParams.get('formato') || 'json'; // json, csv, excel

    if (!tipoReporte) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de reporte es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    let reporteData;

    switch (tipoReporte) {
      case 'inventario-completo':
        reporteData = await generarReporteInventarioCompleto(sucursal);
        break;
      
      case 'equipos-por-estatus':
        reporteData = await generarReporteEquiposPorEstatus(sucursal);
        break;
      
      case 'movimientos-frecuentes':
        reporteData = await generarReporteMovimientosFrecuentes(fechaDesde, fechaHasta, sucursal);
        break;
      
      case 'mantenimientos-pendientes':
        reporteData = await generarReporteMantenimientosPendientes(sucursal);
        break;
      
      case 'utilizacion-equipos':
        reporteData = await generarReporteUtilizacionEquipos(fechaDesde, fechaHasta, sucursal);
        break;
      
      case 'equipos-obsoletos':
        reporteData = await generarReporteEquiposObsoletos(sucursal);
        break;
      
      case 'costo-mantenimiento':
        reporteData = await generarReporteCostoMantenimiento(fechaDesde, fechaHasta, sucursal);
        break;
      
      case 'eficiencia-sucursales':
        reporteData = await generarReporteEficienciaSucursales(fechaDesde, fechaHasta);
        break;
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Tipo de reporte no válido'
        } as ApiResponse<any>, { status: 400 });
    }

    // Si se solicita formato CSV, convertir datos
    if (formato === 'csv') {
      const csvData = convertirACSV((reporteData as any).equipos || (reporteData as any).datos || []);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${tipoReporte}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: reporteData,
      tipoReporte,
      generadoEn: new Date().toISOString(),
      parametros: {
        sucursal,
        fechaDesde,
        fechaHasta,
        formato
      }
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error generando reporte:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// Función para reporte de inventario completo
async function generarReporteInventarioCompleto(sucursal?: string | null) {
  let whereClause = '';
  const queryParams: string[] = [];

  if (sucursal) {
    whereClause = 'WHERE s.id = ?';
    queryParams.push(sucursal);
  }

  const query = `
    SELECT 
      e.no_serie,
      e.nombreEquipo,
      e.modelo,
      e.numeroActivo,
      e.fechaAlta,
      te.nombre AS tipoEquipo,
      ee.nombre AS estatus,
      s.nombre AS sucursal,
      l.nombre AS area,
      z.nombre AS zona,
      est.nombre AS estado,
      m.nombre AS municipio,
      u.nombre AS responsable,
      DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema,
      -- Valor estimado basado en tipo de equipo
      CASE te.nombre
        WHEN 'NVR' THEN 15000
        WHEN 'DVR' THEN 8000
        WHEN 'Camara PTZ' THEN 12000
        WHEN 'Camara 360' THEN 6000
        WHEN 'Camara Domo' THEN 4000
        WHEN 'Switch' THEN 3000
        ELSE 1000
      END AS valorEstimado
    FROM equipo e
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
    INNER JOIN usuarios u ON e.idUsuarios = u.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    INNER JOIN zonas z ON s.zona = z.id
    INNER JOIN estados est ON s.estado = est.id
    INNER JOIN municipios m ON s.municipio = m.id
    ${whereClause}
    ORDER BY s.nombre, te.nombre, e.nombreEquipo
  `;

  const equipos = await executeQuery<EquipoReporte>(query, queryParams);

  // Calcular estadísticas
  const resumen = {
    totalEquipos: equipos.length,
    valorTotalEstimado: equipos.reduce((sum: number, e) => sum + (e.valorEstimado || 0), 0),
    porEstatus: equipos.reduce((acc: Record<string, number>, e) => {
      const estatus = String(e.estatus || 'Sin Estado');
      acc[estatus] = (acc[estatus] || 0) + 1;
      return acc;
    }, {}),
    porTipo: equipos.reduce((acc: Record<string, number>, e) => {
      const tipo = String(e.tipoEquipo || 'Sin Tipo');
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {}),
    porSucursal: equipos.reduce((acc: Record<string, number>, e) => {
      const sucursal = String(e.sucursal || 'Sin Sucursal');
      acc[sucursal] = (acc[sucursal] || 0) + 1;
      return acc;
    }, {})
  };

  return {
    resumen,
    equipos,
    metadatos: {
      tipoReporte: 'inventario-completo',
      filtros: { sucursal }
    }
  };
}

// Función para reporte de equipos por estatus
async function generarReporteEquiposPorEstatus(sucursal?: string | null) {
  let whereClause = '';
  const queryParams: string[] = [];

  if (sucursal) {
    whereClause = 'WHERE s.id = ?';
    queryParams.push(sucursal);
  }

  const query = `
    SELECT 
      ee.nombre AS estatus,
      te.nombre AS tipoEquipo,
      s.nombre AS sucursal,
      COUNT(*) AS cantidad,
      GROUP_CONCAT(e.no_serie SEPARATOR ', ') AS equipos,
      AVG(DATEDIFF(CURDATE(), e.fechaAlta)) AS promedioDiasEnEstatus
    FROM equipo e
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    ${whereClause}
    GROUP BY ee.nombre, te.nombre, s.nombre
    ORDER BY ee.nombre, cantidad DESC
  `;

  const datos = await executeQuery(query, queryParams);

  return {
    datos,
    resumen: {
      totalCombinaciones: datos.length,
      estatusUnicos: [...new Set(datos.map((d: Record<string, unknown>) => d.estatus))],
      tiposUnicos: [...new Set(datos.map((d: Record<string, unknown>) => d.tipoEquipo))]
    }
  };
}

// Función para reporte de movimientos frecuentes
async function generarReporteMovimientosFrecuentes(
  fechaDesde?: string | null, 
  fechaHasta?: string | null, 
  sucursal?: string | null
) {
  const whereConditions = [];
  const queryParams: string[] = [];

  if (fechaDesde) {
    whereConditions.push('DATE(mi.fecha) >= ?');
    queryParams.push(fechaDesde);
  }

  if (fechaHasta) {
    whereConditions.push('DATE(mi.fecha) <= ?');
    queryParams.push(fechaHasta);
  }

  if (sucursal) {
    whereConditions.push('(mi.origen_idCentro = ? OR mi.destino_idCentro = ?)');
    queryParams.push(sucursal, sucursal);
  }

  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}`
    : '';

  const query = `
    SELECT 
      e.no_serie,
      e.nombreEquipo,
      COUNT(mi.id) AS totalMovimientos,
      tm.nombre AS tipoMovimientoMasFrecuente,
      MAX(mi.fecha) AS ultimoMovimiento,
      AVG(CASE 
        WHEN mi.fechaFin IS NOT NULL 
        THEN DATEDIFF(mi.fechaFin, mi.fecha)
        ELSE NULL
      END) AS promedioDuracionMovimientos
    FROM equipo e
    LEFT JOIN movimientoinventario mi ON e.no_serie = mi.no_serie
    LEFT JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
    ${whereClause}
    GROUP BY e.no_serie, e.nombreEquipo
    HAVING totalMovimientos > 0
    ORDER BY totalMovimientos DESC
    LIMIT 50
  `;

  const equiposConMovimientos = await executeQuery<MovimientoReporte>(query, queryParams);

  return {
    equiposConMovimientos,
    resumen: {
      equiposAnalizados: equiposConMovimientos.length,
      totalMovimientos: equiposConMovimientos.reduce((sum: number, e) => sum + (e.totalMovimientos || 0), 0),
      promedioMovimientosPorEquipo: equiposConMovimientos.length > 0 
        ? equiposConMovimientos.reduce((sum: number, e) => sum + (e.totalMovimientos || 0), 0) / equiposConMovimientos.length 
        : 0
    }
  };
}

// Función para reporte de mantenimientos pendientes
async function generarReporteMantenimientosPendientes(sucursal?: string | null) {
  const whereConditions = ['tm.nombre = "MANTENIMIENTO"', 'em.nombre = "ABIERTO"'];
  const queryParams: string[] = [];

  if (sucursal) {
    whereConditions.push('s.id = ?');
    queryParams.push(sucursal);
  }

  const query = `
    SELECT 
      mi.id AS idMantenimiento,
      e.no_serie,
      e.nombreEquipo,
      te.nombre AS tipoEquipo,
      mi.fecha AS fechaProgramada,
      mi.tipo_mantenimiento,
      mi.prioridad_mantenimiento,
      mi.estimacion_horas,
      u.nombre AS tecnicoAsignado,
      s.nombre AS sucursal,
      l.nombre AS area,
      DATEDIFF(CURDATE(), mi.fecha) AS diasVencido,
      CASE 
        WHEN DATEDIFF(CURDATE(), mi.fecha) > 7 THEN 'URGENTE'
        WHEN DATEDIFF(CURDATE(), mi.fecha) > 3 THEN 'ATRASADO'
        WHEN DATEDIFF(CURDATE(), mi.fecha) > 0 THEN 'VENCIDO'
        ELSE 'EN_TIEMPO'
      END AS estadoVencimiento
    FROM movimientoinventario mi
    INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
    INNER JOIN estatusmovimiento em ON mi.idEstatusMov = em.id
    INNER JOIN equipo e ON mi.no_serie = e.no_serie
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN usuarios u ON mi.idUsuarios = u.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    WHERE ${whereConditions.join(' AND ')}
    ORDER BY diasVencido DESC, mi.prioridad_mantenimiento
  `;

  const mantenimientosPendientes = await executeQuery(query, queryParams);

  return {
    mantenimientosPendientes,
    resumen: {
      total: mantenimientosPendientes.length,
      urgentes: mantenimientosPendientes.filter((m: Record<string, unknown>) => m.estadoVencimiento === 'URGENTE').length,
      atrasados: mantenimientosPendientes.filter((m: Record<string, unknown>) => m.estadoVencimiento === 'ATRASADO').length,
      vencidos: mantenimientosPendientes.filter((m: Record<string, unknown>) => m.estadoVencimiento === 'VENCIDO').length,
      enTiempo: mantenimientosPendientes.filter((m: Record<string, unknown>) => m.estadoVencimiento === 'EN_TIEMPO').length
    }
  };
}

// Función para reporte de utilización de equipos
async function generarReporteUtilizacionEquipos(
  fechaDesde?: string | null, 
  fechaHasta?: string | null, 
  sucursal?: string | null
) {
  // Implementación simplificada
  const equipos = await executeQuery<MantenimientoReporte>(`
    SELECT 
      e.no_serie,
      e.nombreEquipo,
      te.nombre AS tipoEquipo,
      ee.nombre AS estatusActual,
      s.nombre AS sucursal,
      COUNT(mi.id) AS totalMovimientos,
      CASE ee.nombre
        WHEN 'En uso' THEN 100
        WHEN 'Disponible' THEN 50
        WHEN 'Mantenimiento' THEN 0
        WHEN 'Dañado' THEN 0
        ELSE 25
      END AS porcentajeUtilizacion
    FROM equipo e
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    LEFT JOIN movimientoinventario mi ON e.no_serie = mi.no_serie
    ${sucursal ? 'WHERE s.id = ?' : ''}
    GROUP BY e.no_serie
    ORDER BY porcentajeUtilizacion DESC
  `, sucursal ? [sucursal] : []);

  return {
    equipos,
    resumen: {
      utilizacionPromedio: equipos.reduce((sum: number, e: MantenimientoReporte) => sum + (e.porcentajeUtilizacion || 0), 0) / equipos.length,
      equiposEnUso: equipos.filter((e: MantenimientoReporte) => String(e.estatusActual) === 'En uso').length,
      equiposDisponibles: equipos.filter((e: MantenimientoReporte) => String(e.estatusActual) === 'Disponible').length,
      equiposInactivos: equipos.filter((e: MantenimientoReporte) => ['Mantenimiento', 'Dañado', 'Baja'].includes(String(e.estatusActual))).length
    }
  };
}

// Función para reporte de equipos obsoletos
async function generarReporteEquiposObsoletos(sucursal?: string | null) {
  const query = `
    SELECT 
      e.no_serie,
      e.nombreEquipo,
      e.modelo,
      te.nombre AS tipoEquipo,
      e.fechaAlta,
      DATEDIFF(CURDATE(), e.fechaAlta) AS diasEnSistema,
      s.nombre AS sucursal,
      COUNT(mi.id) AS totalMovimientos,
      MAX(mi.fecha) AS ultimoMovimiento,
      CASE 
        WHEN DATEDIFF(CURDATE(), e.fechaAlta) > 1825 THEN 'OBSOLETO' -- 5 años
        WHEN DATEDIFF(CURDATE(), e.fechaAlta) > 1095 THEN 'ANTIGUO' -- 3 años
        WHEN DATEDIFF(CURDATE(), e.fechaAlta) > 730 THEN 'MADURO' -- 2 años
        ELSE 'NUEVO'
      END AS categoriaEdad
    FROM equipo e
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    LEFT JOIN movimientoinventario mi ON e.no_serie = mi.no_serie
    ${sucursal ? 'WHERE s.id = ?' : ''}
    GROUP BY e.no_serie
    HAVING categoriaEdad IN ('OBSOLETO', 'ANTIGUO')
    ORDER BY diasEnSistema DESC
  `;

  const equiposObsoletos = await executeQuery(query, sucursal ? [sucursal] : []);

  return {
    equiposObsoletos,
    resumen: {
      total: equiposObsoletos.length,
      obsoletos: equiposObsoletos.filter((e: Record<string, unknown>) => e.categoriaEdad === 'OBSOLETO').length,
      antiguos: equiposObsoletos.filter((e: Record<string, unknown>) => e.categoriaEdad === 'ANTIGUO').length,
      recomendacionesReemplazo: equiposObsoletos.filter((e: Record<string, unknown>) => e.categoriaEdad === 'OBSOLETO').length
    }
  };
}

// Función para reporte de costo de mantenimiento
async function generarReporteCostoMantenimiento(
  fechaDesde?: string | null, 
  fechaHasta?: string | null, 
  sucursal?: string | null
) {
  // Implementación con costos estimados
  const costos = await executeQuery<MantenimientoReporte>(`
    SELECT 
      s.nombre AS sucursal,
      te.nombre AS tipoEquipo,
      mi.tipo_mantenimiento,
      COUNT(*) AS cantidadMantenimientos,
      SUM(mi.estimacion_horas) AS totalHorasEstimadas,
      SUM(mi.estimacion_horas * 350) AS costoEstimado -- $350 por hora técnico
    FROM movimientoinventario mi
    INNER JOIN tipomovimiento tm ON mi.idTipoMov = tm.id
    INNER JOIN equipo e ON mi.no_serie = e.no_serie
    INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
    INNER JOIN layout l ON e.idLayout = l.id
    INNER JOIN sucursales s ON l.centro = s.id
    WHERE tm.nombre = 'MANTENIMIENTO'
    ${fechaDesde ? 'AND DATE(mi.fecha) >= ?' : ''}
    ${fechaHasta ? 'AND DATE(mi.fecha) <= ?' : ''}
    ${sucursal ? 'AND s.id = ?' : ''}
    GROUP BY s.nombre, te.nombre, mi.tipo_mantenimiento
    ORDER BY costoEstimado DESC
  `, [fechaDesde, fechaHasta, sucursal].filter(Boolean));

  return {
    costos,
    resumen: {
      costoTotal: costos.reduce((sum: number, c) => sum + (c.costoEstimado || 0), 0),
      horasTotales: costos.reduce((sum: number, c) => sum + (c.totalHorasEstimadas || 0), 0),
      mantenimientosTotales: costos.reduce((sum: number, c) => sum + (c.cantidadMantenimientos || 0), 0)
    }
  };
}

// Función para reporte de eficiencia de sucursales
async function generarReporteEficienciaSucursales(
  fechaDesde?: string | null, 
  fechaHasta?: string | null
) {
  const eficiencia = await executeQuery<MantenimientoReporte>(`
    SELECT 
      s.nombre AS sucursal,
      z.nombre AS zona,
      COUNT(DISTINCT e.no_serie) AS totalEquipos,
      COUNT(DISTINCT CASE WHEN ee.nombre = 'En uso' THEN e.no_serie END) AS equiposEnUso,
      COUNT(DISTINCT CASE WHEN ee.nombre = 'Disponible' THEN e.no_serie END) AS equiposDisponibles,
      COUNT(DISTINCT CASE WHEN ee.nombre = 'Mantenimiento' THEN e.no_serie END) AS equiposEnMantenimiento,
      COUNT(mi.id) AS totalMovimientos,
      AVG(CASE 
        WHEN mi.fechaFin IS NOT NULL 
        THEN DATEDIFF(mi.fechaFin, mi.fecha)
        ELSE NULL
      END) AS promedioDuracionMovimientos,
      (COUNT(DISTINCT CASE WHEN ee.nombre = 'En uso' THEN e.no_serie END) * 100.0 / COUNT(DISTINCT e.no_serie)) AS porcentajeUtilizacion
    FROM sucursales s
    INNER JOIN zonas z ON s.zona = z.id
    INNER JOIN layout l ON s.id = l.centro
    INNER JOIN equipo e ON l.id = e.idLayout
    INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
    LEFT JOIN movimientoinventario mi ON e.no_serie = mi.no_serie
    ${fechaDesde || fechaHasta ? 'WHERE' : ''}
    ${fechaDesde ? 'DATE(mi.fecha) >= ?' : ''}
    ${fechaDesde && fechaHasta ? 'AND' : ''}
    ${fechaHasta ? 'DATE(mi.fecha) <= ?' : ''}
    GROUP BY s.id, s.nombre, z.nombre
    ORDER BY porcentajeUtilizacion DESC
  `, [fechaDesde, fechaHasta].filter(Boolean));

  return {
    eficiencia,
    resumen: {
      sucursalMasEficiente: eficiencia[0]?.sucursal || 'N/A',
      promedioUtilizacion: eficiencia.length > 0 ? eficiencia.reduce((sum: number, e) => sum + (e.porcentajeUtilizacion || 0), 0) / eficiencia.length : 0
    }
  };
}

// Función para convertir datos a CSV
function convertirACSV(data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ];
  
  return csvRows.join('\n');
}