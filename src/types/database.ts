// =============================================
// TIPOS TYPESCRIPT PARA BASE DE DATOS GOSTCAM
// =============================================

// ========================
// TABLAS DE CATÁLOGO
// ========================
export interface Estado {
  idEstado: number;
  Estado: string;
}

export interface Municipio {
  idMunicipios: number;
  Municipio: string;
}

export interface Zona {
  idZona: number;
  Zona: string;
}

export interface NivelUsuario {
  idNivelUsuario: number;
  NivelUsuario: string;
}

// ========================
// TABLAS PRINCIPALES
// ========================
export interface Sucursal {
  idCentro: string;
  Sucursal: string;
  idZona: number;
  idEstado: number;
  idMunicipios: number;
  Latitud: string;
  Longitud: string;
}

export interface Usuario {
  idUsuarios: number;
  NombreUsuario: string;
  NivelUsuario: number;
  Correo: string;
  Contraseña: string;
  Estatus: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface PosicionEquipo {
  idPosicion: number;
  idCentro: string;
  NombrePosicion: string;
  Descripcion: string | null;
  TipoArea: 'INTERIOR' | 'EXTERIOR' | 'ALMACEN' | 'OFICINA' | 'SALA_SERVIDORES' | 'TALLER' | 'ESTACIONAMIENTO' | 'AREA_PUBLICA' | 'BODEGA' | 'OTRO';
}

export interface TipoMovimiento {
  idTipoMov: number;
  tipoMovimiento: string;
}

export interface EstatusEquipo {
  idEstatus: number;
  estatus: string;
}

export interface TipoEquipo {
  idTipoEquipo: number;
  nombreTipo: string;
  descripcion: string;
}

export interface Equipo {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  idTipoEquipo: number;
  numeroActivo: string;
  fechaAlta: Date;
  idUsuarios: number;
  idPosicion: number;
  idEstatus: number;
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface MovimientoInventario {
  idMovimientoInv: number;
  origen_idCentro: string;
  destino_idCentro: string;
  idTipoMov: number;
  fecha: Date;
  fechaFin: Date | null;
  estatusMovimiento: 'ABIERTO' | 'CERRADO' | 'CANCELADO';
  fecha_creacion: Date;
  fecha_actualizacion: Date;
}

export interface DetMovimiento {
  idDetMov: number;
  idMovimientoInv: number;
  no_serie: string;
  cantidad: number;
  fecha_creacion: Date;
}

// ========================
// VISTAS DE LA BASE DE DATOS
// ========================
export interface VistaEquipoCompleto {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  TipoEquipo: string;
  DescripcionTipo: string;
  numeroActivo: string;
  fechaAlta: Date;
  UsuarioAsignado: string;
  EstatusEquipo: string;
  SucursalActual: string;
  AreaActual: string;
  ZonaSucursal: string;
  EstadoSucursal: string;
  MunicipioSucursal: string;
}

export interface VistaMovimientoDetallado {
  idMovimientoInv: number;
  fecha: Date;
  tipoMovimiento: string;
  estatusMovimiento: string;
  SucursalOrigen: string;
  CentroOrigen: string;
  SucursalDestino: string;
  CentroDestino: string;
  no_serie: string;
  nombreEquipo: string;
  TipoEquipo: string;
  cantidad: number;
  fechaFin: Date | null;
  ZonaOrigen: string;
  ZonaDestino: string;
}

export interface VistaInventarioPorEstatus {
  estatus: string;
  TipoEquipo: string;
  Cantidad: number;
  Equipos: string;
  Disponibles: number;
  EnUso: number;
  EnMantenimiento: number;
}

export interface VistaHistorialMovimiento {
  no_serie: string;
  nombreEquipo: string;
  idMovimientoInv: number;
  tipoMovimiento: string;
  fecha: Date;
  Origen: string;
  Destino: string;
  estatusMovimiento: string;
  DiasDuracion: number;
}

// ========================
// TIPOS PARA API Y FRONTEND
// ========================
export interface LoginRequest {
  correo: string;
  contraseña: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    idUsuarios: number;
    NombreUsuario: string;
    NivelUsuario: number;
    Correo: string;
    Estatus: number;
  };
  token?: string;
  message?: string;
}

export interface EquipoCreateRequest {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  idTipoEquipo: number;
  numeroActivo: string;
  idUsuarios: number;
  idPosicion: number;
  idEstatus: number;
  idCentro?: string; // Opcional ya que no existe en la tabla equipo
}

export interface MovimientoCreateRequest {
  origen_idCentro: string;
  destino_idCentro: string;
  idTipoMov: number;
  equipos: Array<{
    no_serie: string;
    cantidad: number;
  }>;
}

export interface DashboardStats {
  totalEquipos: number;
  equiposDisponibles: number;
  equiposEnUso: number;
  equiposMantenimiento: number;
  equiposDañados: number;
  movimientosAbiertos: number;
  movimientosMes: number;
  equiposPorTipo: Array<{
    tipo: string;
    cantidad: number;
  }>;
  movimientosPorMes: Array<{
    mes: string;
    cantidad: number;
  }>;
  estatusPorcentajes: Array<{
    estatus: string;
    porcentaje: number;
    color: string;
  }>;
}

// ========================
// ENUMERACIONES
// ========================
export enum NivelesUsuario {
  ADMINISTRADOR = 1,
  SUPERVISOR = 2,
  TECNICO = 3,
  USUARIO = 4,
  CONSULTA = 5
}

export enum TiposMovimiento {
  ALTA = 1,
  BAJA = 2,
  TRASLADO = 3,
  MANTENIMIENTO = 4,
  REPARACION = 5
}

export enum EstatusEquipos {
  DISPONIBLE = 1,
  EN_USO = 2,
  MANTENIMIENTO = 3,
  BAJA = 4,
  EXTRAVIADO = 5,
  DAÑADO = 6,
  EN_REPARACION = 7,
  OBSOLETO = 8
}

export enum EstatusMovimientos {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO'
}

// ========================
// TIPOS PARA FORMULARIOS
// ========================
export interface FormEquipo {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  idTipoEquipo: string;
  numeroActivo: string;
  idUsuarios: string;
  idPosicion: string;
  idEstatus: string;
}

export interface FormMovimiento {
  origen_idCentro: string;
  destino_idCentro: string;
  idTipoMov: string;
  equipos: string[];
}

export interface FormUsuario {
  NombreUsuario: string;
  NivelUsuario: string;
  Correo: string;
  Contraseña: string;
  Estatus: string;
}

// ========================
// TIPOS PARA FILTROS Y BÚSQUEDAS
// ========================
export interface FiltrosEquipos {
  sucursal?: string;
  tipoEquipo?: string;
  estatus?: string;
  usuario?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
}

export interface FiltrosMovimientos {
  sucursalOrigen?: string;
  sucursalDestino?: string;
  tipoMovimiento?: string;
  estatusMovimiento?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  equipo?: string;
}

// ========================
// RESPUESTAS DE API
// ========================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}