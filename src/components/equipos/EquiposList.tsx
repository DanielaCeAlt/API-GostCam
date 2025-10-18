'use client';

import React, { useEffect, useState } from 'react';
import { useEquipos } from '@/hooks/useEquipos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useApp } from '@/contexts/AppContext';

interface EquiposListProps {
  onEquipoSelect?: (noSerie: string) => void;
  onVerDetalles?: (noSerie: string) => void;
  onEditarEquipo?: (noSerie: string) => void;
  onEliminarEquipo?: (noSerie: string) => void;
  onVerHistorial?: (noSerie: string) => void;
  onCambiarUbicacion?: (noSerie: string) => void;
  onMantenimiento?: (noSerie: string) => void;
}

export default function EquiposList({ 
  onEquipoSelect, 
  onVerDetalles, 
  onEditarEquipo,
  onEliminarEquipo,
  onVerHistorial,
  onCambiarUbicacion,
  onMantenimiento
}: EquiposListProps) {
  const { getStatusColor } = useApp();
  const { 
    equipos, 
    loading, 
    paginacion, 
    cargarEquipos, 
    buscarEquipos,
    verDetallesEquipo 
  } = useEquipos();
  
  const { tiposEquipo, sucursales, estatusEquipo } = useCatalogos();
  
  const [filtros, setFiltros] = useState({
    texto: '',
    tipoEquipo: '',
    estatus: '',
    sucursal: '',
    limite: 20,
    pagina: 1
  });

  const [equiposSeleccionados, setEquiposSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    cargarEquipos();
  }, [cargarEquipos]);

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
      pagina: 1 // Reset página al cambiar filtros
    }));
  };

  const handleBuscar = () => {
    const filtrosBusqueda = {
      ...filtros,
      fechaAltaDesde: '',
      fechaAltaHasta: ''
    };
    buscarEquipos(filtrosBusqueda);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      texto: '',
      tipoEquipo: '',
      estatus: '',
      sucursal: '',
      limite: 20,
      pagina: 1
    });
    cargarEquipos();
  };

  const handleSelectEquipo = (noSerie: string, checked: boolean) => {
    if (checked) {
      setEquiposSeleccionados(prev => [...prev, noSerie]);
    } else {
      setEquiposSeleccionados(prev => prev.filter(id => id !== noSerie));
    }
    onEquipoSelect?.(noSerie);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const todosLosEquipos = equipos.map(equipo => equipo.no_serie);
      setEquiposSeleccionados(todosLosEquipos);
    } else {
      setEquiposSeleccionados([]);
    }
  };

  const handleCambiarPagina = (nuevaPagina: number) => {
    const filtrosBusqueda = {
      ...filtros,
      pagina: nuevaPagina,
      fechaAltaDesde: '',
      fechaAltaHasta: ''
    };
    setFiltros(prev => ({ ...prev, pagina: nuevaPagina }));
    buscarEquipos(filtrosBusqueda);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario de Equipos</h1>
          <p className="text-gray-600">
            {paginacion.totalRegistros} equipos encontrados
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros de Búsqueda</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Búsqueda de texto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Búsqueda general
            </label>
            <input
              type="text"
              value={filtros.texto}
              onChange={(e) => handleFiltroChange('texto', e.target.value)}
              placeholder="Serie, nombre, modelo..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Tipo de equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Equipo
            </label>
            <select
              value={filtros.tipoEquipo}
              onChange={(e) => handleFiltroChange('tipoEquipo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo.idTipoEquipo} value={tipo.idTipoEquipo.toString()}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estatus */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estatus
            </label>
            <select
              value={filtros.estatus}
              onChange={(e) => handleFiltroChange('estatus', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estatus</option>
              {estatusEquipo.map((estatus) => (
                <option key={estatus.idEstatus} value={estatus.idEstatus.toString()}>
                  {estatus.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sucursal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select
              value={filtros.sucursal}
              onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.idCentro} value={sucursal.idCentro}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex space-x-3">
          <button
            onClick={handleBuscar}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <i className="fas fa-search mr-2"></i>
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          
          <button
            onClick={handleLimpiarFiltros}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            <i className="fas fa-times mr-2"></i>
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla de equipos */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={equiposSeleccionados.length === equipos.length && equipos.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Serie
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estatus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario Asignado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Cargando equipos...
                  </td>
                </tr>
              ) : equipos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron equipos
                  </td>
                </tr>
              ) : (
                equipos.map((equipo) => (
                  <tr key={equipo.no_serie} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={equiposSeleccionados.includes(equipo.no_serie)}
                        onChange={(e) => handleSelectEquipo(equipo.no_serie, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {equipo.no_serie}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {equipo.nombreEquipo}
                        </div>
                        <div className="text-sm text-gray-500">
                          {equipo.modelo}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipo.TipoEquipo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipo.EstatusEquipo)}`}>
                        {equipo.EstatusEquipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipo.SucursalActual}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {equipo.UsuarioAsignado}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        {/* Fila 1: Acciones principales */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => onVerDetalles?.(equipo.no_serie)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Ver Detalles"
                          >
                            <i className="fas fa-eye text-sm"></i>
                          </button>
                          <button 
                            onClick={() => onEditarEquipo?.(equipo.no_serie)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Editar Equipo"
                          >
                            <i className="fas fa-edit text-sm"></i>
                          </button>
                          <button 
                            onClick={() => onEliminarEquipo?.(equipo.no_serie)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar Equipo"
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </button>
                        </div>
                        
                        {/* Fila 2: Acciones secundarias */}
                        <div className="flex gap-1">
                          <button 
                            onClick={() => onVerHistorial?.(equipo.no_serie)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Historial Completo"
                          >
                            <i className="fas fa-history text-sm"></i>
                          </button>
                        </div>
                        
                        {/* Fila 3: Acciones de gestión */}
                        <div className="flex gap-1">
                          <button 
                            onClick={() => onCambiarUbicacion?.(equipo.no_serie)}
                            className="text-purple-600 hover:text-purple-900 p-1"
                            title="Cambiar Ubicación"
                          >
                            <i className="fas fa-exchange-alt text-sm"></i>
                          </button>
                          <button 
                            onClick={() => onMantenimiento?.(equipo.no_serie)}
                            className="text-orange-600 hover:text-orange-900 p-1"
                            title="Mantenimiento"
                          >
                            <i className="fas fa-tools text-sm"></i>
                          </button>
                          {/* Botones de gestión específica por equipo */}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {paginacion.totalPaginas > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleCambiarPagina(paginacion.paginaActual - 1)}
                disabled={!paginacion.hayAnterior}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => handleCambiarPagina(paginacion.paginaActual + 1)}
                disabled={!paginacion.haySiguiente}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {((paginacion.paginaActual - 1) * filtros.limite) + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(paginacion.paginaActual * filtros.limite, paginacion.totalRegistros)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{paginacion.totalRegistros}</span>{' '}
                  resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleCambiarPagina(paginacion.paginaActual - 1)}
                    disabled={!paginacion.hayAnterior}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {/* Números de página */}
                  {Array.from({ length: Math.min(5, paginacion.totalPaginas) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handleCambiarPagina(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === paginacion.paginaActual
                            ? 'z-10 bg-orange-50 border-orange-600 text-orange-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handleCambiarPagina(paginacion.paginaActual + 1)}
                    disabled={!paginacion.haySiguiente}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}