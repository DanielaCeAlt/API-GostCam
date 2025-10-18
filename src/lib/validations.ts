import { z } from 'zod';

// ========================
// ESQUEMAS BASE
// ========================

export const idSchema = z.number().positive('ID debe ser un número positivo');
export const noSerieSchema = z.string()
  .min(1, 'Número de serie es obligatorio')
  .max(50, 'Número de serie no puede exceder 50 caracteres')
  .regex(/^[A-Z0-9-]+$/, 'Número de serie debe contener solo letras mayúsculas, números y guiones');

export const emailSchema = z.string()
  .email('Email debe tener un formato válido')
  .max(254, 'Email no puede exceder 254 caracteres');

export const passwordSchema = z.string()
  .min(6, 'Contraseña debe tener al menos 6 caracteres')
  .max(255, 'Contraseña no puede exceder 255 caracteres');

// ========================
// ESQUEMAS DE EQUIPOS
// ========================

export const equipoCreateSchema = z.object({
  no_serie: noSerieSchema,
  nombreEquipo: z.string()
    .min(1, 'Nombre del equipo es obligatorio')
    .max(50, 'Nombre no puede exceder 50 caracteres'),
  modelo: z.string()
    .min(1, 'Modelo es obligatorio')
    .max(40, 'Modelo no puede exceder 40 caracteres'),
  numeroActivo: z.string()
    .max(20, 'Número de activo no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  idTipoEquipo: idSchema,
  idEstatus: idSchema.default(1),
  idUsuarios: idSchema,
  idPosicion: idSchema,
  valorEstimado: z.number()
    .min(0, 'Valor estimado debe ser positivo')
    .optional()
    .or(z.string().transform((val) => val === '' ? undefined : parseFloat(val))),
  observaciones: z.string()
    .max(500, 'Observaciones no pueden exceder 500 caracteres')
    .optional()
    .or(z.literal(''))
});

export const equipoUpdateSchema = equipoCreateSchema.partial().extend({
  no_serie: noSerieSchema // Número de serie siempre requerido para updates
});

export const equipoBajaSchema = z.object({
  no_serie: noSerieSchema,
  motivo: z.string()
    .min(1, 'Motivo de baja es obligatorio')
    .max(200, 'Motivo no puede exceder 200 caracteres'),
  idSucursal: z.string().optional()
});

// ========================
// ESQUEMAS DE BÚSQUEDA
// ========================

export const filtrosBusquedaSchema = z.object({
  texto: z.string().max(100).optional().or(z.literal('')),
  tipoEquipo: z.string().optional().or(z.literal('')),
  estatus: z.string().optional().or(z.literal('')),
  sucursal: z.string().optional().or(z.literal('')),
  usuarioAsignado: z.string().optional().or(z.literal('')),
  fechaAltaDesde: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  fechaAltaHasta: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD')
    .optional()
    .or(z.literal('')),
  limite: z.number()
    .min(1, 'Límite debe ser al menos 1')
    .max(1000, 'Límite no puede exceder 1000')
    .default(20),
  pagina: z.number()
    .min(1, 'Página debe ser al menos 1')
    .default(1)
}).refine((data) => {
  // Validar que fechaDesde sea anterior a fechaHasta
  if (data.fechaAltaDesde && data.fechaAltaHasta) {
    return new Date(data.fechaAltaDesde) <= new Date(data.fechaAltaHasta);
  }
  return true;
}, {
  message: 'Fecha de inicio debe ser anterior o igual a fecha de fin',
  path: ['fechaAltaHasta']
});

// ========================
// ESQUEMAS DE USUARIOS
// ========================

export const loginSchema = z.object({
  correo: emailSchema,
  contraseña: passwordSchema
});

export const usuarioCreateSchema = z.object({
  NombreUsuario: z.string()
    .min(1, 'Nombre de usuario es obligatorio')
    .max(45, 'Nombre no puede exceder 45 caracteres'),
  NivelUsuario: z.number()
    .min(1, 'Nivel de usuario inválido')
    .max(5, 'Nivel de usuario inválido'),
  Correo: emailSchema,
  Contraseña: passwordSchema,
  Estatus: z.number().min(0).max(1).default(1)
});

// ========================
// ESQUEMAS DE MOVIMIENTOS
// ========================

export const movimientoCreateSchema = z.object({
  origen_idCentro: z.string()
    .min(1, 'Centro origen es obligatorio')
    .max(4, 'Centro origen no puede exceder 4 caracteres'),
  destino_idCentro: z.string()
    .min(1, 'Centro destino es obligatorio')
    .max(4, 'Centro destino no puede exceder 4 caracteres'),
  idTipoMov: idSchema,
  equipos: z.array(z.object({
    no_serie: noSerieSchema,
    cantidad: z.number().min(1).default(1)
  })).min(1, 'Debe incluir al menos un equipo'),
  descripcion: z.string().max(500).optional(),
  fechaMovimiento: z.string().optional()
});

export const mantenimientoSchema = z.object({
  no_serie: noSerieSchema,
  tipoMantenimiento: z.enum(['preventivo', 'correctivo', 'urgente']),
  prioridad: z.enum(['baja', 'media', 'alta', 'critica']).default('media'),
  descripcion: z.string()
    .min(1, 'Descripción es obligatoria')
    .max(500, 'Descripción no puede exceder 500 caracteres'),
  fechaProgramada: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe tener formato YYYY-MM-DD'),
  tecnicoAsignado: z.string().optional(),
  observaciones: z.string().max(500).optional()
});

// ========================
// TIPOS DERIVADOS
// ========================

export type EquipoCreate = z.infer<typeof equipoCreateSchema>;
export type EquipoUpdate = z.infer<typeof equipoUpdateSchema>;
export type EquipoBaja = z.infer<typeof equipoBajaSchema>;
export type FiltrosBusqueda = z.infer<typeof filtrosBusquedaSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UsuarioCreate = z.infer<typeof usuarioCreateSchema>;
export type MovimientoCreate = z.infer<typeof movimientoCreateSchema>;
export type MantenimientoData = z.infer<typeof mantenimientoSchema>;

// ========================
// UTILIDADES DE VALIDACIÓN
// ========================

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
    public code: string = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        firstError.message,
        firstError.code
      );
    }
    throw error;
  }
}

export function validatePartialData<T>(schema: z.ZodSchema<T>, data: unknown): Partial<T> {
  try {
    return schema.partial().parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(
        firstError.path.join('.'),
        firstError.message,
        firstError.code
      );
    }
    throw error;
  }
}

// Hook para validación en tiempo real
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const validate = (data: unknown): { data: T | null; errors: Record<string, string> } => {
    try {
      const validData = schema.parse(data);
      return { data: validData, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          errors[field] = err.message;
        });
        return { data: null, errors };
      }
      return { data: null, errors: { general: 'Error de validación desconocido' } };
    }
  };

  const validateField = (fieldName: string, value: unknown): string | null => {
    try {
      // Crear un esquema temporal para el campo específico
      const fieldSchema = (schema as any).shape[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        return null;
      }
      return 'Campo no encontrado';
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Error de validación';
      }
      return 'Error de validación desconocido';
    }
  };

  return { validate, validateField };
}