'use client';

import React, { useEffect, useState } from 'react';

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

  useEffect(() => {
    // Simulamos datos mientras no tengamos la API completa
    const datosMock: Sucursal[] = [
      {
        id: 1,
        nombre: "Sucursal Centro",
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

    // Calcular estadísticas
    const statsCalculadas: SucursalesStats = {
      totalSucursales: datosMock.length,
      totalCamaras: datosMock.reduce((sum, s) => sum + s.totalCamaras, 0),
      totalSensores: datosMock.reduce((sum, s) => sum + s.totalSensores, 0),
      camarasActivas: datosMock.reduce((sum, s) => sum + s.camarasActivas, 0),
      sensoresActivos: datosMock.reduce((sum, s) => sum + s.sensoresActivos, 0)
    };

    setTimeout(() => {
      setSucursales(datosMock);
      setSucursalesFiltradas(datosMock);
      setStats(statsCalculadas);
      setLoading(false);
    }, 500);
  }, []);

  // Efecto para filtrar sucursales
  useEffect(() => {
    let filtradas = sucursales;

    // Filtrar por texto de búsqueda
    if (searchTerm) {
      filtradas = filtradas.filter(sucursal =>
        sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.estado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sucursal.telefono?.includes(searchTerm)
      );
    }

    // Filtrar por estado operativo
    if (filtroEstado !== 'todos') {
      filtradas = filtradas.filter(sucursal => {
        const esOperativa = sucursal.camarasActivas > 0 && sucursal.sensoresActivos > 0;
        return filtroEstado === 'operativa' ? esOperativa : !esOperativa;
      });
    }

    setSucursalesFiltradas(filtradas);
  }, [searchTerm, filtroEstado, sucursales]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Sucursales</h1>
        <p className="text-gray-600">Monitoreo y administración de equipos por sucursal</p>
      </div>

      {/* Barra de Búsqueda */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="Buscar sucursales por nombre, ciudad, estado..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <i className="fas fa-times text-gray-400 hover:text-gray-600 cursor-pointer"></i>
                </button>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              {searchTerm || filtroEstado !== 'todos' ? (
                <span>Mostrando {sucursalesFiltradas.length} de {sucursales.length} sucursales</span>
              ) : (
                <span>Total: {sucursales.length} sucursales</span>
              )}
            </div>
          </div>
          
          {/* Filtros Rápidos */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
            <button
              onClick={() => setFiltroEstado('todos')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroEstado === 'todos'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-building mr-1"></i>
              Todas
            </button>
            <button
              onClick={() => setFiltroEstado('operativa')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroEstado === 'operativa'
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-check-circle mr-1"></i>
              Operativas
            </button>
            <button
              onClick={() => setFiltroEstado('inactiva')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filtroEstado === 'inactiva'
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <i className="fas fa-exclamation-circle mr-1"></i>
              Inactivas
            </button>
            {(searchTerm || filtroEstado !== 'todos') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFiltroEstado('todos');
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                <i className="fas fa-times mr-1"></i>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <i className="fas fa-building text-purple-700"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Sucursales</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSucursales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <i className="fas fa-video text-purple-700"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Cámaras</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCamaras}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <i className="fas fa-satellite-dish text-purple-700"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Sensores</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSensores}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <i className="fas fa-check-circle text-purple-700"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Cámaras Activas</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.camarasActivas}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100">
              <i className="fas fa-satellite-dish text-purple-700"></i>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Sensores Activos</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.sensoresActivos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Sucursales */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sucursales Registradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sucursal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cámaras
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sensores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sucursalesFiltradas.length > 0 ? (
                sucursalesFiltradas.map((sucursal) => (
                <tr key={sucursal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <i className="fas fa-building text-blue-600"></i>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{sucursal.nombre}</div>
                        <div className="text-sm text-gray-500">ID: {sucursal.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sucursal.direccion}</div>
                    <div className="text-sm text-gray-500">{sucursal.ciudad}, {sucursal.estado}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{sucursal.telefono}</div>
                    <div className="text-sm text-gray-500">{sucursal.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2">
                        {sucursal.camarasActivas}/{sucursal.totalCamaras}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sucursal.camarasActivas === sucursal.totalCamaras
                          ? 'bg-green-100 text-green-800'
                          : sucursal.camarasActivas > sucursal.totalCamaras * 0.8
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((sucursal.camarasActivas / sucursal.totalCamaras) * 100)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 mr-2">
                        {sucursal.sensoresActivos}/{sucursal.totalSensores}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sucursal.sensoresActivos === sucursal.totalSensores
                          ? 'bg-green-100 text-green-800'
                          : sucursal.sensoresActivos > sucursal.totalSensores * 0.8
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((sucursal.sensoresActivos / sucursal.totalSensores) * 100)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sucursal.camarasActivas > 0 && sucursal.sensoresActivos > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {sucursal.camarasActivas > 0 && sucursal.sensoresActivos > 0 ? 'Operativa' : 'Inactiva'}
                      </div>
                    </div>
                  </td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-search text-gray-300 text-4xl mb-4"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron sucursales</h3>
                      <p className="text-gray-500">
                        {searchTerm 
                          ? `No hay sucursales que coincidan con "${searchTerm}"`
                          : 'No hay sucursales disponibles'
                        }
                      </p>
                      {searchTerm && (
                        <button
                          onClick={clearSearch}
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <i className="fas fa-times mr-2"></i>
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}