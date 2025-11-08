import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Datos de prueba para sucursales
    const sucursales = [
      { id: 'SUC001', nombre: 'Sucursal Principal', codigo: 'PRINCIPAL', zona: 'Centro', estado: 'Activa' },
      { id: 'SUC002', nombre: 'Sucursal Norte', codigo: 'NORTE', zona: 'Norte', estado: 'Activa' },
      { id: 'SUC003', nombre: 'Sucursal Sur', codigo: 'SUR', zona: 'Sur', estado: 'Activa' },
      { id: 'SUC004', nombre: 'Sucursal Este', codigo: 'ESTE', zona: 'Este', estado: 'Activa' },
      { id: 'GENERAL', nombre: 'General', codigo: 'GEN', zona: 'General', estado: 'Activa' }
    ];

    // Datos de prueba para posiciones
    const posiciones = [
      // Sucursal Principal
      { id: 1, nombre: 'Recepción', sucursalId: 'SUC001', descripcion: 'Área de recepción principal', tipo: 'Fija' },
      { id: 2, nombre: 'Oficina Administrativa', sucursalId: 'SUC001', descripcion: 'Área administrativa principal', tipo: 'Oficina' },
      { id: 3, nombre: 'Almacén General', sucursalId: 'SUC001', descripcion: 'Almacén principal de equipos', tipo: 'Almacen' },
      { id: 4, nombre: 'Sala de Juntas', sucursalId: 'SUC001', descripcion: 'Sala de reuniones ejecutiva', tipo: 'Oficina' },
      { id: 5, nombre: 'Entrada Principal', sucursalId: 'SUC001', descripcion: 'Acceso principal del edificio', tipo: 'Fija' },
      
      // Sucursal Norte
      { id: 6, nombre: 'Recepción', sucursalId: 'SUC002', descripcion: 'Área de recepción sucursal norte', tipo: 'Fija' },
      { id: 7, nombre: 'Oficina Local', sucursalId: 'SUC002', descripcion: 'Oficina local sucursal norte', tipo: 'Oficina' },
      { id: 8, nombre: 'Almacén Local', sucursalId: 'SUC002', descripcion: 'Almacén local sucursal norte', tipo: 'Almacen' },
      { id: 9, nombre: 'Área de Trabajo', sucursalId: 'SUC002', descripcion: 'Área de trabajo general', tipo: 'Produccion' },
      
      // Sucursal Sur
      { id: 10, nombre: 'Recepción', sucursalId: 'SUC003', descripcion: 'Área de recepción sucursal sur', tipo: 'Fija' },
      { id: 11, nombre: 'Oficina Gerencial', sucursalId: 'SUC003', descripcion: 'Oficina gerencial sucursal sur', tipo: 'Oficina' },
      { id: 12, nombre: 'Depósito', sucursalId: 'SUC003', descripcion: 'Depósito de equipos', tipo: 'Almacen' },
      
      // Sucursal Este  
      { id: 13, nombre: 'Recepción', sucursalId: 'SUC004', descripcion: 'Área de recepción sucursal este', tipo: 'Fija' },
      { id: 14, nombre: 'Oficina Regional', sucursalId: 'SUC004', descripcion: 'Oficina regional sucursal este', tipo: 'Oficina' },
      
      // Posiciones generales
      { id: 15, nombre: 'Sin Asignar', sucursalId: 'GENERAL', descripcion: 'Ubicación temporal sin asignar', tipo: 'Temporal' },
      { id: 16, nombre: 'En Tránsito', sucursalId: 'GENERAL', descripcion: 'Equipo en proceso de traslado', tipo: 'Temporal' },
      { id: 17, nombre: 'Mantenimiento', sucursalId: 'GENERAL', descripcion: 'Área de mantenimiento', tipo: 'Temporal' }
    ];

    // Datos de catálogos adicionales
    const tiposEquipo = [
      { id: 1, nombre: 'Computadora', descripcion: 'Equipos de cómputo' },
      { id: 2, nombre: 'Impresora', descripcion: 'Impresoras y multifuncionales' },
      { id: 3, nombre: 'Scanner', descripcion: 'Escáneres de documentos' },
      { id: 4, nombre: 'Monitor', descripcion: 'Monitores y pantallas' },
      { id: 5, nombre: 'Proyector', descripcion: 'Proyectores multimedia' }
    ];

    const estatusEquipos = [
      { id: 1, nombre: 'Activo', descripcion: 'Equipo en uso activo' },
      { id: 2, nombre: 'Disponible', descripcion: 'Equipo disponible para asignación' },
      { id: 3, nombre: 'Mantenimiento', descripcion: 'Equipo en mantenimiento' },
      { id: 4, nombre: 'Baja', descripcion: 'Equipo dado de baja' },
      { id: 5, nombre: 'Reparación', descripcion: 'Equipo en reparación' }
    ];

    const usuarios = [
      { id: 1, nombre: 'Admin Sistema', email: 'admin@gostcam.com', rol: 'Administrador' },
      { id: 2, nombre: 'Juan Pérez', email: 'jperez@gostcam.com', rol: 'Usuario' },
      { id: 3, nombre: 'María García', email: 'mgarcia@gostcam.com', rol: 'Supervisor' },
      { id: 4, nombre: 'Carlos López', email: 'clopez@gostcam.com', rol: 'Usuario' }
    ];

    return NextResponse.json({
      success: true,
      data: {
        sucursales,
        posiciones,
        tiposEquipo,
        estatusEquipos,
        usuarios,
        // Catálogos adicionales
        estados: [],
        municipios: [],
        zonas: []
      },
      message: 'Catálogos de prueba generados correctamente'
    });

  } catch (error) {
    console.error('Error generando catálogos de prueba:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al generar catálogos de prueba',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}