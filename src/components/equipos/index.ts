// Exportar todos los componentes de equipos
export { default as EquiposManager } from './EquiposManager';
export { default as EquiposList } from './EquiposList';
export { default as EquiposBusqueda } from './EquiposBusqueda';
export { default as EquiposAlta } from './EquiposAlta';

// Re-exportar hooks relacionados
export { useEquipos } from '../../hooks/useEquipos';
export { useCatalogos } from '../../hooks/useCatalogos';