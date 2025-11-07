// =============================================
// CONFIGURACIÓN DE BASE DE DATOS MYSQL
// =============================================

import mysql from 'mysql2/promise';
import { VistaEquipoCompleto, VistaMovimientoDetallado } from '@/types/database';

// Configuración de la conexión a la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'GostCAM',
  charset: 'utf8mb4',
  timezone: '+00:00',
};

// Pool de conexiones para mejor performance
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Función para obtener una conexión del pool
export const getConnection = async () => {
  try {
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw new Error('Failed to connect to database');
  }
};

// Función para ejecutar queries con manejo de errores
export const executeQuery = async <T = Record<string, unknown>>(
  query: string,
  params: (string | number | Date | null | undefined)[] = []
): Promise<T[]> => {
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función para ejecutar procedimientos almacenados
export const callStoredProcedure = async <T = Record<string, unknown>>(
  procedureName: string,
  params: (string | number | Date | null | undefined)[] = []
): Promise<T[]> => {
  const placeholders = params.map(() => '?').join(', ');
  const query = `CALL ${procedureName}(${placeholders})`;
  
  let connection;
  try {
    connection = await getConnection();
    const [rows] = await connection.execute(query, params);
    // Los procedimientos almacenados devuelven arrays anidados
    return Array.isArray(rows) && Array.isArray(rows[0]) ? rows[0] as T[] : rows as T[];
  } catch (error) {
    console.error('Stored procedure error:', error);
    console.error('Procedure:', procedureName);
    console.error('Params:', params);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Función para verificar la conexión a la base de datos
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await executeQuery('SELECT 1 as test');
    return result.length > 0;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Función para cerrar el pool de conexiones
export const closePool = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (error) {
    console.error('Error closing database pool:', error);
  }
};

// Funciones específicas para las vistas de GostCAM
export const getEquiposCompletos = async (filters?: {
  sucursal?: string;
  tipoEquipo?: string;
  estatus?: string;
  usuario?: string;
  busqueda?: string;
}): Promise<VistaEquipoCompleto[]> => {
  // Primero verificar si la vista existe
  try {
    const vistaExists = await executeQuery<any>('SHOW TABLES LIKE "VistaEquiposCompletos"', []);
    
    if (vistaExists.length === 0) {
      // Fallback a tabla equipos directamente
      return getEquiposFromTable(filters);
    }
  } catch (error) {
    return getEquiposFromTable(filters);
  }

  let query = 'SELECT * FROM GostCAM.VistaEquiposCompletos';
  const params: (string | number | Date | null | undefined)[] = [];
  const conditions: string[] = [];

  // TODO: Descomentar cuando se agreguen las columnas de eliminación lógica
  // conditions.push('(eliminado IS NULL OR eliminado = 0)');

  if (filters) {
    if (filters.sucursal) {
      // Buscar por nombre exacto de sucursal
      conditions.push('SucursalActual = ?');
      params.push(filters.sucursal);
    }
    if (filters.tipoEquipo) {
      conditions.push('TipoEquipo = ?');
      params.push(filters.tipoEquipo);
    }
    if (filters.estatus) {
      conditions.push('EstatusEquipo = ?');
      params.push(filters.estatus);
    }
    if (filters.usuario) {
      conditions.push('UsuarioAsignado LIKE ?');
      params.push(`%${filters.usuario}%`);
    }
    if (filters.busqueda) {
      // Búsqueda global en todos los campos principales
      conditions.push(`(
        nombreEquipo LIKE ? OR 
        no_serie LIKE ? OR 
        numeroActivo LIKE ? OR
        TipoEquipo LIKE ? OR
        EstatusEquipo LIKE ? OR
        SucursalActual LIKE ? OR
        UsuarioAsignado LIKE ?
      )`);
      // Repetir el término de búsqueda para cada campo
      const termino = `%${filters.busqueda}%`;
      params.push(termino, termino, termino, termino, termino, termino, termino);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fechaAlta DESC';

  const result = await executeQuery<VistaEquipoCompleto>(query, params);
  
  return result;
};

// Función fallback para consultar tabla equipos directamente
const getEquiposFromTable = async (filters?: {
  sucursal?: string;
  tipoEquipo?: string;
  estatus?: string;
  usuario?: string;
  busqueda?: string;
}): Promise<VistaEquipoCompleto[]> => {
  let query = `
    SELECT 
      e.no_serie,
      e.nombreEquipo,
      e.numeroActivo,
      e.fechaAlta,
      e.idPosicion,
      te.nombre as TipoEquipo,
      ee.nombre as EstatusEquipo,
      s.nombre as SucursalActual,
      u.nombre as UsuarioAsignado
    FROM equipos e
    LEFT JOIN tiposequipo te ON e.idTipoEquipo = te.id
    LEFT JOIN estatusequipo ee ON e.idEstatusEquipo = ee.id
    LEFT JOIN sucursales s ON e.idPosicion = s.id
    LEFT JOIN usuarios u ON e.idUsuarioAsignado = u.id
  `;
  
  const params: (string | number | Date | null | undefined)[] = [];
  const conditions: string[] = [];

  // TODO: Descomentar cuando se agreguen las columnas de eliminación lógica
  // conditions.push('(e.eliminado IS NULL OR e.eliminado = 0)');

  if (filters) {
    if (filters.sucursal) {
      conditions.push('s.codigo = ?');
      params.push(filters.sucursal);
    }
    if (filters.tipoEquipo) {
      conditions.push('te.nombre = ?');
      params.push(filters.tipoEquipo);
    }
    if (filters.estatus) {
      conditions.push('ee.nombre = ?');
      params.push(filters.estatus);
    }
    if (filters.usuario) {
      conditions.push('u.nombre LIKE ?');
      params.push(`%${filters.usuario}%`);
    }
    if (filters.busqueda) {
      // Búsqueda global en todos los campos principales (función fallback)
      conditions.push(`(
        e.nombreEquipo LIKE ? OR 
        e.no_serie LIKE ? OR 
        e.numeroActivo LIKE ? OR
        te.nombre LIKE ? OR
        ee.nombre LIKE ? OR
        s.nombre LIKE ? OR
        u.nombre LIKE ?
      )`);
      // Repetir el término de búsqueda para cada campo
      const termino = `%${filters.busqueda}%`;
      params.push(termino, termino, termino, termino, termino, termino, termino);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY e.fechaAlta DESC';

  const result = await executeQuery<VistaEquipoCompleto>(query, params);
  
  return result;
};

export const getMovimientosDetallados = async (filters?: {
  sucursalOrigen?: string;
  sucursalDestino?: string;
  tipoMovimiento?: string;
  estatusMovimiento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<VistaMovimientoDetallado[]> => {
  let query = 'SELECT * FROM VistaMovimientosDetallados';
  const params: (string | number | Date | null | undefined)[] = [];
  const conditions: string[] = [];

  if (filters) {
    if (filters.sucursalOrigen) {
      conditions.push('SucursalOrigen = ?');
      params.push(filters.sucursalOrigen);
    }
    if (filters.sucursalDestino) {
      conditions.push('SucursalDestino = ?');
      params.push(filters.sucursalDestino);
    }
    if (filters.tipoMovimiento) {
      conditions.push('tipoMovimiento = ?');
      params.push(filters.tipoMovimiento);
    }
    if (filters.estatusMovimiento) {
      conditions.push('estatusMovimiento = ?');
      params.push(filters.estatusMovimiento);
    }
    if (filters.fechaDesde) {
      conditions.push('fecha >= ?');
      params.push(filters.fechaDesde);
    }
    if (filters.fechaHasta) {
      conditions.push('fecha <= ?');
      params.push(filters.fechaHasta);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fecha DESC';

  return executeQuery<VistaMovimientoDetallado>(query, params);
};

export const getInventarioPorEstatus = async () => {
  return executeQuery('SELECT * FROM VistaInventarioPorEstatus ORDER BY estatus, TipoEquipo');
};

// Función para obtener todos los catálogos del sistema
export const getCatalogos = async () => {
  try {
    console.log('Obteniendo catálogos...');
    
    // Función auxiliar para ejecutar consultas con fallback
    const executeWithFallback = async (query: string, fallback: any[] = []) => {
      try {
        return await executeQuery(query);
      } catch (error) {
        console.warn(`Query failed: ${query}`, error);
        return fallback;
      }
    };

    // Obtener catálogos básicos que probablemente existan
    const usuarios = await executeWithFallback('SELECT * FROM usuarios ORDER BY id', []);
    
    // Para tipos de equipo, intentar múltiples variantes
    const tiposEquipo = await executeWithFallback('SELECT * FROM tipoequipo ORDER BY id', []);
    
    // Para estatus, intentar múltiples variantes  
    const estatusEquipos = await executeWithFallback('SELECT * FROM estatusequipo ORDER BY id', []);
    
    // Para posiciones, usar valores por defecto si no existe
    const posiciones = await executeWithFallback('SELECT * FROM posiciones ORDER BY id', [
      { id: 1, nombre: 'Entrada Principal' },
      { id: 2, nombre: 'Recepción' },
      { id: 3, nombre: 'Oficina' }
    ]);

    return {
      tiposEquipo,
      estatusEquipos,
      usuarios,
      posiciones,
      // Catálogos adicionales vacíos por ahora
      estados: [],
      municipios: [],
      zonas: [],
      sucursales: []
    };
  } catch (error) {
    console.error('Error obteniendo catálogos:', error);
    throw error;
  }
};

export const getHistorialMovimientos = async (no_serie?: string) => {
  if (no_serie) {
    return executeQuery('SELECT * FROM VistaHistorialMovimientos WHERE no_serie = ? ORDER BY fecha DESC', [no_serie]);
  }
  return executeQuery('SELECT * FROM VistaHistorialMovimientos ORDER BY fecha DESC LIMIT 100');
};


export default pool;