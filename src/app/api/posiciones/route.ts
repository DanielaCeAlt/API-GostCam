import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/database";

export async function GET() {
  try {
    let posiciones = [];
    
    try {
      // Intentar obtener posiciones de la tabla posiciones que creamos
      posiciones = await executeQuery(`
        SELECT id, nombre, sucursalId, descripcion, tipo
        FROM posiciones 
        WHERE activa = true
        ORDER BY sucursalId, nombre
      `);
    } catch (error) {
      console.warn('Tabla posiciones no encontrada, usando valores por defecto:', error);
      
      // Si la tabla no existe, usar valores por defecto
      posiciones = [
        { id: 1, nombre: 'Recepción Principal', sucursalId: 'Centro Principal', descripcion: 'Área de recepción principal', tipo: 'Oficina' },
        { id: 2, nombre: 'Oficina Administrativa', sucursalId: 'Centro Principal', descripcion: 'Área administrativa principal', tipo: 'Oficina' },
        { id: 3, nombre: 'Almacén General', sucursalId: 'Centro Principal', descripcion: 'Almacén principal de equipos', tipo: 'Almacen' },
        { id: 4, nombre: 'Área de Desarrollo', sucursalId: 'Centro Principal', descripcion: 'Área de desarrollo y testing', tipo: 'Laboratorio' },
        { id: 5, nombre: 'Sala de Servidores', sucursalId: 'Centro Principal', descripcion: 'Centro de datos y servidores', tipo: 'Datacenter' },
        { id: 6, nombre: 'Sucursal Norte - Recepción', sucursalId: 'Sucursal Norte', descripcion: 'Recepción sucursal norte', tipo: 'Oficina' },
        { id: 7, nombre: 'Sucursal Norte - Almacén', sucursalId: 'Sucursal Norte', descripcion: 'Almacén sucursal norte', tipo: 'Almacen' },
        { id: 8, nombre: 'Sucursal Sur - Recepción', sucursalId: 'Sucursal Sur', descripcion: 'Recepción sucursal sur', tipo: 'Oficina' },
        { id: 9, nombre: 'Sucursal Sur - Almacén', sucursalId: 'Sucursal Sur', descripcion: 'Almacén sucursal sur', tipo: 'Almacen' },
        { id: 10, nombre: 'Sin Asignar', sucursalId: 'General', descripcion: 'Ubicación temporal sin asignar', tipo: 'Temporal' }
      ];
    }

    return NextResponse.json({
      success: true,
      data: posiciones,
      message: 'Posiciones disponibles obtenidas'
    });

  } catch (error) {
    console.error('Error obteniendo posiciones:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}