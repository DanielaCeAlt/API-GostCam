'use client';

import React from 'react';

interface Filtros {
  texto: string;
  limite: number;
  pagina: number;
}

interface EquiposFiltrosProps {
  filtros: Filtros;
  loading: boolean;
  onFiltroChange: (campo: string, valor: string) => void;
  onBuscar: () => void;
  onLimpiarFiltros: () => void;
}

const EquiposFiltros: React.FC<EquiposFiltrosProps> = ({
  filtros,
  loading,
  onFiltroChange,
  onBuscar,
  onLimpiarFiltros
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Filtros de Búsqueda</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Búsqueda de texto */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Búsqueda general
          </label>
          <input
            type="text"
            value={filtros.texto}
            onChange={(e) => onFiltroChange('texto', e.target.value)}
            placeholder="Serie, nombre, modelo..."
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Límite de resultados */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Resultados por página
          </label>
          <select
            value={filtros.limite}
            onChange={(e) => onFiltroChange('limite', e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={10}>10 equipos</option>
            <option value={20}>20 equipos</option>
            <option value={50}>50 equipos</option>
            <option value={100}>100 equipos</option>
          </select>
        </div>

        {/* Filtros adicionales que se pueden expandir en el futuro */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Estado
          </label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Mantenimiento">Mantenimiento</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Tipo de Equipo
          </label>
          <select
            className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                     bg-white dark:bg-gray-700 text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled
          >
            <option value="">Todos los tipos</option>
            <option value="Cámara">Cámara</option>
            <option value="Sensor">Sensor</option>
            <option value="Dispositivo">Dispositivo</option>
          </select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap space-x-3 space-y-2 md:space-y-0">
        <button
          onClick={onBuscar}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center space-x-2 transition-colors duration-200"
        >
          <i className="fas fa-search"></i>
          <span>{loading ? 'Buscando...' : 'Buscar'}</span>
        </button>
        
        <button
          onClick={onLimpiarFiltros}
          disabled={loading}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center space-x-2 transition-colors duration-200"
        >
          <i className="fas fa-times"></i>
          <span>Limpiar</span>
        </button>
      </div>

      {/* Información de resultados */}
      {filtros.texto && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
            <i className="fas fa-info-circle mr-2"></i>
            Búsqueda activa: "<strong>{filtros.texto}</strong>"
          </p>
        </div>
      )}
    </div>
  );
};

export default EquiposFiltros;