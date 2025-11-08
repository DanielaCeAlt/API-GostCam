import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    console.log('Inspeccionando estructura de tabla equipo...');
    
    // Obtener estructura de la tabla equipo
    const tableStructure = await executeQuery('DESCRIBE equipo');
    
    // Obtener una muestra de datos para ver qué campos contienen información de ubicación
    const sampleData = await executeQuery('SELECT * FROM equipo LIMIT 5');
    
    // Obtener campos que podrían contener información de ubicación/sucursal
    const locationFields = tableStructure
      .filter((field: any) => {
        const fieldName = field.Field.toLowerCase();
        return fieldName.includes('sucursal') || 
               fieldName.includes('ubicacion') || 
               fieldName.includes('area') || 
               fieldName.includes('posicion') ||
               fieldName.includes('lugar') ||
               fieldName.includes('sede');
      });

    return NextResponse.json({
      success: true,
      data: {
        tableStructure,
        sampleData,
        locationFields,
        fieldNames: tableStructure.map((f: any) => f.Field)
      }
    });

  } catch (error) {
    console.error('Error inspeccionando tabla equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al inspeccionar tabla',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}