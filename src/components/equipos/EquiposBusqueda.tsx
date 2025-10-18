'use client';

import React, { useState } from 'react';
import { useEquipos } from '@/hooks/useEquipos';
import { useCatalogos } from '@/hooks/useCatalogos';
import { useApp } from '@/contexts/AppContext';

interface EquiposBusquedaProps {
  onResultados?: (equipos: any[]) => void;
}

export default function EquiposBusqueda({ onResultados }: EquiposBusquedaProps) {
  const { getStatusColor } = useApp();
  const { equipos, loading, buscarEquipos, paginacion } = useEquipos();
  const { tiposEquipo, sucursales, estatusEquipo, usuarios } = useCatalogos();
  
  const [filtrosAvanzados, setFiltrosAvanzados] = useState({
    texto: '',
    tipoEquipo: '',
    estatus: '',
    sucursal: '',
    usuarioAsignado: '',
    fechaAltaDesde: '',
    fechaAltaHasta: '',
    valorMinimo: '',
    valorMaximo: '',
    limite: 50,
    pagina: 1
  });

  const handleFiltroChange = (campo: string, valor: string) => {
    setFiltrosAvanzados(prev => ({
      ...prev,
      [campo]: valor,
      pagina: 1
    }));
  };

  const handleBuscarAvanzado = async () => {
    const filtrosBusqueda = {
      ...filtrosAvanzados,
      fechaAltaDesde: filtrosAvanzados.fechaAltaDesde,
      fechaAltaHasta: filtrosAvanzados.fechaAltaHasta
    };
    
    await buscarEquipos(filtrosBusqueda);
    onResultados?.(equipos);
  };

  const handleLimpiarFiltros = () => {
    setFiltrosAvanzados({
      texto: '',
      tipoEquipo: '',
      estatus: '',
      sucursal: '',
      usuarioAsignado: '',
      fechaAltaDesde: '',
      fechaAltaHasta: '',
      valorMinimo: '',
      valorMaximo: '',
      limite: 50,
      pagina: 1
    });
  };

  const exportarResultados = () => {
    if (equipos.length === 0) {
      alert('No hay resultados para exportar');
      return;
    }

    // Crear CSV
    const headers = ['No. Serie', 'Nombre', 'Modelo', 'Tipo', 'Estatus', 'Sucursal', 'Usuario', 'Fecha Alta'];
    const csvContent = [
      headers.join(','),
      ...equipos.map(equipo => [
        equipo.no_serie,
        `"${equipo.nombreEquipo}"`,
        `"${equipo.modelo}"`,
        `"${equipo.TipoEquipo}"`,
        `"${equipo.EstatusEquipo}"`,
        `"${equipo.SucursalActual}"`,
        `"${equipo.UsuarioAsignado}"`,
        equipo.fechaAlta
      ].join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `equipos_busqueda_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Búsqueda Avanzada</h1>
          <p className="text-gray-600">Filtros avanzados para encontrar equipos específicos</p>
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Criterios de Búsqueda</h3>
        
        {/* Primera fila de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Texto de búsqueda</label>
            <input
              type="text"
              value={filtrosAvanzados.texto}
              onChange={(e) => handleFiltroChange('texto', e.target.value)}
              placeholder="Serie, nombre, modelo..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Equipo</label>
            <select
              value={filtrosAvanzados.tipoEquipo}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estatus</label>
            <select
              value={filtrosAvanzados.estatus}
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
        </div>

        {/* Segunda fila de filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal</label>
            <select
              value={filtrosAvanzados.sucursal}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Usuario Asignado</label>
            <select
              value={filtrosAvanzados.usuarioAsignado}
              onChange={(e) => handleFiltroChange('usuarioAsignado', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map((usuario) => (
                <option key={usuario.idUsuarios} value={usuario.idUsuarios.toString()}>
                  {usuario.NombreUsuario}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Límite de resultados</label>
            <select
              value={filtrosAvanzados.limite.toString()}
              onChange={(e) => handleFiltroChange('limite', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="20">20 resultados</option>
              <option value="50">50 resultados</option>
              <option value="100">100 resultados</option>
              <option value="200">200 resultados</option>
            </select>
          </div>
        </div>

        {/* Tercera fila - Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Alta (Desde)</label>
            <input
              type="date"
              value={filtrosAvanzados.fechaAltaDesde}
              onChange={(e) => handleFiltroChange('fechaAltaDesde', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Alta (Hasta)</label>
            <input
              type="date"
              value={filtrosAvanzados.fechaAltaHasta}
              onChange={(e) => handleFiltroChange('fechaAltaHasta', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between">
          <div className="flex space-x-3">
            <button
              onClick={handleBuscarAvanzado}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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

          {equipos.length > 0 && (
            <button
              onClick={exportarResultados}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              <i className="fas fa-download mr-2"></i>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Resumen de resultados */}
      {equipos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Resultados de Búsqueda ({paginacion.totalRegistros} encontrados)
            </h3>
          </div>

          {/* Tabla compacta de resultados */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serie</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Equipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estatus</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sucursal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {equipos.map((equipo) => (
                  <tr key={equipo.no_serie} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{equipo.no_serie}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{equipo.nombreEquipo}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{equipo.TipoEquipo}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(equipo.EstatusEquipo)}`}>
                        {equipo.EstatusEquipo}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{equipo.SucursalActual}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}