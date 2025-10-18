import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Probando autenticación con API externa...');
    
    // Hacer login en tu API externa
    const response = await fetch('http://localhost:8000/autenticacion/iniciar-sesion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        correo: 'admin@gostcam.com',
        contraseña: 'Pass123'
      }),
    });

    console.log('Status de login:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en login:', errorText);
      
      return NextResponse.json({
        success: false,
        error: 'Error en login',
        status: response.status,
        details: errorText
      });
    }

    const result = await response.json();
    console.log('Respuesta de login completa:', result);

    return NextResponse.json({
      success: true,
      message: 'Login exitoso',
      data: result,
      tokenFields: {
        access_token: !!result.access_token,
        token: !!result.token,
        accessToken: !!result.accessToken,
        bearer_token: !!result.bearer_token
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error de conexión',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}