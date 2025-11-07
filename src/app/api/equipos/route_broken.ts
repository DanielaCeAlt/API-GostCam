// =============================================
// API: GESTIÓN DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, callStoredProcedure, getEquiposCompletos } from '@/lib/database';
import { VistaEquipoCompleto, EquipoCreateRequest, ApiResponse, PaginatedResponse } from '@/types/database';

// GET: Obtener equipos con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sucursal: searchParams.get('sucursal') || undefined,
      tipoEquipo: searchParams.get('tipoEquipo') || undefined,
      estatus: searchParams.get('estatus') || undefined,
      usuario: searchParams.get('usuario') || undefined,
      busqueda: searchParams.get('busqueda') || undefined
    };

    // Remover filtros vacíos
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const equipos = await getEquiposCompletos(filters);

    return NextResponse.json({
      success: true,
      data: equipos,
      message: 'Equipos obtenidos exitosamente'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 500 });
  }
}

// POST: Crear nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar campos requeridos
    const camposRequeridos = ['no_serie', 'nombreEquipo', 'idTipoEquipo', 'idEstatus', 'idSucursal'];
    for (const campo of camposRequeridos) {
      if (!body[campo]) {
        return NextResponse.json({
          success: false,
          error: `El campo ${campo} es requerido`,
          message: 'Datos incompletos'
        } as ApiResponse<any>, { status: 400 });
      }
    }

    // Verificar si el número de serie ya existe
    const equipoExistente = await executeQuery(
      'SELECT no_serie FROM Equipos WHERE no_serie = ?',
      [body.no_serie]
    );

    if (equipoExistente.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'El número de serie ya existe',
        message: 'No se puede crear el equipo'
      } as ApiResponse<any>, { status: 409 });
    }

    // Preparar datos para inserción
    const datosEquipo = {
      no_serie: body.no_serie,
      nombreEquipo: body.nombreEquipo,
      modelo: body.modelo || '',
      numeroActivo: body.numeroActivo || '',
      idTipoEquipo: parseInt(body.idTipoEquipo),
      idEstatus: parseInt(body.idEstatus),
      idSucursal: parseInt(body.idSucursal),
      idPosicion: parseInt(body.idPosicion) || 1,
      idUsuarios: body.idUsuarios ? parseInt(body.idUsuarios) : null,
      valorEstimado: body.valorEstimado ? parseFloat(body.valorEstimado) : null,
      observaciones: body.observaciones || '',
      fechaAlta: new Date().toISOString().slice(0, 19).replace('T', ' '),
      imagen_ubicacion: body.imagen_ubicacion || ''
    };

    // Insertar equipo en la base de datos
    const query = `
      INSERT INTO Equipos (
        no_serie, nombreEquipo, modelo, numeroActivo, 
        idTipoEquipo, idEstatus, idSucursal, idPosicion, 
        idUsuarios, valorEstimado, observaciones, fechaAlta, imagen_ubicacion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      datosEquipo.no_serie,
      datosEquipo.nombreEquipo,
      datosEquipo.modelo,
      datosEquipo.numeroActivo,
      datosEquipo.idTipoEquipo,
      datosEquipo.idEstatus,
      datosEquipo.idSucursal,
      datosEquipo.idPosicion,
      datosEquipo.idUsuarios,
      datosEquipo.valorEstimado,
      datosEquipo.observaciones,
      datosEquipo.fechaAlta,
      datosEquipo.imagen_ubicacion
    ];

    const resultado = await executeQuery(query, valores);

    return NextResponse.json({
      success: true,
      data: {
        no_serie: datosEquipo.no_serie,
        mensaje: 'Equipo insertado correctamente'
      },
      message: 'Equipo creado exitosamente'
    } as ApiResponse<any>, { status: 201 });

  } catch (error) {
    console.error('💥 Error creando equipo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido',
      message: 'No se pudo crear el equipo'
    } as ApiResponse<any>, { status: 500 });
  } 
          idUsuarios, 
          idLayout, 
          idEstatus,
          fechaAlta
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        no_serie,
        nombreEquipo,
        modelo,
        idTipoEquipo,
        numeroActivo,
        idUsuarios,
        idPosicion,
        idEstatus
      ]);
    }

    return NextResponse.json({
      success: true,
      message: 'Equipo creado exitosamente'
    } as ApiResponse<any>, { status: 201 });

  } catch (error) {
    console.error('Error creando equipo:', error);
    
    // Verificar si es un error específico de la base de datos
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({
        success: false,
        error: 'El número de serie o activo ya existe'
      } as ApiResponse<any>, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}

// PUT: Actualizar equipo existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { no_serie, nombreEquipo, modelo, idTipoEquipo, numeroActivo, idUsuarios, idLayout, idEstatus } = body;

    // Validar campos requeridos
    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar si el equipo existe
    const existingEquipo = await executeQuery(
      'SELECT no_serie FROM Equipo WHERE no_serie = ?',
      [no_serie]
    );

    if (existingEquipo.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    // Actualizar equipo
    await executeQuery(`
      UPDATE Equipo 
      SET nombreEquipo = ?, modelo = ?, idTipoEquipo = ?, numeroActivo = ?, 
          idUsuarios = ?, idLayout = ?, idEstatus = ?
      WHERE no_serie = ?
    `, [nombreEquipo, modelo, idTipoEquipo, numeroActivo, idUsuarios, idLayout, idEstatus, no_serie]);

    return NextResponse.json({
      success: true,
      message: 'Equipo actualizado exitosamente'
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}