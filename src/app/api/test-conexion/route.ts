import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Probando conexión a localhost:8000...');
    
    const response = await fetch('http://localhost:8000/', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con API externa',
      data: data
    });

  } catch (error) {
    console.error('Error conectando con API externa:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'No se pudo conectar con localhost:8000'
    }, { status: 500 });
  }
}