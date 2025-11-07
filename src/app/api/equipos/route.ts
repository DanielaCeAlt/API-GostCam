// =============================================
// API: GESTIÓN DE EQUIPOS
// =============================================

import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, getEquiposCompletos } from '@/lib/database';
import { VistaEquipoCompleto, ApiResponse } from '@/types/database';

// GET: Obtener equipos con filtros
export async function GET(request: NextRequest) {
  try {
    console.log('API Equipos GET llamada');
    
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sucursal: searchParams.get('sucursal') || undefined,
      tipoEquipo: searchParams.get('tipoEquipo') || undefined,
      estatus: searchParams.get('estatus') || undefined,
      usuario: searchParams.get('usuario') || undefined,
      busqueda: searchParams.get('busqueda') || undefined
    };

    // Remover filtros vacíos
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    console.log('Filtros aplicados:', filters);

    const equipos = await getEquiposCompletos(filters);

    return NextResponse.json({
      success: true,
      data: equipos,
      message: 'Equipos obtenidos exitosamente'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 200 });

  } catch (error) {
    console.error('Error obteniendo equipos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<VistaEquipoCompleto[]>, { status: 500 });
  }
}

// POST: Crear nuevo equipo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Normalizar nombres de campos para compatibilidad
    const noSerie = body.noSerie || body.no_serie;
    const idUsuarios = body.idUsuarios || body.usuarioAsignado;
    
    console.log('📦 Datos recibidos para crear equipo:', body);
    
    // Validar campos requeridos (usando valores normalizados)
    const camposRequeridos = [
      { campo: 'noSerie', valor: noSerie },
      { campo: 'nombreEquipo', valor: body.nombreEquipo },
      { campo: 'modelo', valor: body.modelo },
      { campo: 'idTipoEquipo', valor: body.idTipoEquipo },
      { campo: 'idEstatus', valor: body.idEstatus },
      { campo: 'idSucursal', valor: body.idSucursal }
    ];
    
    for (const { campo, valor } of camposRequeridos) {
      if (!valor) {
        console.log(`❌ Campo faltante: ${campo}`, valor);
        return NextResponse.json({
          success: false,
          error: `El campo ${campo} es requerido`,
          message: 'Datos incompletos'
        } as ApiResponse<any>, { status: 400 });
      }
    }

    // Funciones de mapeo para convertir IDs a nombres
    const mapearTipoEquipo = async (id: number): Promise<string> => {
      const tipos = await executeQuery(`
        SELECT TipoEquipo 
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY TipoEquipo) as rownum, TipoEquipo
          FROM (SELECT DISTINCT TipoEquipo FROM GostCAM.VistaEquiposCompletos WHERE TipoEquipo IS NOT NULL) tipos
        ) t 
        WHERE rownum = ?
      `, [id]);
      return tipos.length > 0 ? (tipos[0] as any).TipoEquipo : '';
    };

    const mapearSucursal = async (idOCodigo: string | number): Promise<number> => {
      console.log(`🔍 Mapeando sucursal ID/Código: ${idOCodigo} (tipo: ${typeof idOCodigo})`);
      
      if (!idOCodigo) {
        console.log('❌ ID de sucursal vacío, usando fallback');
        return 1;
      }
      
      try {
        let idCentro: string;
        
        // Si es un string, asumimos que es un código de centro (T008, T011, etc.)
        if (typeof idOCodigo === 'string') {
          idCentro = idOCodigo;
          console.log(`📍 Usando código de centro directamente: ${idCentro}`);
        } else {
          // Si es un número, buscamos en el catálogo
          const sucursales = await executeQuery(`
            SELECT idCentro, Sucursal
            FROM (
              SELECT ROW_NUMBER() OVER (ORDER BY Sucursal) as rownum, idCentro, Sucursal
              FROM sucursales
            ) s 
            WHERE rownum = ?
          `, [idOCodigo]);
          
          if (sucursales.length === 0) {
            console.log(`❌ No se encontró sucursal con ID ${idOCodigo}`);
            return 1;
          }
          
          idCentro = (sucursales[0] as any).idCentro;
          console.log(`📍 ID ${idOCodigo} mapeado a centro: ${idCentro}`);
        }
        
        // Obtener primera posición del centro
        const posicion = await executeQuery(`
          SELECT p.idPosicion, p.NombrePosicion, s.Sucursal
          FROM posicionequipo p 
          JOIN sucursales s ON p.idCentro = s.idCentro
          WHERE p.idCentro = ?
          ORDER BY p.idPosicion
          LIMIT 1
        `, [idCentro]);
        
        if (posicion.length > 0) {
          const idPosicionResult = (posicion[0] as any).idPosicion;
          console.log(`✅ Posición asignada: ${idPosicionResult} (${(posicion[0] as any).NombrePosicion}) en ${(posicion[0] as any).Sucursal}`);
          return idPosicionResult;
        }
        
        console.log('❌ No se encontró posición para el centro');
        return 1;
        
      } catch (error) {
        console.error('❌ Error en mapearSucursal:', error);
        return 1;
      }
    };

    const mapearUsuario = async (idONombre: string | number): Promise<number> => {
      if (!idONombre) return 1; // Usuario por defecto
      
      // Si ya es un número, devolverlo directamente
      if (typeof idONombre === 'number') {
        console.log(`✅ Usuario ID recibido: ${idONombre}`);
        return idONombre;
      }
      
      // Si es string, buscar por nombre
      try {
        const usuarios = await executeQuery(`
          SELECT ROW_NUMBER() OVER (ORDER BY UsuarioAsignado) as rownum, UsuarioAsignado
          FROM (
            SELECT DISTINCT UsuarioAsignado 
            FROM GostCAM.VistaEquiposCompletos 
            WHERE UsuarioAsignado IS NOT NULL AND UsuarioAsignado != ''
          ) usuarios
          ORDER BY UsuarioAsignado
        `);
        
        // Buscar usuario por nombre
        const usuarioEncontrado = usuarios.find((u: any) => 
          u.UsuarioAsignado.toLowerCase() === idONombre.toLowerCase()
        );
        
        if (usuarioEncontrado) {
          console.log(`✅ Usuario "${idONombre}" mapeado a ID: ${(usuarioEncontrado as any).rownum}`);
          return (usuarioEncontrado as any).rownum;
        }
        
        console.log(`⚠️ Usuario "${idONombre}" no encontrado, usando ID por defecto`);
        return 1; // Usuario por defecto si no se encuentra
        
      } catch (error) {
        console.error('❌ Error en mapearUsuario:', error);
        return 1;
      }
    };

    const mapearEstatus = async (id: number): Promise<string> => {
      const estatus = await executeQuery(`
        SELECT EstatusEquipo 
        FROM (
          SELECT ROW_NUMBER() OVER (ORDER BY EstatusEquipo) as rownum, EstatusEquipo
          FROM (SELECT DISTINCT EstatusEquipo FROM GostCAM.VistaEquiposCompletos WHERE EstatusEquipo IS NOT NULL) estatus
        ) e 
        WHERE rownum = ?
      `, [id]);
      return estatus.length > 0 ? (estatus[0] as any).EstatusEquipo : '';
    };

    // Convertir IDs a nombres reales
    console.log('📥 Datos recibidos - idSucursal:', body.idSucursal, 'tipo:', typeof body.idSucursal);
    
    const tipoEquipoNombre = await mapearTipoEquipo(parseInt(body.idTipoEquipo));
    // Mapear sucursal usando el código directamente
    const idPosicion = await mapearSucursal(body.idSucursal);
    const idUsuarioFinal = await mapearUsuario(idUsuarios);
    const estatusNombre = await mapearEstatus(parseInt(body.idEstatus));

    console.log('📊 Mapeos realizados:');
    console.log('- Tipo Equipo:', body.idTipoEquipo, '->', tipoEquipoNombre);
    console.log('- idPosicion calculada:', idPosicion);
    console.log('- Usuario:', idUsuarios, '->', idUsuarioFinal);
    console.log('- Estatus:', body.idEstatus, '->', estatusNombre);

    console.log('📦 Datos a insertar:');
    console.log('- No. Serie:', noSerie);
    console.log('- Nombre Equipo:', body.nombreEquipo);
    console.log('- Modelo:', body.modelo);
    console.log('- Tipo Equipo ID:', body.idTipoEquipo, '(', tipoEquipoNombre, ')');
    console.log('- Estatus ID:', body.idEstatus, '(', estatusNombre, ')');
    console.log('- Usuario ID:', idUsuarioFinal);
    console.log('- Posición ID:', idPosicion);

    // Verificar si el número de serie ya existe
    const equipoExistente = await executeQuery(
      'SELECT no_serie FROM Equipo WHERE no_serie = ?',
      [noSerie]
    );

    if (equipoExistente.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'El número de serie ya existe',
        message: 'No se puede crear el equipo'
      } as ApiResponse<any>, { status: 409 });
    }

    // Insertar equipo en la base de datos
    const query = `
      INSERT INTO Equipo (
        no_serie, nombreEquipo, modelo, numeroActivo, 
        idTipoEquipo, idEstatus, idUsuarios, idPosicion
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      noSerie,
      body.nombreEquipo, // Usar directamente el nombreEquipo del formulario
      body.modelo,
      body.numeroActivo || noSerie,
      body.idTipoEquipo,  // ID numérico del tipo de equipo
      body.idEstatus,     // ID numérico del estatus
      idUsuarioFinal,     // ID numérico del usuario mapeado
      idPosicion     // ID de posición calculado para la sucursal
    ];

    await executeQuery(query, valores);

    console.log('✅ Equipo creado exitosamente');

    return NextResponse.json({
      success: true,
      data: {
        no_serie: noSerie,
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

// PUT: Actualizar equipo existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { no_serie } = body;

    // Validar campos requeridos
    if (!no_serie) {
      return NextResponse.json({
        success: false,
        error: 'Número de serie es requerido'
      } as ApiResponse<any>, { status: 400 });
    }

    // Verificar si el equipo existe
    const existingEquipo = await executeQuery(
      'SELECT no_serie FROM Equipo WHERE no_serie = ?',
      [no_serie]
    );

    if (existingEquipo.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Equipo no encontrado'
      } as ApiResponse<any>, { status: 404 });
    }

    // Construir query de actualización dinámicamente
    const campos = [];
    const valores = [];
    
    if (body.nombreEquipo) {
      campos.push('nombreEquipo = ?');
      valores.push(body.nombreEquipo);
    }
    if (body.modelo) {
      campos.push('modelo = ?');
      valores.push(body.modelo);
    }
    if (body.idTipoEquipo) {
      campos.push('idTipoEquipo = ?');
      valores.push(parseInt(body.idTipoEquipo));
    }
    if (body.idEstatus) {
      campos.push('idEstatus = ?');
      valores.push(parseInt(body.idEstatus));
    }
    if (body.idSucursal) {
      campos.push('idSucursal = ?');
      valores.push(parseInt(body.idSucursal));
    }
    if (body.idUsuarios) {
      campos.push('idUsuarios = ?');
      valores.push(parseInt(body.idUsuarios));
    }

    if (campos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No hay campos para actualizar'
      } as ApiResponse<any>, { status: 400 });
    }

    valores.push(no_serie);

    // Actualizar equipo
    await executeQuery(`
      UPDATE Equipos 
      SET ${campos.join(', ')}
      WHERE no_serie = ?
    `, valores);

    return NextResponse.json({
      success: true,
      message: 'Equipo actualizado exitosamente'
    } as ApiResponse<any>, { status: 200 });

  } catch (error) {
    console.error('Error actualizando equipo:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    } as ApiResponse<any>, { status: 500 });
  }
}