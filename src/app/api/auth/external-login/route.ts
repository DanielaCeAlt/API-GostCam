import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { correo, contraseña } = await request.json();
    
    console.log('Intentando autenticar con API externa:', { correo });
    
    // Hacer login en tu API externa
    const response = await fetch('http://localhost:8000/autenticacion/iniciar-sesion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ correo, contraseña }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en login externo:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas en API externa',
        details: errorText
      }, { status: 401 });
    }

    const result = await response.json();
    console.log('Login exitoso en API externa:', result);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Autenticación exitosa'
    });

  } catch (error) {
    console.error('Error en login externo:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error de conexión con API externa',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}