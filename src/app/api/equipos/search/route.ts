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

// GET: Búsqueda rápida por query parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q || q.trim() === '') {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Término de búsqueda vacío'
      } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });
    }

    console.log('🔍 Búsqueda rápida:', q);

    // Búsqueda simple en campos principales
    const query = `
      SELECT 
        e.no_serie,
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        te.nombreTipo AS TipoEquipo,
        ee.estatus AS EstatusEquipo,
        'Centro Principal' AS SucursalActual,
        'Área Principal' AS AreaActual,
        u.NombreUsuario AS UsuarioAsignado
      FROM equipo e
      LEFT JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
      LEFT JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      LEFT JOIN usuarios u ON e.idUsuarios = u.idUsuarios
      WHERE (e.eliminado = 0 OR e.eliminado IS NULL)
        AND (
          e.no_serie LIKE ? OR 
          e.nombreEquipo LIKE ? OR 
          e.modelo LIKE ? OR 
          e.numeroActivo LIKE ?
        )
      ORDER BY e.fechaAlta DESC
      LIMIT ?
    `;

    const searchTerm = `%${q.trim()}%`;
    const equipos = await executeQuery<VistaEquipoCompleto>(query, [
      searchTerm, searchTerm, searchTerm, searchTerm, limit
    ]);

    console.log('✅ Equipos encontrados (búsqueda rápida):', equipos.length);

    return NextResponse.json({
      success: true,
      data: equipos,
      message: `${equipos.length} equipos encontrados`
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });

  } catch (error) {
    console.error('❌ Error en búsqueda rápida:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      texto,
      tipoEquipo,
      estatus,
      sucursal,
      fechaAltaDesde,
      fechaAltaHasta,
      limite = 50,
      pagina = 1
    } = body;

    console.log('🔍 Búsqueda de equipos con filtros:', body);

    const whereConditions = [];
    const queryParams = [];

    // Construcción dinámica de la consulta WHERE usando la vista existente
    if (texto && texto.trim() !== '') {
      whereConditions.push(`(
        no_serie LIKE ? OR 
        nombreEquipo LIKE ? OR 
        modelo LIKE ? OR 
        numeroActivo LIKE ?
      )`);
      const textoParam = `%${texto.trim()}%`;
      queryParams.push(textoParam, textoParam, textoParam, textoParam);
    }

    if (tipoEquipo && tipoEquipo !== '') {
      whereConditions.push('TipoEquipo = ?');
      queryParams.push(tipoEquipo);
    }

    if (estatus && estatus !== '') {
      whereConditions.push('EstatusEquipo = ?');
      queryParams.push(estatus);
    }

    if (sucursal && sucursal !== '') {
      whereConditions.push('SucursalActual = ?');
      queryParams.push(sucursal);
    }

    if (fechaAltaDesde) {
      whereConditions.push('DATE(fechaAlta) >= ?');
      queryParams.push(fechaAltaDesde);
    }

    if (fechaAltaHasta) {
      whereConditions.push('DATE(fechaAlta) <= ?');
      queryParams.push(fechaAltaHasta);
    }

    // Calcular offset para paginación
    const offset = (pagina - 1) * limite;

    // Construir la consulta base usando la vista existente
    const baseQuery = 'SELECT * FROM GostCAM.VistaEquiposCompletos';
    
    // Agregar condiciones WHERE si existen
    const whereClause = whereConditions.length > 0 
      ? ` WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Consulta de conteo para paginación
    const countQuery = `SELECT COUNT(*) as total FROM GostCAM.VistaEquiposCompletos${whereClause}`;

    // Consulta principal con paginación y ordenamiento
    const mainQuery = `${baseQuery}${whereClause} ORDER BY fechaAlta DESC LIMIT ? OFFSET ?`;

    console.log('📊 Ejecutando consulta de conteo:', countQuery);
    console.log('📊 Parámetros de conteo:', queryParams);

    // Ejecutar consulta de conteo
    const countResult = await executeQuery<CountResult>(countQuery, queryParams);
    const totalRegistros = countResult[0]?.total || 0;

    console.log('📊 Total de registros encontrados:', totalRegistros);

    // Ejecutar consulta principal
    const finalParams = [...queryParams, limite, offset];
    console.log('📋 Ejecutando consulta principal:', mainQuery);
    console.log('📋 Parámetros finales:', finalParams);

    const equipos = await executeQuery<VistaEquipoCompleto>(mainQuery, finalParams);

    console.log('✅ Equipos encontrados:', equipos.length);

    // Calcular datos de paginación
    const totalPaginas = Math.ceil(totalRegistros / limite);
    const paginaActual = pagina;

    const pagination = {
      paginaActual,
      totalPaginas,
      totalRegistros,
      hayAnterior: paginaActual > 1,
      haySiguiente: paginaActual < totalPaginas
    };

    return NextResponse.json({
      success: true,
      data: equipos,
      pagination,
      message: `Se encontraron ${equipos.length} equipos`
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });

  } catch (error) {
    console.error('❌ Error en búsqueda de equipos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 500 });
  }
}