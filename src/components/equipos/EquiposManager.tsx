'use client';

import React, { useState } from 'react';
import EquiposList from './EquiposList';
import EquiposBusqueda from './EquiposBusqueda';
import EquiposAlta from './EquiposAlta';
import { apiService } from '@/lib/apiService';

// Tipos de vista disponibles
type VistaActual = 'lista' | 'busqueda' | 'alta' | 'historial' | 'cambiarUbicacion' | 'mantenimientoEquipo';

interface EquiposManagerProps {
  vistaInicial?: VistaActual;
}

export default function EquiposManager({ vistaInicial = 'lista' }: EquiposManagerProps) {
  const [vistaActual, setVistaActual] = useState<VistaActual>(vistaInicial);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string | null>(null);

  // Navegación entre vistas
  const cambiarVista = (nuevaVista: VistaActual) => {
    setVistaActual(nuevaVista);
    setEquipoSeleccionado(null);
  };

  // Callbacks para interacción entre componentes
  const handleEquipoSelect = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
  };

  const handleVerDetalles = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    // Aquí podrías abrir un modal o cambiar a vista de detalles
    console.log('Ver detalles de:', noSerie);
  };

  const handleEditarEquipo = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    // Aquí podrías cambiar a vista de edición
    console.log('Editar equipo:', noSerie);
  };

  const handleAltaExitosa = () => {
    // Volver a la lista después de crear un equipo
    setVistaActual('lista');
  };

  const handleCancelarOperacion = () => {
    // Volver a la lista en caso de cancelar
    setVistaActual('lista');
  };

  // =================== NUEVAS FUNCIONES DE ACCIÓN ===================
  
  const handleEliminarEquipo = async (noSerie: string) => {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar el equipo ${noSerie}?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const response = await apiService.delete(`/api/equipos/${noSerie}`);
      if (response.success) {
        alert('✅ Equipo eliminado exitosamente');
        // Aquí podrías recargar la lista o actualizar el estado
      } else {
        alert('❌ Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando equipo:', error);
      alert('❌ Error de conexión');
    }
  };

  const handleVerHistorial = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    setVistaActual('historial');
  };

  const handleCambiarUbicacion = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    setVistaActual('cambiarUbicacion');
  };

  const handleMantenimiento = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    setVistaActual('mantenimientoEquipo');
  };

  // Renderizar barra de navegación/pestañas
  const renderNavegacion = () => {
    const tabs = [
      { id: 'lista', label: 'Lista de Equipos', icon: 'fa-list' },
      { id: 'alta', label: 'Nuevo Equipo', icon: 'fa-plus' },
      { id: 'busqueda', label: 'Búsqueda Avanzada', icon: 'fa-search' }
    ];

    return (
      <div className="bg-white border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => cambiarVista(tab.id as VistaActual)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                vistaActual === tab.id
                  ? 'border-orange-600 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`fas ${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  // Renderizar contenido basado en la vista actual
  const renderContenido = () => {
    switch (vistaActual) {
      case 'lista':
        return (
          <EquiposList
            onEquipoSelect={handleEquipoSelect}
            onVerDetalles={handleVerDetalles}
            onEditarEquipo={handleEditarEquipo}
            onEliminarEquipo={handleEliminarEquipo}
            onVerHistorial={handleVerHistorial}
            onCambiarUbicacion={handleCambiarUbicacion}
            onMantenimiento={handleMantenimiento}
          />
        );

      case 'busqueda':
        return (
          <EquiposBusqueda
            onResultados={(equipos) => console.log('Resultados:', equipos.length)}
          />
        );

      case 'alta':
        return (
          <EquiposAlta
            onSuccess={handleAltaExitosa}
            onCancel={handleCancelarOperacion}
          />
        );

      case 'historial':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Historial del Equipo: {equipoSeleccionado}
              </h3>
              <button
                onClick={() => setVistaActual('lista')}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver a Lista
              </button>
            </div>
            <div className="text-center py-8">
              <i className="fas fa-history text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600">Cargando historial completo del equipo...</p>
            </div>
          </div>
        );

      case 'cambiarUbicacion':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Cambiar Ubicación del Equipo: {equipoSeleccionado}
              </h3>
              <button
                onClick={() => setVistaActual('lista')}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver a Lista
              </button>
            </div>
            <div className="text-center py-8">
              <i className="fas fa-exchange-alt text-4xl text-rose-400 mb-4"></i>
              <p className="text-gray-600">Funcionalidad de cambio de ubicación en desarrollo...</p>
            </div>
          </div>
        );

      case 'mantenimientoEquipo':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Mantenimiento del Equipo: {equipoSeleccionado}
              </h3>
              <button
                onClick={() => setVistaActual('lista')}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver a Lista
              </button>
            </div>
            <div className="text-center py-8">
              <i className="fas fa-tools text-4xl text-orange-400 mb-4"></i>
              <p className="text-gray-600">Funcionalidad de mantenimiento específico en desarrollo...</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900">Vista no encontrada</h3>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Encabezado principal */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Equipos</h1>
        <p className="text-gray-600">Sistema integral de administración de inventarios</p>
      </div>

      {/* Navegación por pestañas */}
      {renderNavegacion()}

      {/* Contenido de la vista actual */}
      <div className="min-h-[500px]">
        {renderContenido()}
      </div>

      {/* Información del equipo seleccionado (si aplica) */}
      {equipoSeleccionado && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <i className="fas fa-info-circle"></i>
            <span className="text-sm">
              Equipo seleccionado: <strong>{equipoSeleccionado}</strong>
            </span>
            <button
              onClick={() => setEquipoSeleccionado(null)}
              className="text-white hover:text-gray-200 ml-2"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}