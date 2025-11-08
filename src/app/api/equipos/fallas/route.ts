import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

interface FallaData {
  id?: number;
  no_serie: string;
  tipo_falla: 'HARDWARE' | 'SOFTWARE' | 'CONECTIVIDAD' | 'SUMINISTROS' | 'MECANICA' | 'ELECTRICA' | 'OTRA';
  descripcion_problema: string;
  sintomas: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  usuario_reporta: string;
  fecha_reporte: string;
  fecha_solucion?: string;
  tecnico_asignado?: string;
  solucion_aplicada?: string;
  estatus: 'ABIERTA' | 'EN_PROCESO' | 'RESUELTA' | 'CANCELADA';
  tiempo_solucion_horas?: number;
  observaciones?: string;
  ubicacion_falla: string;
  impacto: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  requiere_repuestos: boolean;
  repuestos_utilizados?: string;
  costo_reparacion?: number;
}

interface FallaResult extends FallaData {
  nombreEquipo: string;
  tipoEquipo: string;
  sucursal: string;
  diasAbierta: number;
}

interface EstadisticasFallas {
  total: number;
  abiertas: number;
  en_proceso: number;
  resueltas: number;
  promedio_solucion_horas: number;
  por_tipo: {
    hardware: number;
    software: number;
    conectividad: number;
    suministros: number;
    mecanica: number;
    electrica: number;
    otra: number;
  };
  por_prioridad: {
    baja: number;
    normal: number;
    alta: number;
    critica: number;
  };
  por_tecnico: Array<{
    tecnico: string;
    total_asignadas: number;
    resueltas: number;
    en_proceso: number;
    promedio_horas: number;
  }>;
}

// GET - Consultar fallas con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estatus = searchParams.get('estatus') || 'ABIERTA';
    const prioridad = searchParams.get('prioridad');
    const tipo = searchParams.get('tipo');
    const tecnico = searchParams.get('tecnico');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');
    const sucursal = searchParams.get('sucursal');

    // Consulta base
    let query = `
      SELECT 
        f.*,
        e.nombreEquipo,
        e.TipoEquipo as tipoEquipo,
        e.SucursalActual as sucursal,
        DATEDIFF(NOW(), f.fecha_reporte) as diasAbierta
      FROM fallas_equipos f
      INNER JOIN equipo e ON f.no_serie = e.no_serie
      WHERE 1=1
    `;

    const params: any[] = [];

    // Aplicar filtros
    if (estatus) {
      query += ` AND f.estatus = ?`;
      params.push(estatus);
    }

    if (prioridad) {
      query += ` AND f.prioridad = ?`;
      params.push(prioridad);
    }

    if (tipo) {
      query += ` AND f.tipo_falla = ?`;
      params.push(tipo);
    }

    if (tecnico) {
      query += ` AND f.tecnico_asignado LIKE ?`;
      params.push(`%${tecnico}%`);
    }

    if (fechaDesde) {
      query += ` AND f.fecha_reporte >= ?`;
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      query += ` AND f.fecha_reporte <= ?`;
      params.push(fechaHasta);
    }

    if (sucursal) {
      query += ` AND e.SucursalActual LIKE ?`;
      params.push(`%${sucursal}%`);
    }

    query += ` ORDER BY f.fecha_reporte DESC`;

    const fallas = await executeQuery(query, params) as FallaResult[];

    // Generar estadísticas
    const estadisticas: EstadisticasFallas = {
      total: fallas.length,
      abiertas: fallas.filter(f => f.estatus === 'ABIERTA').length,
      en_proceso: fallas.filter(f => f.estatus === 'EN_PROCESO').length,
      resueltas: fallas.filter(f => f.estatus === 'RESUELTA').length,
      promedio_solucion_horas: 0,
      por_tipo: {
        hardware: fallas.filter(f => f.tipo_falla === 'HARDWARE').length,
        software: fallas.filter(f => f.tipo_falla === 'SOFTWARE').length,
        conectividad: fallas.filter(f => f.tipo_falla === 'CONECTIVIDAD').length,
        suministros: fallas.filter(f => f.tipo_falla === 'SUMINISTROS').length,
        mecanica: fallas.filter(f => f.tipo_falla === 'MECANICA').length,
        electrica: fallas.filter(f => f.tipo_falla === 'ELECTRICA').length,
        otra: fallas.filter(f => f.tipo_falla === 'OTRA').length,
      },
      por_prioridad: {
        baja: fallas.filter(f => f.prioridad === 'BAJA').length,
        normal: fallas.filter(f => f.prioridad === 'NORMAL').length,
        alta: fallas.filter(f => f.prioridad === 'ALTA').length,
        critica: fallas.filter(f => f.prioridad === 'CRITICA').length,
      },
      por_tecnico: []
    };

    // Calcular promedio de horas de solución
    const fallasResueltas = fallas.filter(f => f.estatus === 'RESUELTA' && f.tiempo_solucion_horas);
    if (fallasResueltas.length > 0) {
      const totalHoras = fallasResueltas.reduce((sum, f) => sum + (f.tiempo_solucion_horas || 0), 0);
      estadisticas.promedio_solucion_horas = Math.round((totalHoras / fallasResueltas.length) * 100) / 100;
    }

    // Estadísticas por técnico
    const tecnicosMap = new Map();
    fallas.forEach(falla => {
      if (falla.tecnico_asignado) {
        if (!tecnicosMap.has(falla.tecnico_asignado)) {
          tecnicosMap.set(falla.tecnico_asignado, {
            tecnico: falla.tecnico_asignado,
            total_asignadas: 0,
            resueltas: 0,
            en_proceso: 0,
            total_horas: 0,
            promedio_horas: 0
          });
        }
        
        const tecnico = tecnicosMap.get(falla.tecnico_asignado);
        tecnico.total_asignadas++;
        
        if (falla.estatus === 'RESUELTA') {
          tecnico.resueltas++;
          if (falla.tiempo_solucion_horas) {
            tecnico.total_horas += falla.tiempo_solucion_horas;
          }
        } else if (falla.estatus === 'EN_PROCESO') {
          tecnico.en_proceso++;
        }
      }
    });

    // Calcular promedios por técnico
    tecnicosMap.forEach(tecnico => {
      if (tecnico.resueltas > 0) {
        tecnico.promedio_horas = Math.round((tecnico.total_horas / tecnico.resueltas) * 100) / 100;
      }
      delete tecnico.total_horas;
    });

    estadisticas.por_tecnico = Array.from(tecnicosMap.values());

    return NextResponse.json({
      success: true,
      data: {
        fallas,
        estadisticas
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error consultando fallas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// POST - Crear nueva falla
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      no_serie,
      tipo_falla,
      descripcion_problema,
      sintomas,
      prioridad = 'NORMAL',
      usuario_reporta,
      tecnico_asignado,
      ubicacion_falla,
      impacto = 'MEDIO',
      requiere_repuestos = false,
      observaciones = ''
    } = body as FallaData;

    // Validaciones
    if (!no_serie || !tipo_falla || !descripcion_problema || !usuario_reporta || !ubicacion_falla) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: no_serie, tipo_falla, descripcion_problema, usuario_reporta, ubicacion_falla'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar que el equipo existe
    const equipoQuery = `SELECT no_serie, nombreEquipo FROM equipo WHERE no_serie = ?`;
    const equipoResult = await executeQuery(equipoQuery, [no_serie]);
    
    if (equipoResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    // Crear tabla si no existe
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS fallas_equipos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        no_serie VARCHAR(50) NOT NULL,
        tipo_falla ENUM('HARDWARE', 'SOFTWARE', 'CONECTIVIDAD', 'SUMINISTROS', 'MECANICA', 'ELECTRICA', 'OTRA') NOT NULL,
        descripcion_problema TEXT NOT NULL,
        sintomas TEXT,
        prioridad ENUM('BAJA', 'NORMAL', 'ALTA', 'CRITICA') DEFAULT 'NORMAL',
        usuario_reporta VARCHAR(100) NOT NULL,
        fecha_reporte TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_solucion TIMESTAMP NULL,
        tecnico_asignado VARCHAR(100),
        solucion_aplicada TEXT,
        estatus ENUM('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA') DEFAULT 'ABIERTA',
        tiempo_solucion_horas DECIMAL(8,2),
        observaciones TEXT,
        ubicacion_falla VARCHAR(200) NOT NULL,
        impacto ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO') DEFAULT 'MEDIO',
        requiere_repuestos BOOLEAN DEFAULT FALSE,
        repuestos_utilizados TEXT,
        costo_reparacion DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_no_serie (no_serie),
        INDEX idx_estatus (estatus),
        INDEX idx_fecha_reporte (fecha_reporte),
        INDEX idx_tecnico (tecnico_asignado),
        FOREIGN KEY (no_serie) REFERENCES equipo(no_serie) ON UPDATE CASCADE
      )
    `;

    await executeQuery(createTableQuery);

    // Insertar nueva falla
    const insertQuery = `
      INSERT INTO fallas_equipos (
        no_serie, tipo_falla, descripcion_problema, sintomas, prioridad,
        usuario_reporta, tecnico_asignado, ubicacion_falla, impacto,
        requiere_repuestos, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(insertQuery, [
      no_serie,
      tipo_falla,
      descripcion_problema,
      sintomas || '',
      prioridad,
      usuario_reporta,
      tecnico_asignado || null,
      ubicacion_falla,
      impacto,
      requiere_repuestos,
      observaciones
    ]);

    // Actualizar estado del equipo si es necesario
    if (prioridad === 'CRITICA' || impacto === 'CRITICO') {
      await executeQuery(
        `UPDATE equipo SET EstatusEquipo = 'Fuera de Servicio' WHERE no_serie = ?`,
        [no_serie]
      );
    } else {
      await executeQuery(
        `UPDATE equipo SET EstatusEquipo = 'Con Falla' WHERE no_serie = ?`,
        [no_serie]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Falla registrada exitosamente',
      data: {
        fallaId: (result as any).insertId,
        no_serie,
        tipo_falla,
        estatus: 'ABIERTA'
      }
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error creando falla:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// PUT - Actualizar falla existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      estatus,
      tecnico_asignado,
      solucion_aplicada,
      tiempo_solucion_horas,
      repuestos_utilizados,
      costo_reparacion,
      observaciones
    } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID de falla requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    let updateQuery = `UPDATE fallas_equipos SET updated_at = CURRENT_TIMESTAMP`;
    const params: any[] = [];

    if (estatus) {
      updateQuery += `, estatus = ?`;
      params.push(estatus);
      
      if (estatus === 'RESUELTA') {
        updateQuery += `, fecha_solucion = CURRENT_TIMESTAMP`;
      }
    }

    if (tecnico_asignado !== undefined) {
      updateQuery += `, tecnico_asignado = ?`;
      params.push(tecnico_asignado);
      
      if (tecnico_asignado && estatus !== 'RESUELTA') {
        updateQuery += `, estatus = 'EN_PROCESO'`;
      }
    }

    if (solucion_aplicada !== undefined) {
      updateQuery += `, solucion_aplicada = ?`;
      params.push(solucion_aplicada);
    }

    if (tiempo_solucion_horas !== undefined) {
      updateQuery += `, tiempo_solucion_horas = ?`;
      params.push(tiempo_solucion_horas);
    }

    if (repuestos_utilizados !== undefined) {
      updateQuery += `, repuestos_utilizados = ?`;
      params.push(repuestos_utilizados);
    }

    if (costo_reparacion !== undefined) {
      updateQuery += `, costo_reparacion = ?`;
      params.push(costo_reparacion);
    }

    if (observaciones !== undefined) {
      updateQuery += `, observaciones = ?`;
      params.push(observaciones);
    }

    updateQuery += ` WHERE id = ?`;
    params.push(id);

    await executeQuery(updateQuery, params);

    // Si la falla se resolvió, actualizar estado del equipo
    if (estatus === 'RESUELTA') {
      // Buscar el número de serie de la falla
      const fallaQuery = `SELECT no_serie FROM fallas_equipos WHERE id = ?`;
      const fallaResult = await executeQuery(fallaQuery, [id]);
      
      if (fallaResult.length > 0) {
        const no_serie = fallaResult[0].no_serie;
        
        // Verificar si hay otras fallas abiertas para este equipo
        const otrasFallasQuery = `
          SELECT COUNT(*) as count 
          FROM fallas_equipos 
          WHERE no_serie = ? AND estatus IN ('ABIERTA', 'EN_PROCESO') AND id != ?
        `;
        const otrasFallas = await executeQuery(otrasFallasQuery, [no_serie, id]);
        
        // Si no hay otras fallas, poner el equipo como activo
        if (otrasFallas[0].count === 0) {
          await executeQuery(
            `UPDATE equipo SET EstatusEquipo = 'Activo' WHERE no_serie = ?`,
            [no_serie]
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Falla actualizada exitosamente'
    } as ApiResponse<any>);

  } catch (error) {
    console.error('Error actualizando falla:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}