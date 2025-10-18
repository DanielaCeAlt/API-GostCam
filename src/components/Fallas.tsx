'use client';

import React, { useState, useEffect } from 'react';

// Tipos para el sistema de fallas
interface EquipoFalla {
  id: number;
  noSerie: string;
  marca: string;
  modelo: string;
  ubicacion: string;
  estado: 'falla' | 'mantenimiento';
  fechaInicio: string;
  fechaFin?: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  tecnicoAsignado?: string;
  observaciones?: string;
}

interface FallasStats {
  totalFallas: number;
  equiposEnFalla: number;
  equiposEnMantenimiento: number;
  fallasResueltas: number;
}

const Fallas: React.FC = () => {
  const [equiposConFallas, setEquiposConFallas] = useState<EquipoFalla[]>([]);
  const [stats, setStats] = useState<FallasStats>({
    totalFallas: 0,
    equiposEnFalla: 0,
    equiposEnMantenimiento: 0,
    fallasResueltas: 0
  });
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'falla' | 'mantenimiento'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todos' | 'alta' | 'media' | 'baja'>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo - en producción vendrían de la API
  const datosEjemplo: EquipoFalla[] = [
    {
      id: 1,
      noSerie: 'EQ001',
      marca: 'Canon',
      modelo: 'MX490',
      ubicacion: 'Oficina Principal - Piso 1',
      estado: 'falla',
      fechaInicio: '2024-10-15',
      descripcion: 'Impresora no responde, error de conexión USB',
      prioridad: 'alta',
      tecnicoAsignado: 'Juan Pérez',
      observaciones: 'Se requiere revisión del cable USB y drivers'
    },
    {
      id: 2,
      noSerie: 'EQ015',
      marca: 'HP',
      modelo: 'LaserJet Pro',
      ubicacion: 'Sucursal Norte - Recepción',
      estado: 'mantenimiento',
      fechaInicio: '2024-10-12',
      fechaFin: '2024-10-20',
      descripcion: 'Mantenimiento preventivo programado',
      prioridad: 'media',
      tecnicoAsignado: 'Ana García',
      observaciones: 'Cambio de tóner y limpieza general'
    },
    {
      id: 3,
      noSerie: 'EQ023',
      marca: 'Epson',
      modelo: 'EcoTank L3210',
      ubicacion: 'Sucursal Sur - Administración',
      estado: 'falla',
      fechaInicio: '2024-10-14',
      descripcion: 'Problema con el sistema de tinta, no imprime colores',
      prioridad: 'media',
      tecnicoAsignado: 'Carlos Ruiz'
    },
    {
      id: 4,
      noSerie: 'EQ007',
      marca: 'Brother',
      modelo: 'DCP-L2540DW',
      ubicacion: 'Oficina Principal - Piso 2',
      estado: 'mantenimiento',
      fechaInicio: '2024-10-10',
      fechaFin: '2024-10-18',
      descripcion: 'Mantenimiento correctivo - Atasco de papel frecuente',
      prioridad: 'baja',
      tecnicoAsignado: 'María López',
      observaciones: 'Reparación de mecanismo alimentador'
    },
    {
      id: 5,
      noSerie: 'EQ031',
      marca: 'Samsung',
      modelo: 'Xpress M2020W',
      ubicacion: 'Sucursal Este - Contabilidad',
      estado: 'falla',
      fechaInicio: '2024-10-16',
      descripcion: 'Error de red, no se conecta al WiFi corporativo',
      prioridad: 'alta',
      observaciones: 'Requiere configuración de red'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    const cargarDatos = () => {
      setLoading(true);
      setTimeout(() => {
        setEquiposConFallas(datosEjemplo);
        
        // Calcular estadísticas
        const equiposEnFalla = datosEjemplo.filter(eq => eq.estado === 'falla').length;
        const equiposEnMantenimiento = datosEjemplo.filter(eq => eq.estado === 'mantenimiento').length;
        const fallasResueltas = datosEjemplo.filter(eq => eq.fechaFin).length;
        
        setStats({
          totalFallas: datosEjemplo.length,
          equiposEnFalla,
          equiposEnMantenimiento,
          fallasResueltas
        });
        
        setLoading(false);
      }, 800);
    };

    cargarDatos();
  }, []);

  // Filtrar equipos
  const equiposFiltrados = equiposConFallas.filter(equipo => {
    const coincideEstado = filtroEstado === 'todos' || equipo.estado === filtroEstado;
    const coincidePrioridad = filtroPrioridad === 'todos' || equipo.prioridad === filtroPrioridad;
    const coincideBusqueda = busqueda === '' || 
      equipo.noSerie.toLowerCase().includes(busqueda.toLowerCase()) ||
      equipo.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      equipo.modelo.toLowerCase().includes(busqueda.toLowerCase()) ||
      equipo.ubicacion.toLowerCase().includes(busqueda.toLowerCase());
    
    return coincideEstado && coincidePrioridad && coincideBusqueda;
  });

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calcularDiasTranscurridos = (fechaInicio: string, fechaFin?: string) => {
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'falla':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'mantenimiento':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          <i className="fas fa-exclamation-triangle text-orange-600 mr-3"></i>
          Gestión de Fallas
        </h1>
        <div className="text-sm text-gray-500">
          Última actualización: {new Date().toLocaleString('es-ES')}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Casos</p>
              <p className="text-3xl font-bold text-orange-600">{stats.totalFallas}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <i className="fas fa-clipboard-list text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipos en Falla</p>
              <p className="text-3xl font-bold text-red-600">{stats.equiposEnFalla}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <i className="fas fa-times-circle text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Mantenimiento</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.equiposEnMantenimiento}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <i className="fas fa-tools text-yellow-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Casos Resueltos</p>
              <p className="text-3xl font-bold text-green-600">{stats.fallasResueltas}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <i className="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Buscar por No. Serie, marca, modelo o ubicación..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'falla' | 'mantenimiento')}
            >
              <option value="todos">Todos los estados</option>
              <option value="falla">En Falla</option>
              <option value="mantenimiento">En Mantenimiento</option>
            </select>
          </div>

          {/* Filtro por prioridad */}
          <div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value as 'todos' | 'alta' | 'media' | 'baja')}
            >
              <option value="todos">Todas las prioridades</option>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de equipos con fallas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Equipos con Fallas y Mantenimiento ({equiposFiltrados.length})
          </h2>
        </div>

        {equiposFiltrados.length === 0 ? (
          <div className="p-8 text-center">
            <i className="fas fa-search text-gray-300 text-4xl mb-4"></i>
            <p className="text-gray-500">No se encontraron equipos que coincidan con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {equiposFiltrados.map((equipo) => (
              <div key={equipo.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Información del equipo */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {equipo.noSerie}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEstadoColor(equipo.estado)}`}>
                        {equipo.estado === 'falla' ? 'En Falla' : 'Mantenimiento'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(equipo.prioridad)}`}>
                        Prioridad {equipo.prioridad.charAt(0).toUpperCase() + equipo.prioridad.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <strong>{equipo.marca} {equipo.modelo}</strong> - {equipo.ubicacion}
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">
                      {equipo.descripcion}
                    </p>

                    {equipo.observaciones && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-orange-200">
                        <strong>Observaciones:</strong> {equipo.observaciones}
                      </div>
                    )}
                  </div>

                  {/* Información de fechas y técnico */}
                  <div className="lg:w-80 space-y-3">
                    <div className="flex items-center text-sm">
                      <i className="fas fa-calendar-alt text-orange-600 w-5"></i>
                      <span className="text-gray-600">Inicio:</span>
                      <span className="ml-2 font-medium">{formatearFecha(equipo.fechaInicio)}</span>
                    </div>

                    {equipo.fechaFin && (
                      <div className="flex items-center text-sm">
                        <i className="fas fa-calendar-check text-green-600 w-5"></i>
                        <span className="text-gray-600">Fin:</span>
                        <span className="ml-2 font-medium">{formatearFecha(equipo.fechaFin)}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm">
                      <i className="fas fa-clock text-blue-600 w-5"></i>
                      <span className="text-gray-600">Duración:</span>
                      <span className="ml-2 font-medium">
                        {calcularDiasTranscurridos(equipo.fechaInicio, equipo.fechaFin)} días
                      </span>
                    </div>

                    {equipo.tecnicoAsignado && (
                      <div className="flex items-center text-sm">
                        <i className="fas fa-user-cog text-purple-600 w-5"></i>
                        <span className="text-gray-600">Técnico:</span>
                        <span className="ml-2 font-medium">{equipo.tecnicoAsignado}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Fallas;