// =============================================
// API: ENDPOINT PARA VERIFICAR EQUIPOS CREADOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando equipos en la base de datos...');

    // Obtener los últimos equipos de prueba
    const equipos = await executeQuery(`
      SELECT 
        e.no_serie, 
        e.nombreEquipo,
        e.modelo,
        e.numeroActivo,
        e.fechaAlta,
        te.nombreTipo as TipoEquipo,
        ee.estatus as EstatusEquipo,
        u.NombreUsuario as UsuarioAsignado
      FROM equipo e
      LEFT JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
      LEFT JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
      LEFT JOIN usuarios u ON e.idUsuarios = u.idUsuarios
      WHERE e.no_serie LIKE 'TEST-%'
      ORDER BY e.no_serie DESC
      LIMIT 10
    `);

    console.log(`✅ Encontrados ${equipos.length} equipos de prueba`);

    // También obtener un resumen de todos los equipos
    const totalEquipos = await executeQuery(`
      SELECT COUNT(*) as total FROM equipo
    `);

    const equiposPorEstatus = await executeQuery(`
      SELECT 
        est.estatus,
        COUNT(*) as cantidad
      FROM equipo e
      LEFT JOIN estatusequipo est ON e.idEstatus = est.idEstatus
      GROUP BY est.estatus
    `);

    return NextResponse.json({
      success: true,
      data: {
        equiposTest: equipos,
        resumen: {
          totalEquipos: totalEquipos[0]?.total || 0,
          equiposPorEstatus: equiposPorEstatus
        }
      },
      message: `Verificación completada. ${equipos.length} equipos de prueba encontrados.`
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error verificando equipos:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error verificando equipos en la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}