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
    const body: EquipoCreateRequest = await request.json();
    
    const {
      no_serie,
      nombreEquipo,
      modelo,
      idTipoEquipo,
      numeroActivo,
      idUsuarios,
      idPosicion,
      idEstatus,
      idCentro
    } = body;

    // Validar campos requeridos
    if (!no_serie || !nombreEquipo || !modelo || !idTipoEquipo || !numeroActivo || !idUsuarios || !idPosicion || !idEstatus) {
      return NextResponse.json({
        success: false,
        error: 'Todos los campos son requeridos'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar si el número de serie ya existe
    const existingEquipo = await executeQuery(
      'SELECT no_serie FROM equipo WHERE no_serie = ?',
      [no_serie]
    );

    if (existingEquipo.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'El número de serie ya existe'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar si el número de activo ya existe
    const existingActivo = await executeQuery(
      'SELECT numeroActivo FROM equipo WHERE numeroActivo = ?',
      [numeroActivo]
    );

    if (existingActivo.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'El número de activo ya existe'
      } as ApiResponse<any>, { status: 400 });
    }

    // Usar el procedimiento almacenado para registrar el equipo
    try {
      await callStoredProcedure('sp_RegistrarAltaEquipo', [
        no_serie,
        nombreEquipo,
        modelo,
        idTipoEquipo,
        numeroActivo,
        idUsuarios,
        idPosicion,
        idEstatus,
        idCentro
      ]);
    } catch (spError) {
      console.log('Error con stored procedure, intentando inserción directa:', spError);
      
      // Si el procedimiento almacenado falla, intentar inserción directa
      await executeQuery(`
        INSERT INTO equipo (
          no_serie, 
          nombreEquipo, 
          modelo, 
          idTipoEquipo, 
          numeroActivo, 
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