'use client';

import { useState, useEffect } from 'react';
import EquiposEditar from './EquiposEditar';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  TimeScale
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  TimeScale
);

interface EquipoDashboardProps {
  noSerie: string;
  onVolver?: () => void;
}

interface DetalleEquipo {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  numeroActivo: string;
  fechaAlta: string;
  TipoEquipo: string;
  DescripcionTipo: string;
  EstatusEquipo: string;
  UsuarioAsignado: string;
  CorreoUsuario: string;
  SucursalActual: string;
  AreaActual: string;
  DescripcionArea: string;
  ZonaSucursal: string;
  EstadoSucursal: string;
  MunicipioSucursal: string;
  diasEnSistema: number;
  colorEstatus: string;
}

interface MovimientoHistorial {
  fecha: string;
  fechaFin?: string | null;
  tipoMovimiento: string;
  estatusMovimiento: string;
  sucursalOrigen?: string;
  sucursalDestino?: string;
  usuarioMovimiento?: string;
}

interface EstadisticasEquipo {
  totalMovimientos: number;
  totalTraslados: number;
  totalMantenimientos: number;
  totalReparaciones: number;
  movimientosAbiertos: number;
  promedioDiasMovimiento: number;
  ultimoMovimiento: string | null;
}

interface EquipoSimilar {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  estatus: string;
}

interface ResponseData {
  equipo: DetalleEquipo;
  historial: MovimientoHistorial[];
  estadisticas: EstadisticasEquipo;
  equiposSimilares: EquipoSimilar[];
}

export default function EquipoDashboard({ noSerie, onVolver }: EquipoDashboardProps) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Cargar datos del equipo
  const cargarDatosEquipo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/equipos/${noSerie}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Error al cargar datos del equipo');
      }
    } catch (err) {
      console.error('Error cargando datos del equipo:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para el modal de edición
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSave = (equipoActualizado: any) => {
    // Actualizar los datos locales con la información editada
    if (data) {
      setData({
        ...data,
        equipo: { ...data.equipo, ...equipoActualizado }
      });
    }
    setShowEditModal(false);
    // Recargar los datos para estar seguros
    cargarDatosEquipo();
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
  };

  useEffect(() => {
    if (noSerie) {
      cargarDatosEquipo();
    }
  }, [noSerie]);

  // Función para obtener color del estatus
  const getStatusColor = (estatus: string) => {
    switch (estatus?.toLowerCase()) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'en uso':
        return 'bg-blue-100 text-blue-800';
      case 'mantenimiento':
      case 'en reparación':
        return 'bg-yellow-100 text-yellow-800';
      case 'dañado':
        return 'bg-red-100 text-red-800';
      case 'extraviado':
        return 'bg-red-100 text-red-800';
      case 'baja':
      case 'obsoleto':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Configuración para gráfico de movimientos por tipo
  const getMovimientosPorTipoData = () => {
    if (!data?.estadisticas) return null;

    const { totalTraslados, totalMantenimientos, totalReparaciones } = data.estadisticas;

    return {
      labels: ['Traslados', 'Mantenimientos', 'Reparaciones'],
      datasets: [
        {
          label: 'Cantidad',
          data: [totalTraslados, totalMantenimientos, totalReparaciones],
          backgroundColor: ['#3B82F6', '#F59E0B', '#EF4444'],
          borderColor: ['#2563EB', '#D97706', '#DC2626'],
          borderWidth: 1
        }
      ]
    };
  };

  // Configuración para gráfico de actividad mensual (últimos 6 meses)
  const getActividadMensualData = () => {
    if (!data?.historial) return null;

    // Agrupar movimientos por mes
    const movimientosPorMes: { [key: string]: number } = {};
    const fechaLimite = new Date();
    fechaLimite.setMonth(fechaLimite.getMonth() - 6);

    data.historial.forEach(mov => {
      const fecha = new Date(mov.fecha);
      if (fecha >= fechaLimite) {
        const mes = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'short' });
        movimientosPorMes[mes] = (movimientosPorMes[mes] || 0) + 1;
      }
    });

    const meses = Object.keys(movimientosPorMes).sort();
    const valores = meses.map(mes => movimientosPorMes[mes]);

    return {
      labels: meses,
      datasets: [
        {
          label: 'Movimientos',
          data: valores,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
          <p className="text-lg font-semibold mb-2">Error al cargar datos</p>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={cargarDatosEquipo}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { equipo, historial, estadisticas, equiposSimilares } = data;

  return (
    <div className="space-y-6">
      {/* Header con información básica */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {onVolver && (
              <button
                onClick={onVolver}
                className="text-gray-600 hover:text-gray-900 p-2"
                title="Volver"
              >
                <i className="fas fa-arrow-left text-lg"></i>
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{equipo.nombreEquipo}</h1>
              <p className="text-gray-600">#{equipo.no_serie}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(equipo.EstatusEquipo)}`}>
              {equipo.EstatusEquipo}
            </span>
            <button
              onClick={handleEdit}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              title="Editar equipo"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={cargarDatosEquipo}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              title="Actualizar datos"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>

        {/* Información básica en tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Modelo</p>
                <p className="text-lg font-semibold text-gray-900">{equipo.modelo}</p>
              </div>
              <i className="fas fa-laptop text-blue-500 text-xl"></i>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tipo</p>
                <p className="text-lg font-semibold text-gray-900">{equipo.TipoEquipo}</p>
              </div>
              <i className="fas fa-tag text-green-500 text-xl"></i>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Días en Sistema</p>
                <p className="text-lg font-semibold text-gray-900">{equipo.diasEnSistema}</p>
              </div>
              <i className="fas fa-calendar text-orange-500 text-xl"></i>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">No. Activo</p>
                <p className="text-lg font-semibold text-gray-900">{equipo.numeroActivo}</p>
              </div>
              <i className="fas fa-barcode text-purple-500 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <i className="fas fa-exchange-alt text-white text-sm"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Movimientos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalMovimientos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                <i className="fas fa-truck text-white text-sm"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Traslados</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalTraslados}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-600 rounded-md flex items-center justify-center">
                <i className="fas fa-tools text-white text-sm"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Mantenimientos</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalMantenimientos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center">
                <i className="fas fa-wrench text-white text-sm"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reparaciones</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.totalReparaciones}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información de ubicación y usuario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información de ubicación */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-map-marker-alt text-red-500 mr-2"></i>
            Ubicación Actual
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sucursal:</span>
              <span className="font-medium">{equipo.SucursalActual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Área:</span>
              <span className="font-medium">{equipo.AreaActual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Zona:</span>
              <span className="font-medium">{equipo.ZonaSucursal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="font-medium">{equipo.EstadoSucursal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Municipio:</span>
              <span className="font-medium">{equipo.MunicipioSucursal}</span>
            </div>
          </div>
        </div>

        {/* Información de usuario */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-user text-blue-500 mr-2"></i>
            Usuario Asignado
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Nombre:</span>
              <span className="font-medium">{equipo.UsuarioAsignado}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Correo:</span>
              <span className="font-medium">{equipo.CorreoUsuario}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Promedio días/movimiento:</span>
              <span className="font-medium">{estadisticas.promedioDiasMovimiento} días</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Último movimiento:</span>
              <span className="font-medium">
                {estadisticas.ultimoMovimiento 
                  ? new Date(estadisticas.ultimoMovimiento).toLocaleDateString('es-ES')
                  : 'Sin movimientos'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de movimientos por tipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Movimientos por Tipo</h3>
          <div className="h-64">
            {getMovimientosPorTipoData() ? (
              <Bar 
                data={getMovimientosPorTipoData()!} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sin datos de movimientos
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de actividad mensual */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Mensual (Últimos 6 meses)</h3>
          <div className="h-64">
            {getActividadMensualData() ? (
              <Line 
                data={getActividadMensualData()!} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  }
                }} 
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Sin actividad reciente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de movimientos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <i className="fas fa-history text-gray-500 mr-2"></i>
          Historial de Movimientos (Últimos 10)
        </h3>
        {historial && historial.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destino
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial.slice(0, 10).map((mov, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(mov.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.tipoMovimiento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mov.estatusMovimiento === 'COMPLETADO' 
                          ? 'bg-green-100 text-green-800'
                          : mov.estatusMovimiento === 'ABIERTO'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {mov.estatusMovimiento}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.sucursalOrigen || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mov.sucursalDestino || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <i className="fas fa-inbox text-4xl mb-4"></i>
            <p>No hay movimientos registrados para este equipo</p>
          </div>
        )}
      </div>

      {/* Equipos similares */}
      {equiposSimilares && equiposSimilares.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <i className="fas fa-copy text-blue-500 mr-2"></i>
            Equipos Similares
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {equiposSimilares.slice(0, 6).map((similar, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{similar.nombreEquipo}</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(similar.estatus)}`}>
                    {similar.estatus}
                  </span>
                </div>
                <p className="text-sm text-gray-600">#{similar.no_serie}</p>
                <p className="text-sm text-gray-600">{similar.modelo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && data?.equipo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Editar Equipo
              </h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <EquiposEditar
              equipoData={data.equipo}
              onSave={handleEditSave}
              onCancel={handleEditCancel}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}