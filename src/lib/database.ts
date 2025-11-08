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
  // Usar directamente la tabla equipo con una consulta simple
  return getEquiposFromTable(filters);
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
      e.modelo,
      e.fechaAlta,
      e.idPosicion,
      te.nombreTipo as TipoEquipo,
      ee.estatus as EstatusEquipo,
      'Centro Principal' as SucursalActual,
      u.NombreUsuario as UsuarioAsignado
    FROM equipo e
    LEFT JOIN tipoequipo te ON e.idTipoEquipo = te.idTipoEquipo
    LEFT JOIN estatusequipo ee ON e.idEstatus = ee.idEstatus
    LEFT JOIN usuarios u ON e.idUsuarios = u.idUsuarios
  `;
  
  const params: (string | number | Date | null | undefined)[] = [];
  const conditions: string[] = [];

  // ✅ Filtrar equipos eliminados lógicamente
  conditions.push('(e.eliminado IS NULL OR e.eliminado = 0)');

  if (filters) {
    if (filters.tipoEquipo) {
      conditions.push('te.nombreTipo = ?');
      params.push(filters.tipoEquipo);
    }
    if (filters.estatus) {
      conditions.push('ee.estatus = ?');
      params.push(filters.estatus);
    }
    if (filters.usuario) {
      conditions.push('u.NombreUsuario LIKE ?');
      params.push(`%${filters.usuario}%`);
    }
    if (filters.busqueda) {
      // Búsqueda global en todos los campos principales (función fallback)
      conditions.push(`(
        e.nombreEquipo LIKE ? OR 
        e.no_serie LIKE ? OR 
        e.numeroActivo LIKE ? OR
        e.modelo LIKE ? OR
        te.nombreTipo LIKE ? OR
        ee.estatus LIKE ? OR
        u.NombreUsuario LIKE ?
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
    const usuarios = await executeWithFallback('SELECT * FROM usuarios', []);
    
    // Para tipos de equipo, intentar múltiples variantes
    const tiposEquipo = await executeWithFallback('SELECT * FROM tipoequipo', []);
    
    // Para estatus, intentar múltiples variantes  
    const estatusEquipos = await executeWithFallback('SELECT * FROM estatusequipo', []);
    
    // Para posiciones, usar valores por defecto si no existe
    const posiciones = await executeWithFallback('SELECT * FROM posiciones', [
      { id: 1, nombre: 'Entrada Principal' },
      { id: 2, nombre: 'Recepción' },
      { id: 3, nombre: 'Oficina' }
    ]);

    // Para sucursales, intentar obtener de la tabla de equipos o crear por defecto
    const sucursales = await executeWithFallback('SELECT DISTINCT SucursalActual as nombre, SucursalActual as id FROM equipos WHERE SucursalActual IS NOT NULL AND SucursalActual != ""', [
      { id: 'SUC001', nombre: 'Sucursal Principal' },
      { id: 'SUC002', nombre: 'Sucursal Norte' },
      { id: 'SUC003', nombre: 'Sucursal Sur' }
    ]);

    return {
      tiposEquipo,
      estatusEquipos,
      usuarios,
      posiciones,
      sucursales,
      // Catálogos adicionales vacíos por ahora
      estados: [],
      municipios: [],
      zonas: []
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