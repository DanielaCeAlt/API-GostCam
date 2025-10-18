// =============================================
// API: BÚSQUEDA AVANZADA DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { VistaEquipoCompleto, ApiResponse } from '@/types/database';

// Interfaces para tipado de búsqueda
interface CountResult {
  total: number;
}

// Usar la interfaz existente de VistaEquipoCompleto para consistencia
// interface EquipoSearchResult extends VistaEquipoCompleto {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      texto,
      tipoEquipo,
      estatus,
      sucursal,
      zona,
      fechaAltaDesde,
      fechaAltaHasta,
      usuario,
      codigoActivo,
      modelo,
      limite = 50,
      pagina = 1
    } = body;

    const whereConditions = [];
    const queryParams = [];

    // Construcción dinámica de la consulta WHERE
    if (texto) {
      whereConditions.push(`(
        e.no_serie LIKE ? OR 
        e.nombreEquipo LIKE ? OR 
        e.modelo LIKE ? OR 
        e.numeroActivo LIKE ?
      )`);
      const textoParam = `%${texto}%`;
      queryParams.push(textoParam, textoParam, textoParam, textoParam);
    }

    if (tipoEquipo && tipoEquipo !== '') {
      whereConditions.push('te.nombre = ?');
      queryParams.push(tipoEquipo);
    }

    if (estatus && estatus !== '') {
      whereConditions.push('ee.nombre = ?');
      queryParams.push(estatus);
    }

    if (sucursal && sucursal !== '') {
      whereConditions.push('s.id = ?');
      queryParams.push(sucursal);
    }

    if (zona && zona !== '') {
      whereConditions.push('z.nombre = ?');
      queryParams.push(zona);
    }

    if (fechaAltaDesde) {
      whereConditions.push('DATE(e.fechaAlta) >= ?');
      queryParams.push(fechaAltaDesde);
    }

    if (fechaAltaHasta) {
      whereConditions.push('DATE(e.fechaAlta) <= ?');
      queryParams.push(fechaAltaHasta);
    }

    if (usuario && usuario !== '') {
      whereConditions.push('u.nombre LIKE ?');
      queryParams.push(`%${usuario}%`);
    }

    if (codigoActivo && codigoActivo !== '') {
      whereConditions.push('e.numeroActivo LIKE ?');
      queryParams.push(`%${codigoActivo}%`);
    }

    if (modelo && modelo !== '') {
      whereConditions.push('e.modelo LIKE ?');
      queryParams.push(`%${modelo}%`);
    }

    // Calcular offset para paginación
    const offset = (pagina - 1) * limite;

    // Consulta base con joins
    const baseQuery = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        te.nombre AS TipoEquipo,
        te.descripcion AS DescripcionTipo,
        ee.nombre AS EstatusEquipo,
        u.nombre AS UsuarioAsignado,
        s.nombre AS SucursalActual,
        l.nombre AS AreaActual,
        z.nombre AS ZonaSucursal,
        est.nombre AS EstadoSucursal,
        m.nombre AS MunicipioSucursal,
        CASE 
          WHEN ee.nombre = 'Disponible' THEN 1
          WHEN ee.nombre = 'En uso' THEN 2
          WHEN ee.nombre = 'Mantenimiento' THEN 3
          ELSE 4
        END AS prioridad_orden
      FROM equipo e
      INNER JOIN tipoequipo te ON e.idTipoEquipo = te.id
      INNER JOIN estatusequipo ee ON e.idEstatus = ee.id
      INNER JOIN usuarios u ON e.idUsuarios = u.id
      INNER JOIN layout l ON e.idLayout = l.id
      INNER JOIN sucursales s ON l.centro = s.id
      INNER JOIN zonas z ON s.zona = z.id
      INNER JOIN estados est ON s.estado = est.id
      INNER JOIN municipios m ON s.municipio = m.id
    `;

    // Agregar condiciones WHERE si existen
    const whereClause = whereConditions.length > 0 
      ? ` WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Consulta de conteo para paginación
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM (${baseQuery}${whereClause}) as counted
    `;

    // Consulta principal con paginación y ordenamiento
    const mainQuery = `
      ${baseQuery}${whereClause}
      ORDER BY prioridad_orden ASC, e.fechaAlta DESC
      LIMIT ? OFFSET ?
    `;

    // Ejecutar consulta de conteo
    const countResult = await executeQuery<CountResult>(countQuery, queryParams);
    const total = Number(countResult[0]?.total || 0);

    // Ejecutar consulta principal
    const equipos = await executeQuery<VistaEquipoCompleto>(mainQuery, [...queryParams, limite, offset]);

    // Calcular información de paginación
    const totalPaginas = Math.ceil(total / limite);

    return NextResponse.json({
      success: true,
      data: equipos,
      pagination: {
        paginaActual: pagina,
        totalPaginas,
        totalRegistros: total,
        registrosPorPagina: limite,
        hayAnterior: pagina > 1,
        haySiguiente: pagina < totalPaginas
      },
      filtros: {
        texto,
        tipoEquipo,
        estatus,
        sucursal,
        zona,
        fechaAltaDesde,
        fechaAltaHasta,
        usuario,
        codigoActivo,
        modelo
      },
      message: `Se encontraron ${total} equipos`
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });

  } catch (error) {
    console.error('Error en búsqueda avanzada:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 500 });
  }
}