// =============================================
// COMPONENTE: DASHBOARD
// =============================================

'use client';

import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useApp } from '@/contexts/AppContext';

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const { state, loadDashboardStats, testAltaEquipo } = useApp();
  const [vistaActual, setVistaActual] = useState<'resumen'>('resumen');

  useEffect(() => {
    if (state.isAuthenticated) {
      loadDashboardStats();
    }
  }, [state.isAuthenticated]);

  if (state.isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <i className="fas fa-spinner fa-spin text-blue-600 text-xl"></i>
            <span className="text-gray-600">Cargando dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <i className="fas fa-exclamation-circle text-red-400 mt-0.5 mr-2"></i>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error cargando dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{state.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = state.dashboardStats;

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  // Configuración para el gráfico de barras (equipos por tipo)
  const equiposPorTipoData = {
    labels: stats.equiposPorTipo.map(item => item.tipo),
    datasets: [
      {
        label: 'Cantidad de Equipos',
        data: stats.equiposPorTipo.map(item => item.cantidad),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',   // blue
          'rgba(16, 185, 129, 0.8)',   // green
          'rgba(245, 158, 11, 0.8)',   // yellow
          'rgba(239, 68, 68, 0.8)',    // red
          'rgba(139, 92, 246, 0.8)',   // purple
          'rgba(6, 182, 212, 0.8)',    // cyan
          'rgba(236, 72, 153, 0.8)',   // pink
          'rgba(107, 114, 128, 0.8)',  // gray
          'rgba(34, 197, 94, 0.8)',    // emerald
          'rgba(251, 146, 60, 0.8)',   // orange
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(107, 114, 128, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 146, 60, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Configuración para el gráfico de dona (estatus)
  const estatusData = {
    labels: stats.estatusPorcentajes.map(item => item.estatus),
    datasets: [
      {
        data: stats.estatusPorcentajes.map(item => item.porcentaje),
        backgroundColor: stats.estatusPorcentajes.map(item => item.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      {/* Contenido dinámico según la vista */}
      {vistaActual === 'resumen' && (
        <>
          {/* Controles de actualización */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Resumen del Sistema</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => loadDashboardStats()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Actualizar
              </button>

            </div>
          </div>

          {/* Tarjetas de estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total de equipos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <i className="fas fa-desktop text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Equipos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEquipos}</p>
                </div>
              </div>
            </div>

            {/* Equipos disponibles */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                    <i className="fas fa-check-circle text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.equiposDisponibles}</p>
                </div>
              </div>
            </div>

            {/* Equipos en uso */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                    <i className="fas fa-play-circle text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Uso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.equiposEnUso}</p>
                </div>
              </div>
            </div>

            {/* Movimientos del mes */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                    <i className="fas fa-exchange-alt text-white text-sm"></i>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Movimientos/Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.movimientosMes}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de equipos por tipo */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipos por Tipo</h3>
              <div className="h-64">
                {stats.equiposPorTipo.length > 0 ? (
                  <Bar data={equiposPorTipoData} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sin datos disponibles
                  </div>
                )}
              </div>
            </div>

            {/* Gráfico de estatus */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Estatus</h3>
              <div className="h-64">
                {stats.estatusPorcentajes.length > 0 ? (
                  <Doughnut data={estatusData} options={chartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sin datos disponibles
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumen adicional */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Equipos en mantenimiento */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Mantenimiento</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.equiposMantenimiento}</p>
                </div>
                <i className="fas fa-tools text-yellow-500 text-2xl"></i>
              </div>
            </div>

            {/* Equipos dañados */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dañados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.equiposDañados}</p>
                </div>
                <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
              </div>
            </div>

            {/* Movimientos abiertos */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Movimientos Abiertos</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.movimientosAbiertos}</p>
                </div>
                <i className="fas fa-clock text-blue-500 text-2xl"></i>
              </div>
            </div>
          </div>
        </>
      )}


    </div>
  );
}