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
  let query = 'SELECT * FROM GostCAM.VistaEquiposCompletos';
  const params: (string | number | Date | null | undefined)[] = [];
  const conditions: string[] = [];

  if (filters) {
    if (filters.sucursal) {
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
      conditions.push('(nombreEquipo LIKE ? OR no_serie LIKE ? OR numeroActivo LIKE ?)');
      params.push(`%${filters.busqueda}%`, `%${filters.busqueda}%`, `%${filters.busqueda}%`);
    }
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY fechaAlta DESC';

  return executeQuery<VistaEquipoCompleto>(query, params);
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
    const [estados, municipios, zonas, nivelesUsuario, tiposEquipo, estatusEquipos, tiposMovimiento, sucursales, posiciones] = await Promise.all([
      executeQuery('SELECT * FROM Estados ORDER BY Estado'),
      executeQuery('SELECT * FROM Municipios ORDER BY Municipio'),
      executeQuery('SELECT * FROM Zonas ORDER BY Zona'),
      executeQuery('SELECT * FROM NivelUsuarios ORDER BY NivelUsuario'),
      executeQuery('SELECT * FROM TiposEquipo ORDER BY nombreTipo'),
      executeQuery('SELECT * FROM EstatusEquipos ORDER BY estatus'),
      executeQuery('SELECT * FROM TiposMovimiento ORDER BY tipoMovimiento'),
      executeQuery('SELECT * FROM Sucursales ORDER BY Sucursal'),
      executeQuery('SELECT * FROM PosicionesEquipo ORDER BY NombrePosicion')
    ]);

    return {
      estados,
      municipios,
      zonas,
      nivelesUsuario,
      tiposEquipo,
      estatusEquipos,
      tiposMovimiento,
      sucursales,
      posiciones
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