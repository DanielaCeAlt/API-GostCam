'use client';

import React, { useEffect, useState } from 'react';

interface Equipo {
  no_serie: string;
  nombreEquipo: string;
  TipoEquipo: string;
  marca: string;
  modelo: string;
  EstatusEquipo: string;
  AreaActual: string;
  fechaInstalacion: string;
  ultimoMantenimiento?: string;
  estadoConexion: 'Conectado' | 'Desconectado' | 'Error';
}

interface Sucursal {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  estado: string;
  telefono?: string;
  email?: string;
  totalCamaras: number;
  totalSensores: number;
  camarasActivas: number;
  sensoresActivos: number;
  equiposTotal: number;
}

interface SucursalesStats {
  totalSucursales: number;
  totalCamaras: number;
  totalSensores: number;
  camarasActivas: number;
  sensoresActivos: number;
}

export default function Sucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalesFiltradas, setSucursalesFiltradas] = useState<Sucursal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'operativa' | 'inactiva'>('todos');
  const [stats, setStats] = useState<SucursalesStats>({
    totalSucursales: 0,
    totalCamaras: 0,
    totalSensores: 0,
    camarasActivas: 0,
    sensoresActivos: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Estados para vista de detalle
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null);
  const [equiposSucursal, setEquiposSucursal] = useState<Equipo[]>([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);
  const [vistaActual, setVistaActual] = useState<'lista' | 'detalle'>('lista');

  useEffect(() => {
    cargarSucursales();
  }, []);

  useEffect(() => {
    filtrarSucursales();
  }, [searchTerm, filtroEstado, sucursales]);

  const cargarSucursales = async () => {
    setLoading(true);
    try {
      // Simulamos datos de sucursales
      const datosMock: Sucursal[] = [
        {
          id: 1,
          nombre: "Centro Principal",
          direccion: "Av. Principal 123",
          ciudad: "Ciudad de México",
          estado: "CDMX",
          telefono: "55-1234-5678",
          email: "centro@gostcam.com",
          totalCamaras: 25,
          totalSensores: 15,
          camarasActivas: 23,
          sensoresActivos: 14,
          equiposTotal: 40
        },
        {
          id: 2,
          nombre: "Sucursal Norte",
          direccion: "Calle Norte 456",
          ciudad: "Monterrey",
          estado: "Nuevo León",
          telefono: "81-8765-4321",
          email: "norte@gostcam.com",
          totalCamaras: 18,
          totalSensores: 12,
          camarasActivas: 16,
          sensoresActivos: 11,
          equiposTotal: 30
        },
        {
          id: 3,
          nombre: "Sucursal Sur",
          direccion: "Blvd. Sur 789",
          ciudad: "Guadalajara",
          estado: "Jalisco",
          telefono: "33-2468-1357",
          email: "sur@gostcam.com",
          totalCamaras: 22,
          totalSensores: 18,
          camarasActivas: 20,
          sensoresActivos: 17,
          equiposTotal: 40
        },
        {
          id: 4,
          nombre: "Sucursal Oeste",
          direccion: "Av. Oeste 321",
          ciudad: "Tijuana",
          estado: "Baja California",
          telefono: "664-9876-5432",
          email: "oeste@gostcam.com",
          totalCamaras: 15,
          totalSensores: 10,
          camarasActivas: 14,
          sensoresActivos: 9,
          equiposTotal: 25
        }
      ];

      setSucursales(datosMock);
      
      // Calcular estadísticas
      const statsCalculadas: SucursalesStats = {
        totalSucursales: datosMock.length,
        totalCamaras: datosMock.reduce((sum, s) => sum + s.totalCamaras, 0),
        totalSensores: datosMock.reduce((sum, s) => sum + s.totalSensores, 0),
        camarasActivas: datosMock.reduce((sum, s) => sum + s.camarasActivas, 0),
        sensoresActivos: datosMock.reduce((sum, s) => sum + s.sensoresActivos, 0)
      };
      setStats(statsCalculadas);
      
    } catch (error) {
      console.error('Error cargando sucursales:', error);
    }
    setLoading(false);
  };

  const cargarEquiposSucursal = async (sucursal: Sucursal) => {
    setLoadingEquipos(true);
    try {
      // Simulamos la carga de equipos por sucursal
      const equiposMock: Equipo[] = generarEquiposPorSucursal(sucursal);
      setEquiposSucursal(equiposMock);
      
    } catch (error) {
      console.error('Error cargando equipos de sucursal:', error);
      setEquiposSucursal([]);
    }
    setLoadingEquipos(false);
  };

  const generarEquiposPorSucursal = (sucursal: Sucursal): Equipo[] => {
    const equipos: Equipo[] = [];
    
    // Generar cámaras
    for (let i = 1; i <= sucursal.totalCamaras; i++) {
      equipos.push({
        no_serie: `CAM${sucursal.id}${i.toString().padStart(3, '0')}`,
        nombreEquipo: `Cámara ${i} - ${sucursal.nombre}`,
        TipoEquipo: 'Cámara',
        marca: i % 3 === 0 ? 'Hikvision' : i % 2 === 0 ? 'Dahua' : 'Axis',
        modelo: i % 3 === 0 ? 'DS-2CD2143G0-I' : i % 2 === 0 ? 'IPC-HFW4431R-Z' : 'M3045-V',
        EstatusEquipo: i <= sucursal.camarasActivas ? 'Activo' : 'Inactivo',
        AreaActual: i <= 5 ? 'Entrada' : i <= 10 ? 'Pasillo Principal' : i <= 15 ? 'Oficinas' : i <= 20 ? 'Almacén' : 'Exterior',
        fechaInstalacion: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        ultimoMantenimiento: Math.random() > 0.3 ? `2024-11-${Math.floor(Math.random() * 7) + 1}` : undefined,
        estadoConexion: i <= sucursal.camarasActivas ? (Math.random() > 0.1 ? 'Conectado' : 'Error') : 'Desconectado'
      });
    }
    
    // Generar sensores/dispositivos
    for (let i = 1; i <= sucursal.totalSensores; i++) {
      equipos.push({
        no_serie: `SEN${sucursal.id}${i.toString().padStart(3, '0')}`,
        nombreEquipo: `Sensor ${i} - ${sucursal.nombre}`,
        TipoEquipo: i % 4 === 0 ? 'Sensor de Movimiento' : i % 3 === 0 ? 'Sensor de Puerta' : i % 2 === 0 ? 'Detector de Humo' : 'Sensor de Temperatura',
        marca: i % 3 === 0 ? 'Honeywell' : i % 2 === 0 ? 'Bosch' : 'DSC',
        modelo: i % 3 === 0 ? 'PIR-312' : i % 2 === 0 ? 'ISC-BPR2-W12' : 'LC-100PI',
        EstatusEquipo: i <= sucursal.sensoresActivos ? 'Activo' : 'Inactivo',
        AreaActual: i <= 3 ? 'Entrada' : i <= 6 ? 'Pasillo Principal' : i <= 9 ? 'Oficinas' : i <= 12 ? 'Almacén' : 'Exterior',
        fechaInstalacion: `2024-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        ultimoMantenimiento: Math.random() > 0.4 ? `2024-11-${Math.floor(Math.random() * 7) + 1}` : undefined,
        estadoConexion: i <= sucursal.sensoresActivos ? (Math.random() > 0.05 ? 'Conectado' : 'Error') : 'Desconectado'
      });
    }
    
    return equipos;
  };

  const filtrarSucursales = () => {
    let filtradas = sucursales;

    if (searchTerm) {
      filtradas = filtradas.filter(sucursal =>
        sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.estado.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(sucursal => {
        const porcentajeActivo = ((sucursal.camarasActivas + sucursal.sensoresActivos) / sucursal.equiposTotal) * 100;
        return filtroEstado === 'operativa' ? porcentajeActivo >= 80 : porcentajeActivo < 80;
      });
    }

    setSucursalesFiltradas(filtradas);
  };

  const verDetalleSucursal = async (sucursal: Sucursal) => {
    setSucursalSeleccionada(sucursal);
    setVistaActual('detalle');
    await cargarEquiposSucursal(sucursal);
  };

  const volverALista = () => {
    setVistaActual('lista');
    setSucursalSeleccionada(null);
    setEquiposSucursal([]);
  };

  const getEstatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-gray-100 text-gray-800';
      case 'Con Falla': return 'bg-red-100 text-red-800';
      case 'Mantenimiento': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConexionColor = (conexion: string) => {
    switch (conexion) {
      case 'Conectado': return 'bg-green-100 text-green-800';
      case 'Desconectado': return 'bg-gray-100 text-gray-800';
      case 'Error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (vistaActual === 'detalle' && sucursalSeleccionada) {
    return (
      <div className="space-y-6">
        {/* Header de Detalle */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={volverALista}
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left"></i>
                <span>Volver</span>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {sucursalSeleccionada.nombre}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {sucursalSeleccionada.direccion}, {sucursalSeleccionada.ciudad}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total de Equipos</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {sucursalSeleccionada.equiposTotal}
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de la Sucursal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Cámaras</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {sucursalSeleccionada.camarasActivas}/{sucursalSeleccionada.totalCamaras}
                </p>
              </div>
              <i className="fas fa-video text-2xl text-blue-600"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Sensores</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {sucursalSeleccionada.sensoresActivos}/{sucursalSeleccionada.totalSensores}
                </p>
              </div>
              <i className="fas fa-broadcast-tower text-2xl text-green-600"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Activos</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {sucursalSeleccionada.camarasActivas + sucursalSeleccionada.sensoresActivos}
                </p>
              </div>
              <i className="fas fa-check-circle text-2xl text-purple-600"></i>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">% Operativo</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {Math.round(((sucursalSeleccionada.camarasActivas + sucursalSeleccionada.sensoresActivos) / sucursalSeleccionada.equiposTotal) * 100)}%
                </p>
              </div>
              <i className="fas fa-chart-line text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>

        {/* Lista de Equipos - Separada por tipo */}
        <div className="space-y-6">
          {loadingEquipos ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando equipos...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Sección de Cámaras */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-video text-2xl text-blue-600"></i>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Cámaras ({equiposSucursal.filter(e => e.TipoEquipo === 'Cámara').length})
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-blue-50 dark:bg-blue-900/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Número de Serie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Marca/Modelo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Conexión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                          Último Mant.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {equiposSucursal.filter(equipo => equipo.TipoEquipo === 'Cámara').map((equipo) => (
                        <tr key={equipo.no_serie} className="hover:bg-blue-50 dark:hover:bg-blue-900/10">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {equipo.no_serie}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {equipo.nombreEquipo}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{equipo.marca}</div>
                              <div className="text-gray-500 dark:text-gray-400">{equipo.modelo}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {equipo.AreaActual}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstatusColor(equipo.EstatusEquipo)}`}>
                              {equipo.EstatusEquipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConexionColor(equipo.estadoConexion)}`}>
                              {equipo.estadoConexion}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {equipo.ultimoMantenimiento ? new Date(equipo.ultimoMantenimiento).toLocaleDateString() : 'Sin registro'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {equiposSucursal.filter(e => e.TipoEquipo === 'Cámara').length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay cámaras registradas en esta sucursal
                    </div>
                  )}
                </div>
              </div>

              {/* Sección de Sensores y Dispositivos */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-broadcast-tower text-2xl text-green-600"></i>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Sensores y Dispositivos ({equiposSucursal.filter(e => e.TipoEquipo !== 'Cámara').length})
                    </h3>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-green-50 dark:bg-green-900/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Número de Serie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Nombre/Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Marca/Modelo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Conexión
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                          Último Mant.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {equiposSucursal.filter(equipo => equipo.TipoEquipo !== 'Cámara').map((equipo) => (
                        <tr key={equipo.no_serie} className="hover:bg-green-50 dark:hover:bg-green-900/10">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {equipo.no_serie}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {equipo.nombreEquipo}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {equipo.TipoEquipo}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{equipo.marca}</div>
                              <div className="text-gray-500 dark:text-gray-400">{equipo.modelo}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {equipo.AreaActual}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstatusColor(equipo.EstatusEquipo)}`}>
                              {equipo.EstatusEquipo}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getConexionColor(equipo.estadoConexion)}`}>
                              {equipo.estadoConexion}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {equipo.ultimoMantenimiento ? new Date(equipo.ultimoMantenimiento).toLocaleDateString() : 'Sin registro'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {equiposSucursal.filter(e => e.TipoEquipo !== 'Cámara').length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No hay sensores o dispositivos registrados en esta sucursal
                    </div>
                  )}
                </div>
              </div>

              {equiposSucursal.length === 0 && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No hay equipos registrados en esta sucursal
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <i className="fas fa-building text-2xl text-blue-600"></i>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Gestión de Sucursales
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Administra todas las sucursales y sus equipos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Sucursales</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalSucursales}</p>
            </div>
            <i className="fas fa-building text-2xl text-blue-600"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Cámaras Totales</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalCamaras}</p>
            </div>
            <i className="fas fa-video text-2xl text-green-600"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Sensores Totales</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalSensores}</p>
            </div>
            <i className="fas fa-broadcast-tower text-2xl text-purple-600"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Cámaras Activas</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.camarasActivas}</p>
            </div>
            <i className="fas fa-check-circle text-2xl text-orange-600"></i>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Sensores Activos</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">{stats.sensoresActivos}</p>
            </div>
            <i className="fas fa-shield-alt text-2xl text-red-600"></i>
          </div>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar Sucursal
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, ciudad o estado..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado Operativo
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las Sucursales</option>
              <option value="operativa">Operativas (≥80%)</option>
              <option value="inactiva">Con Problemas (&lt;80%)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={cargarSucursales}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 
                       flex items-center justify-center space-x-2"
            >
              <i className="fas fa-sync-alt"></i>
              <span>Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Sucursales */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Sucursales ({sucursalesFiltradas.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando sucursales...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {sucursalesFiltradas.map((sucursal) => {
              const porcentajeOperativo = Math.round(((sucursal.camarasActivas + sucursal.sensoresActivos) / sucursal.equiposTotal) * 100);
              
              return (
                <div
                  key={sucursal.id}
                  onClick={() => verDetalleSucursal(sucursal)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${porcentajeOperativo >= 80 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {sucursal.nombre}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {sucursal.ciudad}, {sucursal.estado}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      porcentajeOperativo >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {porcentajeOperativo}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{sucursal.camarasActivas}</div>
                      <div className="text-xs text-gray-500">Cámaras</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{sucursal.sensoresActivos}</div>
                      <div className="text-xs text-gray-500">Sensores</div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div>{sucursal.direccion}</div>
                    {sucursal.telefono && <div>📞 {sucursal.telefono}</div>}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total: {sucursal.equiposTotal} equipos
                    </span>
                    <i className="fas fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && sucursalesFiltradas.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron sucursales con los filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
}