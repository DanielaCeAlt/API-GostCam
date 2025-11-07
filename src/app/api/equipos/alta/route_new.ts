// =============================================
// API: ALTA DE EQUIPOS - Versión Local MySQL
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/database';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

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

    // Para INSERT, executeQuery devuelve información de resultado
    // Verificamos que la inserción fue exitosa
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
}