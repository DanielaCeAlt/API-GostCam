import { getConnection } from '@/lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  let connection;
  
  try {
    connection = await getConnection();
    
    // Obtener todas las tablas
    const [tables] = await connection.execute('SHOW TABLES');
    
    // Obtener estructura de la tabla equipo
    const [equipoStructure] = await connection.execute('DESCRIBE equipo');
    
    return NextResponse.json({
      tables: tables,
      equipoStructure: equipoStructure
    });
  } catch (error) {
    console.error('Error inspeccionando tablas:', error);
    return NextResponse.json(
      { error: 'Error inspeccionando base de datos', details: error },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}