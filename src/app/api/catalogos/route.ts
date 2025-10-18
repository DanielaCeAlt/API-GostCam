// =============================================
// API: CATÁLOGOS DEL SISTEMA
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { getCatalogos } from '@/lib/database';
import { ApiResponse } from '@/types/database';

export async function GET(request: NextRequest) {
  try {
    const catalogos = await getCatalogos();

    return NextResponse.json({
      success: true,
      data: catalogos,
      message: 'Catálogos obtenidos exitosamente'
    } as ApiResponse<Record<string, unknown[]>>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo catálogos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<Record<string, unknown[]>>, { status: 500 });
  }
}
