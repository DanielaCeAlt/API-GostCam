import React, { useState, useEffect } from 'react';

interface FallaData {
  id: number;
  no_serie: string;
  nombreEquipo: string;
  tipoEquipo: string;
  sucursal: string;
  tipo_falla: 'HARDWARE' | 'SOFTWARE' | 'CONECTIVIDAD' | 'SUMINISTROS' | 'MECANICA' | 'ELECTRICA' | 'OTRA';
  descripcion_problema: string;
  sintomas: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  usuario_reporta: string;
  fecha_reporte: string;
  fecha_solucion?: string;
  tecnico_asignado?: string;
  solucion_aplicada?: string;
  estatus: 'ABIERTA' | 'EN_PROCESO' | 'RESUELTA' | 'CANCELADA';
  tiempo_solucion_horas?: number;
  observaciones?: string;
  ubicacion_falla: string;
  impacto: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  requiere_repuestos: boolean;
  repuestos_utilizados?: string;
  costo_reparacion?: number;
  diasAbierta: number;
}

interface EstadisticasFallas {
  total: number;
  abiertas: number;
  en_proceso: number;
  resueltas: number;
  promedio_solucion_horas: number;
  por_tipo: any;
  por_prioridad: any;
  por_tecnico: any[];
}

interface FormularioFalla {
  no_serie: string;
  tipo_falla: 'HARDWARE' | 'SOFTWARE' | 'CONECTIVIDAD' | 'SUMINISTROS' | 'MECANICA' | 'ELECTRICA' | 'OTRA';
  descripcion_problema: string;
  sintomas: string;
  prioridad: 'BAJA' | 'NORMAL' | 'ALTA' | 'CRITICA';
  usuario_reporta: string;
  tecnico_asignado: string;
  ubicacion_falla: string;
  impacto: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  requiere_repuestos: boolean;
  observaciones: string;
}

const EquiposFallas: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consultar' | 'reportar' | 'estadisticas'>('consultar');
  
  // Estados para consulta
  const [fallas, setFallas] = useState<FallaData[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasFallas | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    estatus: 'ABIERTA',
    prioridad: '',
    tipo: '',
    tecnico: '',
    fechaDesde: '',
    fechaHasta: ''
  });

  // Estados para reportar falla
  const [equiposBusqueda, setEquiposBusqueda] = useState<any[]>([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<any>(null);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormularioFalla>({
    no_serie: '',
    tipo_falla: 'HARDWARE',
    descripcion_problema: '',
    sintomas: '',
    prioridad: 'NORMAL',
    usuario_reporta: '',
    tecnico_asignado: '',
    ubicacion_falla: '',
    impacto: 'MEDIO',
    requiere_repuestos: false,
    observaciones: ''
  });

  const [busquedaTerm, setBusquedaTerm] = useState('');
  const [fallaSeleccionada, setFallaSeleccionada] = useState<FallaData | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'consultar') {
      cargarFallas();
    }
    if (activeTab === 'reportar') {
      cargarTecnicos();
    }
  }, [activeTab, filtros]);

  const cargarFallas = async () => {
    setLoading(true);
    try {
      // Usar datos simulados por ahora
      const datosSimulados = {
        fallas: [
          {
            id: 1,
            no_serie: 'CAM001',
            nombreEquipo: 'Cámara Principal',
            tipoEquipo: 'Cámara',
            sucursal: 'Centro Principal',
            tipo_falla: 'HARDWARE',
            descripcion_problema: 'Cámara no enfoca correctamente',
            sintomas: 'Imagen borrosa, no responde a ajustes automáticos',
            prioridad: 'ALTA',
            usuario_reporta: 'Juan Pérez',
            fecha_reporte: '2024-11-06',
            fecha_solucion: null,
            tecnico_asignado: 'María González',
            solucion_aplicada: null,
            estatus: 'ABIERTA',
            tiempo_solucion_horas: null,
            observaciones: 'Requiere revisión urgente',
            ubicacion_falla: 'Centro Principal - Entrada',
            impacto: 'ALTO',
            requiere_repuestos: true,
            repuestos_utilizados: null,
            costo_reparacion: null,
            diasAbierta: 2
          },
          {
            id: 2,
            no_serie: 'CAM002',
            nombreEquipo: 'Cámara Entrada',
            tipoEquipo: 'Cámara',
            sucursal: 'Sucursal Norte',
            tipo_falla: 'SOFTWARE',
            descripcion_problema: 'Error en software de grabación',
            sintomas: 'Se reinicia automáticamente cada 30 minutos',
            prioridad: 'NORMAL',
            usuario_reporta: 'Ana Rodríguez',
            fecha_reporte: '2024-11-05',
            fecha_solucion: '2024-11-07',
            tecnico_asignado: 'Carlos López',
            solucion_aplicada: 'Actualización de firmware',
            estatus: 'RESUELTA',
            tiempo_solucion_horas: 2,
            observaciones: 'Problema resuelto con actualización',
            ubicacion_falla: 'Sucursal Norte - Acceso',
            impacto: 'MEDIO',
            requiere_repuestos: false,
            repuestos_utilizados: null,
            costo_reparacion: 0,
            diasAbierta: 2
          },
          {
            id: 3,
            no_serie: 'CAM003',
            nombreEquipo: 'Cámara Pasillo',
            tipoEquipo: 'Cámara',
            sucursal: 'Centro Principal',
            tipo_falla: 'CONECTIVIDAD',
            descripcion_problema: 'Pérdida intermitente de conexión',
            sintomas: 'Se desconecta aleatoriamente de la red',
            prioridad: 'CRITICA',
            usuario_reporta: 'Luis Martinez',
            fecha_reporte: '2024-11-04',
            fecha_solucion: null,
            tecnico_asignado: 'Juan Pérez',
            solucion_aplicada: null,
            estatus: 'EN_PROCESO',
            tiempo_solucion_horas: null,
            observaciones: 'Revisando cableado de red',
            ubicacion_falla: 'Centro Principal - Pasillo A',
            impacto: 'CRITICO',
            requiere_repuestos: true,
            repuestos_utilizados: null,
            costo_reparacion: null,
            diasAbierta: 4
          }
        ],
        estadisticas: {
          total: 3,
          abiertas: 1,
          en_proceso: 1,
          resueltas: 1,
          promedio_solucion_horas: 2,
          por_tipo: {
            hardware: 1,
            software: 1,
            conectividad: 1,
            suministros: 0,
            mecanica: 0,
            electrica: 0,
            otra: 0
          },
          por_prioridad: {
            baja: 0,
            normal: 1,
            alta: 1,
            critica: 1
          },
          por_tecnico: [
            {
              tecnico: 'María González',
              total_asignadas: 1,
              resueltas: 0,
              en_proceso: 0,
              promedio_horas: 0
            },
            {
              tecnico: 'Carlos López',
              total_asignadas: 1,
              resueltas: 1,
              en_proceso: 0,
              promedio_horas: 2
            },
            {
              tecnico: 'Juan Pérez',
              total_asignadas: 1,
              resueltas: 0,
              en_proceso: 1,
              promedio_horas: 0
            }
          ]
        }
      };

      setFallas(datosSimulados.fallas);
      setEstadisticas(datosSimulados.estadisticas);
      
    } catch (error) {
      console.error('Error cargando fallas:', error);
      // En caso de error, mostrar datos vacíos
      setFallas([]);
      setEstadisticas({
        total: 0,
        abiertas: 0,
        en_proceso: 0,
        resueltas: 0,
        promedio_solucion_horas: 0,
        por_tipo: {
          hardware: 0,
          software: 0,
          conectividad: 0,
          suministros: 0,
          mecanica: 0,
          electrica: 0,
          otra: 0
        },
        por_prioridad: { baja: 0, normal: 0, alta: 0, critica: 0 },
        por_tecnico: []
      });
    }
    setLoading(false);
  };

  const cargarTecnicos = async () => {
    try {
      // Usar datos fijos por ahora
      setTecnicos([
        { id: 1, nombre: 'Juan Pérez - Técnico Senior' },
        { id: 2, nombre: 'María González - Técnico' },
        { id: 3, nombre: 'Carlos López - Técnico Junior' },
        { id: 4, nombre: 'Ana Rodríguez - Especialista' }
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
        setEquiposBusqueda(data.data);
      }
    } catch (error) {
      console.error('Error buscando equipos:', error);
    }
  };

  const seleccionarEquipo = (equipo: any) => {
    setEquipoSeleccionado(equipo);
    setFormData(prev => ({
      ...prev,
      no_serie: equipo.no_serie,
      ubicacion_falla: `${equipo.SucursalActual} - ${equipo.AreaActual || 'Sin especificar'}`
    }));
    setBusquedaTerm(`${equipo.no_serie} - ${equipo.nombreEquipo}`);
    setEquiposBusqueda([]);
  };

  const reportarFalla = async () => {
    try {
      // Simulación de reporte exitoso
      alert('Falla reportada exitosamente');
      
      // Limpiar formulario
      setFormData({
        no_serie: '',
        tipo_falla: 'HARDWARE',
        descripcion_problema: '',
        sintomas: '',
        prioridad: 'NORMAL',
        usuario_reporta: '',
        tecnico_asignado: '',
        ubicacion_falla: '',
        impacto: 'MEDIO',
        requiere_repuestos: false,
        observaciones: ''
      });
      setEquipoSeleccionado(null);
      setBusquedaTerm('');
      
      // Recargar la lista de fallas
      cargarFallas();
      
    } catch (error) {
      console.error('Error reportando falla:', error);
      alert('Error interno del servidor');
    }
  };

  const actualizarFalla = async (updateData: any) => {
    try {
      // Simulación de actualización exitosa
      alert('Falla actualizada exitosamente');
      setShowUpdateModal(false);
      setFallaSeleccionada(null);
      
      // Recargar la lista de fallas
      cargarFallas();
      
    } catch (error) {
      console.error('Error actualizando falla:', error);
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

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'ABIERTA': return 'bg-red-100 text-red-800';
      case 'EN_PROCESO': return 'bg-yellow-100 text-yellow-800';
      case 'RESUELTA': return 'bg-green-100 text-green-800';
      case 'CANCELADA': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoFallaLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'HARDWARE': 'Hardware',
      'SOFTWARE': 'Software',
      'CONECTIVIDAD': 'Conectividad',
      'SUMINISTROS': 'Suministros',
      'MECANICA': 'Mecánica',
      'ELECTRICA': 'Eléctrica',
      'OTRA': 'Otra'
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Fallas
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Reporta y da seguimiento a las fallas de equipos
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
              { id: 'consultar', label: 'Consultar Fallas', icon: 'fas fa-search' },
              { id: 'reportar', label: 'Reportar Falla', icon: 'fas fa-plus-circle' },
              { id: 'estadisticas', label: 'Estadísticas', icon: 'fas fa-chart-bar' }
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
                <i className={`${tab.icon} h-5 w-5`}></i>
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
                    <option value="ABIERTA">Abierta</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="RESUELTA">Resuelta</option>
                    <option value="CANCELADA">Cancelada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={filtros.prioridad}
                    onChange={(e) => setFiltros({...filtros, prioridad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">Todas</option>
                    <option value="CRITICA">Crítica</option>
                    <option value="ALTA">Alta</option>
                    <option value="NORMAL">Normal</option>
                    <option value="BAJA">Baja</option>
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
                    <option value="HARDWARE">Hardware</option>
                    <option value="SOFTWARE">Software</option>
                    <option value="CONECTIVIDAD">Conectividad</option>
                    <option value="SUMINISTROS">Suministros</option>
                    <option value="MECANICA">Mecánica</option>
                    <option value="ELECTRICA">Eléctrica</option>
                    <option value="OTRA">Otra</option>
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

                <div>
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

              {/* Lista de Fallas */}
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Cargando fallas...</span>
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
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Técnico
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fechas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {fallas.map((falla) => (
                        <tr key={falla.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {falla.no_serie}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {falla.nombreEquipo}
                              </div>
                              <div className="text-xs text-gray-400">
                                {falla.sucursal}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {getTipoFallaLabel(falla.tipo_falla)}
                              </span>
                              <br />
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPrioridadColor(falla.prioridad)}`}>
                                {falla.prioridad}
                              </span>
                              <br />
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstatusColor(falla.estatus)}`}>
                                {falla.estatus}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                              <div className="font-medium mb-1">
                                {falla.descripcion_problema}
                              </div>
                              {falla.sintomas && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Síntomas: {falla.sintomas}
                                </div>
                              )}
                              <div className="text-xs text-gray-400 mt-1">
                                Reportado por: {falla.usuario_reporta}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {falla.tecnico_asignado || 'Sin asignar'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div>
                              <div>Reportado: {new Date(falla.fecha_reporte).toLocaleDateString()}</div>
                              {falla.fecha_solucion && (
                                <div>Resuelto: {new Date(falla.fecha_solucion).toLocaleDateString()}</div>
                              )}
                              <div className="text-xs text-gray-500">
                                {falla.diasAbierta} días transcurridos
                              </div>
                              {falla.tiempo_solucion_horas && (
                                <div className="text-xs text-green-600">
                                  Resuelto en {falla.tiempo_solucion_horas}h
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setFallaSeleccionada(falla);
                                setShowUpdateModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <i className="fas fa-edit"></i> Actualizar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {fallas.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No se encontraron fallas con los filtros aplicados
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Reportar */}
          {activeTab === 'reportar' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Selección de Equipo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Seleccionar Equipo
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
                            onClick={() => seleccionarEquipo(equipo)}
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

                  {/* Equipo seleccionado */}
                  {equipoSeleccionado && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Equipo Seleccionado
                      </h4>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {equipoSeleccionado.no_serie} - {equipoSeleccionado.nombreEquipo}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {equipoSeleccionado.TipoEquipo} | {equipoSeleccionado.SucursalActual}
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulario de Falla */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Detalles de la Falla
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Falla *
                      </label>
                      <select
                        value={formData.tipo_falla}
                        onChange={(e) => setFormData({...formData, tipo_falla: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="HARDWARE">Hardware</option>
                        <option value="SOFTWARE">Software</option>
                        <option value="CONECTIVIDAD">Conectividad</option>
                        <option value="SUMINISTROS">Suministros</option>
                        <option value="MECANICA">Mecánica</option>
                        <option value="ELECTRICA">Eléctrica</option>
                        <option value="OTRA">Otra</option>
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
                        Impacto
                      </label>
                      <select
                        value={formData.impacto}
                        onChange={(e) => setFormData({...formData, impacto: e.target.value as any})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="BAJO">Bajo</option>
                        <option value="MEDIO">Medio</option>
                        <option value="ALTO">Alto</option>
                        <option value="CRITICO">Crítico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Técnico Asignado
                      </label>
                      <select
                        value={formData.tecnico_asignado}
                        onChange={(e) => setFormData({...formData, tecnico_asignado: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Asignar después...</option>
                        {tecnicos.map((tecnico) => (
                          <option key={tecnico.id} value={tecnico.nombre}>
                            {tecnico.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Usuario que Reporta *
                      </label>
                      <input
                        type="text"
                        value={formData.usuario_reporta}
                        onChange={(e) => setFormData({...formData, usuario_reporta: e.target.value})}
                        placeholder="Nombre del usuario que reporta la falla"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descripción del Problema *
                    </label>
                    <textarea
                      value={formData.descripcion_problema}
                      onChange={(e) => setFormData({...formData, descripcion_problema: e.target.value})}
                      rows={3}
                      placeholder="Describe detalladamente el problema..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Síntomas Observados
                    </label>
                    <textarea
                      value={formData.sintomas}
                      onChange={(e) => setFormData({...formData, sintomas: e.target.value})}
                      rows={2}
                      placeholder="Síntomas específicos que presenta el equipo..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Observaciones Adicionales
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                      rows={2}
                      placeholder="Información adicional relevante..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="requiere_repuestos"
                      checked={formData.requiere_repuestos}
                      onChange={(e) => setFormData({...formData, requiere_repuestos: e.target.checked})}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="requiere_repuestos" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Requiere repuestos
                    </label>
                  </div>

                  <button
                    onClick={reportarFalla}
                    disabled={!equipoSeleccionado || !formData.descripcion_problema || !formData.usuario_reporta}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 
                             disabled:bg-gray-400 disabled:cursor-not-allowed
                             flex items-center justify-center space-x-2"
                  >
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Reportar Falla</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Estadísticas */}
          {activeTab === 'estadisticas' && estadisticas && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Fallas Abiertas</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">{estadisticas.abiertas}</p>
                    </div>
                    <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">En Proceso</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{estadisticas.en_proceso}</p>
                    </div>
                    <i className="fas fa-tools text-2xl text-yellow-600"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Resueltas</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{estadisticas.resueltas}</p>
                    </div>
                    <i className="fas fa-check-circle text-2xl text-green-600"></i>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{estadisticas.total}</p>
                    </div>
                    <i className="fas fa-clipboard-list text-2xl text-blue-600"></i>
                  </div>
                </div>
              </div>

              {/* Distribución por Tipo */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Distribución por Tipo de Falla
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{estadisticas.por_tipo.hardware}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Hardware</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.por_tipo.software}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Software</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.por_tipo.conectividad}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Conectividad</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{estadisticas.por_tipo.suministros}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Suministros</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.por_tipo.mecanica}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mecánica</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.por_tipo.electrica}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Eléctrica</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{estadisticas.por_tipo.otra}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Otra</div>
                  </div>
                </div>
              </div>

              {/* Distribución por Prioridad */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Distribución por Prioridad
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{estadisticas.por_prioridad.critica}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Crítica</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{estadisticas.por_prioridad.alta}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Alta</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{estadisticas.por_prioridad.normal}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Normal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{estadisticas.por_prioridad.baja}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Baja</div>
                  </div>
                </div>
              </div>

              {/* Promedio de Solución */}
              {estadisticas.promedio_solucion_horas > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Tiempo Promedio de Solución
                  </h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{estadisticas.promedio_solucion_horas}h</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Promedio para fallas resueltas</div>
                  </div>
                </div>
              )}

              {/* Estadísticas por Técnico */}
              {estadisticas.por_tecnico.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Rendimiento por Técnico
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Técnico
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Asignadas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Resueltas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            En Proceso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Promedio (h)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {estadisticas.por_tecnico.map((tecnico, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {tecnico.tecnico}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.total_asignadas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                              {tecnico.resueltas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                              {tecnico.en_proceso}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                              {tecnico.promedio_horas}h
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

      {/* Modal de Actualización */}
      {showUpdateModal && fallaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Actualizar Falla #{fallaSeleccionada.id}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nuevo Estatus
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onChange={(e) => {
                    const estatus = e.target.value;
                    if (estatus === 'RESUELTA') {
                      const horas = prompt('Ingrese las horas de solución:');
                      const solucion = prompt('Ingrese la solución aplicada:');
                      actualizarFalla({
                        estatus,
                        tiempo_solucion_horas: horas ? parseFloat(horas) : undefined,
                        solucion_aplicada: solucion || undefined
                      });
                    } else {
                      actualizarFalla({ estatus });
                    }
                  }}
                >
                  <option value="">Seleccionar nuevo estatus...</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="RESUELTA">Resuelta</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asignar Técnico
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      actualizarFalla({ tecnico_asignado: e.target.value });
                    }
                  }}
                >
                  <option value="">Asignar técnico...</option>
                  {tecnicos.map((tecnico) => (
                    <option key={tecnico.id} value={tecnico.nombre}>
                      {tecnico.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquiposFallas;