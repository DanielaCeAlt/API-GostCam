// Exportar todos los componentes de equipos
export { default as EquiposManager } from './EquiposManager';
export { default as EquiposList } from './EquiposList';
export { default as EquiposBusqueda } from './EquiposBusqueda';
export { default as EquiposAlta } from './EquiposAlta';
export { default as EquiposDashboard } from './EquiposDashboard';
export { default as EquiposEditar } from './EquiposEditar';
export { default as EquiposCambioUbicacion } from './EquiposCambioUbicacion';
export { default as EquiposMantenimiento } from './EquiposMantenimiento';
export { default as EquiposFallas } from './EquiposFallas';
export { default as ConfirmDeleteModal } from './ConfirmDeleteModal';

// Re-exportar hooks relacionados
export { useEquipos } from '../../hooks/useEquipos';
export { useCatalogos } from '../../hooks/useCatalogos';