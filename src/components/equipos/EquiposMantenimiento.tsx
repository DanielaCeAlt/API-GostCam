import React, { useState, useEffect } from 'react';
import { CalendarDaysIcon, WrenchScrewdriverIcon, ClockIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface MantenimientoData {
  id: number;
  fecha: string;
  fechaFin?: string;
  tipo_mantenimiento: 'PREVENTIVO' | 'CORRECTIVO' | 'URGENTE';
  prioridad_mantenimiento: string;
  estimacion_horas: number;
  horasReales?: number;
  no_serie: string;
  nombreEquipo: string;
  tipoEquipo: string;
  sucursal: string;
  descripcion: string;
  observaciones: string;
  tecnico: string;
  estatusMantenimiento: string;
  diasTranscurridos: number;
}

interface EstadisticasData {
  total: number;
  porTecnico: any[];
  porTipo: {
    preventivos: number;
    correctivos: number;
    urgentes: number;
  };
  porPrioridad: {
    critica: number;
    alta: number;
    normal: number;
    baja: number;
  };
}

interface FormData {
  equipos: string[];
  tipoMantenimiento: 'PREVENTIVO' | 'CORRECTIVO' | 'URGENTE';
  fechaProgramada: string;
  tecnicoAsignado: string;
  descripcion: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  estimacionHoras: number;
  observaciones: string;
}

const EquiposMantenimiento: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'programar' | 'consultar' | 'estadisticas'>('consultar');
  
  // Estados para consulta
  const [mantenimientos, setMantenimientos] = useState<MantenimientoData[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    sucursal: '',
    tecnico: '',
    tipo: '',
    estatus: 'ABIERTO',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Estados para programar mantenimiento
  const [equiposBusqueda, setEquiposBusqueda] = useState<any[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    equipos: [],
    tipoMantenimiento: 'PREVENTIVO',
    fechaProgramada: '',
    tecnicoAsignado: '',
    descripcion: '',
    prioridad: 'NORMAL',
    estimacionHoras: 1,
    observaciones: ''
  });

  const [busquedaTerm, setBusquedaTerm] = useState('');

  useEffect(() => {
    if (activeTab === 'consultar') {
      cargarMantenimientos();
    }
    if (activeTab === 'programar') {
      cargarTecnicos();
    }
  }, [activeTab, filtros]);

  const cargarMantenimientos = async () => {
    setLoading(true);
    try {
      // Usar datos simulados por ahora
      const datosSimulados = {
        mantenimientos: [
          {
            id: 1,
            fecha: '2024-11-08',
            fechaFin: null,
            tipo_mantenimiento: 'PREVENTIVO',
            prioridad_mantenimiento: 'NORMAL',
            estimacion_horas: 2,
            horasReales: null,
            no_serie: 'CAM001',
            nombreEquipo: 'Cámara Principal',
            tipoEquipo: 'Cámara',
            sucursal: 'Centro Principal',
            descripcion: 'Mantenimiento preventivo mensual',
            observaciones: 'Revisión general del sistema',
            tecnico: 'Juan Pérez',
            estatusMantenimiento: 'ABIERTO',
            diasTranscurridos: 2
          },
          {
            id: 2,
            fecha: '2024-11-05',
            fechaFin: '2024-11-06',
            tipo_mantenimiento: 'CORRECTIVO',
            prioridad_mantenimiento: 'ALTA',
            estimacion_horas: 4,
            horasReales: 3.5,
            no_serie: 'CAM002',
            nombreEquipo: 'Cámara Entrada',
            tipoEquipo: 'Cámara',
            sucursal: 'Sucursal Norte',
            descripcion: 'Reparación de lente dañado',
            observaciones: 'Lente reemplazado exitosamente',
            tecnico: 'María González',
            estatusMantenimiento: 'COMPLETADO',
            diasTranscurridos: 3
          }
        ],
        estadisticas: {
          total: 2,
          porTecnico: [
            {
              tecnico: 'Juan Pérez',
              totalMantenimientos: 1,
              horasEstimadas: 2,
              horasReales: 0,
              preventivos: 1,
              correctivos: 0,
              urgentes: 0
            },
            {
              tecnico: 'María González',
              totalMantenimientos: 1,
              horasEstimadas: 4,
              horasReales: 3.5,
              preventivos: 0,
              correctivos: 1,
              urgentes: 0
            }
          ],
          porTipo: {
            preventivos: 1,
            correctivos: 1,
            urgentes: 0
          },
          porPrioridad: {
            critica: 0,
            alta: 1,
            normal: 1,
            baja: 0
          }
        }
      };

      setMantenimientos(datosSimulados.mantenimientos);
      setEstadisticas(datosSimulados.estadisticas);
      
    } catch (error) {
      console.error('Error cargando mantenimientos:', error);
      // En caso de error, mostrar datos vacíos
      setMantenimientos([]);
      setEstadisticas({
        total: 0,
        porTecnico: [],
        porTipo: { preventivos: 0, correctivos: 0, urgentes: 0 },
        porPrioridad: { critica: 0, alta: 0, normal: 0, baja: 0 }
      });
    }
    setLoading(false);
  };

  const cargarTecnicos = async () => {
    try {
      // Por ahora usar datos fijos, luego se puede crear endpoint específico
      setTecnicos([
        { id: 1, nombre: 'Juan Pérez - Técnico Senior', nivel: 3 },
        { id: 2, nombre: 'María González - Técnico', nivel: 2 },
        { id: 3, nombre: 'Carlos López - Técnico Junior', nivel: 2 },
        { id: 4, nombre: 'Ana Rodríguez - Especialista', nivel: 3 }
      ]);
    } catch (error) {
      console.error('Error cargando técnicos:', error);
    }
  };

  const buscarEquipos = async (termino: string) => {
    if (!termino.trim()) {
      setEquiposBusqueda([]);
      return;
    }

    try {
      const response = await fetch(`/api/equipos/search?q=${encodeURIComponent(termino)}`);
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo equipos que no estén en mantenimiento
        const equiposDisponibles = data.data.filter((equipo: any) => 
          equipo.EstatusEquipo !== 'Mantenimiento' && 
          equipo.EstatusEquipo !== 'Fuera de Servicio'
        );
        setEquiposBusqueda(equiposDisponibles);
      }
    } catch (error) {
      console.error('Error buscando equipos:', error);
    }
  };

  const agregarEquipo = (equipo: any) => {
    if (!equiposSeleccionados.find(e => e.no_serie === equipo.no_serie)) {
      setEquiposSeleccionados([...equiposSeleccionados, equipo]);
      setFormData(prev => ({
        ...prev,
        equipos: [...prev.equipos, equipo.no_serie]
      }));
    }
    setBusquedaTerm('');
    setEquiposBusqueda([]);
  };

  const removerEquipo = (no_serie: string) => {
    setEquiposSeleccionados(equiposSeleccionados.filter(e => e.no_serie !== no_serie));
    setFormData(prev => ({
      ...prev,
      equipos: prev.equipos.filter(e => e !== no_serie)
    }));
  };

  const programarMantenimiento = async () => {
    try {
      // Simulación de programación exitosa
      alert(`Mantenimiento programado exitosamente para ${equiposSeleccionados.length} equipo(s)`);
      
      // Limpiar formulario
      setFormData({
        equipos: [],
        tipoMantenimiento: 'PREVENTIVO',
        fechaProgramada: '',
        tecnicoAsignado: '',
        descripcion: '',
        prioridad: 'NORMAL',
        estimacionHoras: 1,
        observaciones: ''
      });
      setEquiposSeleccionados([]);
      
      // Recargar la lista de mantenimientos
      cargarMantenimientos();
      
    } catch (error) {
      console.error('Error programando mantenimiento:', error);
      alert('Error interno del servidor');
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'CRITICA': return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'URGENTE': return 'bg-red-100 text-red-800';
      case 'CORRECTIVO': return 'bg-yellow-100 text-yellow-800';
      case 'PREVENTIVO': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Mantenimiento de Equipos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona el mantenimiento preventivo y correctivo
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'consultar', label: 'Consultar Mantenimientos', icon: CalendarDaysIcon },
              { id: 'programar', label: 'Programar Mantenimiento', icon: WrenchScrewdriverIcon },
              { id: 'estadisticas', label: 'Estadísticas', icon: ClockIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Tab Content: Consultar */}
          {activeTab === 'consultar' && (
            <div className="space-y-6">
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estatus
                  </label>
                  <select
                    value={filtros.estatus}
                    onChange={(e) => setFiltros({...filtros, estatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="ABIERTO">Abierto</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="COMPLETADO">Completado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo
                  </label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="PREVENTIVO">Preventivo</option>
                    <option value="CORRECTIVO">Correctivo</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaDesde}
                    onChange={(e) => setFiltros({...filtros, fechaDesde: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaHasta}
                    onChange={(e) => setFiltros({...filtros, fechaHasta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Técnico
                  </label>
                  <input
                    type="text"
                    value={filtros.tecnico}
                    onChange={(e) => setFiltros({...filtros, tecnico: e.target.value})}
                    placeholder="Nombre del técnico"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Lista de Mantenimientos */}
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Cargando mantenimientos...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tipo/Prioridad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Técnico
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fechas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Horas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Descripción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {mantenimientos.map((mant) => (
                        <tr key={mant.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {mant.no_serie}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {mant.nombreEquipo}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoColor(mant.tipo_mantenimiento)}`}>
                                {mant.tipo_mantenimiento}
                              </span>
                              <br />
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioridadColor(mant.prioridad_mantenimiento)}`}>
                                {mant.prioridad_mantenimiento}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {mant.tecnico}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div>
                              <div>Programado: {new Date(mant.fecha).toLocaleDateString()}</div>
                              {mant.fechaFin && <div>Finalizado: {new Date(mant.fechaFin).toLocaleDateString()}</div>}
                              <div className="text-xs text-gray-500">
                                {mant.diasTranscurridos} días transcurridos
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div>
                              <div>Est: {mant.estimacion_horas}h</div>
                              {mant.horasReales && <div>Real: {mant.horasReales}h</div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            <div className="max-w-xs truncate">
                              {mant.descripcion}
                            </div>
                            {mant.observaciones && (
                              <div className="text-xs text-gray-500 max-w-xs truncate">
                                Obs: {mant.observaciones}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {mantenimientos.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron mantenimientos con los filtros aplicados
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Programar */}
          {activeTab === 'programar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selección de Equipos */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Seleccionar Equipos
                  </h3>
                  
                  {/* Búsqueda de equipos */}
                  <div className="relative">
                    <input
                      type="text"
                      value={busquedaTerm}
                      onChange={(e) => {
                        setBusquedaTerm(e.target.value);
                        buscarEquipos(e.target.value);
                      }}
                      placeholder="Buscar equipos por número de serie o nombre..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    
                    {/* Resultados de búsqueda */}
                    {equiposBusqueda.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {equiposBusqueda.map((equipo) => (
                          <button
                            key={equipo.no_serie}
                            onClick={() => agregarEquipo(equipo)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {equipo.no_serie} - {equipo.nombreEquipo}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {equipo.TipoEquipo} | {equipo.SucursalActual}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Equipos seleccionados */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Equipos Seleccionados ({equiposSeleccionados.length})
                    </h4>
                    {equiposSeleccionados.map((equipo) => (
                      <div key={equipo.no_serie} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {equipo.no_serie} - {equipo.nombreEquipo}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {equipo.TipoEquipo}
                          </div>
                        </div>
                        <button
                          onClick={() => removerEquipo(equipo.no_serie)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulario de Mantenimiento */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Detalles del Mantenimiento
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Mantenimiento *
                      </label>
                      <select
                        value={formData.tipoMantenimiento}
                        onChange={(e) => setFormData({...formData, tipoMantenimiento: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="PREVENTIVO">Preventivo</option>
                        <option value="CORRECTIVO">Correctivo</option>
                        <option value="URGENTE">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prioridad *
                      </label>
                      <select
                        value={formData.prioridad}
                        onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="BAJA">Baja</option>
                        <option value="NORMAL">Normal</option>
                        <option value="ALTA">Alta</option>
                        <option value="CRITICA">Crítica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha Programada *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.fechaProgramada}
                        onChange={(e) => setFormData({...formData, fechaProgramada: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Técnico Asignado *
                      </label>
                      <select
                        value={formData.tecnicoAsignado}
                        onChange={(e) => setFormData({...formData, tecnicoAsignado: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Seleccionar técnico...</option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.id} value={tecnico.id}>
                            {tecnico.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimación (horas)
                      </label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={formData.estimacionHoras}
                        onChange={(e) => setFormData({...formData, estimacionHoras: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción del Trabajo *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      rows={3}
                      placeholder="Describir el trabajo a realizar..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      rows={2}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <button
                    onClick={programarMantenimiento}
                    disabled={equiposSeleccionados.length === 0 || !formData.fechaProgramada || !formData.tecnicoAsignado || !formData.descripcion}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 
                             disabled:bg-gray-400 disabled:cursor-not-allowed
                             flex items-center justify-center space-x-2"
                  >
                    <WrenchScrewdriverIcon className="h-5 w-5" />
                    <span>Programar Mantenimiento</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Estadísticas */}
          {activeTab === 'estadisticas' && estadisticas && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Estadísticas por Tipo */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Preventivos</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{estadisticas.porTipo.preventivos}</p>
                    </div>
                    <WrenchScrewdriverIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Correctivos</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{estadisticas.porTipo.correctivos}</p>
                    </div>
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Urgentes</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{estadisticas.porTipo.urgentes}</p>
                    </div>
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{estadisticas.total}</p>
                    </div>
                    <ClockIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Estadísticas por Prioridad */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Distribución por Prioridad
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.porPrioridad.critica}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Crítica</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.porPrioridad.alta}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Alta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.porPrioridad.normal}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Normal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.porPrioridad.baja}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Baja</div>
                  </div>
                </div>
              </div>

              {/* Estadísticas por Técnico */}
              {estadisticas.porTecnico.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Estadísticas por Técnico
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Horas Est.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Horas Reales
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Prev/Corr/Urg
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {estadisticas.porTecnico.map((tecnico, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {tecnico.tecnico}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.totalMantenimientos}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.horasEstimadas.toFixed(1)}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.horasReales.toFixed(1)}h
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.preventivos}/{tecnico.correctivos}/{tecnico.urgentes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquiposMantenimiento;