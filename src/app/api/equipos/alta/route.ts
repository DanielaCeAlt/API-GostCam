// =============================================
// API: ALTA DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
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
    
    // Obtener token de autorización del header
    const authHeader = request.headers.get('authorization');
    
    console.log('📦 Body recibido:', body);
    console.log('🔑 Auth header:', authHeader);
    
    // Hacer proxy a tu API externa
    try {
      console.log('🚀 Intentando conectar con API externa...');
      
      // Intentar con token actual primero
      let response = await fetch('http://localhost:8000/equipos/alta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(authHeader && { 'Authorization': authHeader }),
        },
        body: JSON.stringify(body),
      });

      // Si falla por autenticación, intentar obtener token nuevo
      if (response.status === 401) {
        console.log('🔄 Token inválido, intentando login automático...');
        
        try {
          const loginResponse = await fetch('http://localhost:8000/autenticacion/iniciar-sesion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              correo: 'admin@gostcam.com',
              contraseña: 'Pass123'
            }),
          });

          if (loginResponse.ok) {
            const loginResult = await loginResponse.json();
            console.log('✅ Login exitoso, estructura completa:', loginResult);
            console.log('✅ Campos disponibles:', Object.keys(loginResult));
            
            // Buscar token en diferentes ubicaciones posibles
            let tokenField = null;
            
            // Estructura estándar: { access_token: "...", token: "..." }
            tokenField = loginResult.access_token || loginResult.token || loginResult.accessToken || loginResult.bearer_token;
            
            // Si no se encuentra, buscar en la propiedad 'usuario'
            if (!tokenField && loginResult.usuario) {
              console.log('� Buscando token en usuario:', loginResult.usuario);
              tokenField = loginResult.usuario.access_token || loginResult.usuario.token || loginResult.usuario.accessToken;
            }
            
            // Si aún no se encuentra, intentar obtener directamente como string
            if (!tokenField && typeof loginResult === 'string') {
              tokenField = loginResult;
            }
            
            if (tokenField) {
              console.log('�🔑 Token encontrado:', tokenField.substring(0, 20) + '...');
              console.log('🔄 Reintentando con nuevo token...');
              response = await fetch('http://localhost:8000/equipos/alta', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${tokenField}`,
                },
                body: JSON.stringify(body),
              });
              console.log('📡 Segundo intento - Status:', response.status);
            } else {
              console.error('❌ No se encontró token en la respuesta del login');
              console.error('📄 Estructura completa de respuesta:', JSON.stringify(loginResult, null, 2));
            }
          } else {
            const loginError = await loginResponse.text();
            console.error('❌ Login falló:', loginResponse.status, loginError);
          }
        } catch (loginError) {
          console.error('💥 Error en login:', loginError);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}:`, errorText);
        
        return NextResponse.json({
          success: false,
          error: `Error ${response.status} en API externa`,
          details: errorText,
          message: 'No se pudo crear el equipo'
        } as ApiResponse<any>, { status: response.status });
      }

      const result = await response.json();
      console.log('🎉 Equipo creado exitosamente:', result);

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Equipo creado exitosamente'
      } as ApiResponse<any>, { status: 201 });

    } catch (fetchError) {
      console.error('💥 Error de conexión:', fetchError);
      
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con la API externa',
        details: fetchError instanceof Error ? fetchError.message : 'Error desconocido',
        message: 'Verifica que tu API esté corriendo en localhost:8000'
      } as ApiResponse<any>, { status: 503 });
    }

  } catch (error) {
    console.error('💥 Error general:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    } as ApiResponse<any>, { status: 500 });
  }
}