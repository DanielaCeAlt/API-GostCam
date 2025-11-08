'use client';

import React, { useState } from 'react';
import EquiposList from './EquiposList';
import EquiposBusqueda from './EquiposBusqueda';
import EquiposAlta from './EquiposAlta';
import EquiposDashboard from './EquiposDashboard';
import EquiposEditar from './EquiposEditar';
import EquiposCambioUbicacion from './EquiposCambioUbicacion';
import EquiposMantenimiento from './EquiposMantenimiento';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { apiService } from '@/lib/apiService';

// Tipos de vista disponibles
type VistaActual = 'lista' | 'busqueda' | 'alta' | 'historial' | 'cambiarUbicacion' | 'mantenimientoEquipo' | 'dashboard' | 'editar';

interface EquiposManagerProps {
  vistaInicial?: VistaActual;
}

export default function EquiposManager({ vistaInicial = 'lista' }: EquiposManagerProps) {
  const [vistaActual, setVistaActual] = useState<VistaActual>(vistaInicial);
  // Estado para equipos seleccionados y operaciones
  const [equipoSeleccionado, setEquipoSeleccionado] = useState<string>('');
  const [equipoParaEditar, setEquipoParaEditar] = useState<any>(null);
  const [equipoParaCambioUbicacion, setEquipoParaCambioUbicacion] = useState<any>(null);
  const [cargandoEquipo, setCargandoEquipo] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  
  // Estados para modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [equipoAEliminar, setEquipoAEliminar] = useState<{no_serie: string, nombreEquipo: string} | null>(null);
  const [eliminandoEquipo, setEliminandoEquipo] = useState(false);
  const [refreshList, setRefreshList] = useState(0);

  // Navegación entre vistas
  const cambiarVista = (nuevaVista: VistaActual) => {
    setVistaActual(nuevaVista);
    setEquipoSeleccionado('');
  };

  // Callbacks para interacción entre componentes
  const handleEquipoSelect = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
  };

  const handleResultadosBusqueda = (equipos: any[]) => {
    setResultadosBusqueda([...equipos]);
  };

  const handleVerDetalles = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    setVistaActual('dashboard');
  };

  // Función para cargar datos del equipo para edición
  const cargarEquipoParaEditar = async (noSerie: string) => {
    setCargandoEquipo(true);
    try {
      const response = await fetch(`/api/equipos/${noSerie}`);
      const data = await response.json();
      
      if (data.success) {
        setEquipoParaEditar(data.data.equipo);
        setEquipoSeleccionado(noSerie);
        setVistaActual('editar');
      } else {
        console.error('Error cargando equipo:', data.error);
        alert('Error cargando los datos del equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setCargandoEquipo(false);
    }
  };

  const handleEditarEquipo = (noSerie: string) => {
    cargarEquipoParaEditar(noSerie);
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
  
  const handleEliminarEquipo = async (noSerie: string, nombreEquipo?: string) => {
    // Mostrar modal de confirmación
    setEquipoAEliminar({ 
      no_serie: noSerie, 
      nombreEquipo: nombreEquipo || 'Equipo sin nombre' 
    });
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!equipoAEliminar) return;
    
    setEliminandoEquipo(true);
    try {
      const response = await apiService.delete(`/api/equipos/${equipoAEliminar.no_serie}`);
      if (response.success) {
        // Cerrar modal
        setShowDeleteModal(false);
        setEquipoAEliminar(null);
        
        // Forzar recarga de la lista
        setRefreshList(prev => prev + 1);
        
        // Mostrar notificación en consola
        console.log('✅ Equipo eliminado exitosamente:', response.message);
      } else {
        console.error('❌ Error eliminando equipo:', response.error);
        alert('❌ Error: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando equipo:', error);
      alert('❌ Error de conexión al eliminar el equipo');
    } finally {
      setEliminandoEquipo(false);
    }
  };

  const cancelarEliminacion = () => {
    setShowDeleteModal(false);
    setEquipoAEliminar(null);
  };

  const handleVerHistorial = (noSerie: string) => {
    setEquipoSeleccionado(noSerie);
    setVistaActual('historial');
  };

  const handleCambiarUbicacion = (noSerie: string) => {
    cargarEquipoParaCambioUbicacion(noSerie);
  };

  // Función para cargar datos del equipo para cambio de ubicación
  const cargarEquipoParaCambioUbicacion = async (noSerie: string) => {
    setCargandoEquipo(true);
    try {
      const response = await fetch(`/api/equipos/${noSerie}`);
      const data = await response.json();
      
      if (data.success) {
        setEquipoParaCambioUbicacion(data.data.equipo);
        setEquipoSeleccionado(noSerie);
        setVistaActual('cambiarUbicacion');
      } else {
        console.error('Error cargando equipo:', data.error);
        alert('Error cargando los datos del equipo');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setCargandoEquipo(false);
    }
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
          <div>
            <EquiposBusqueda
              onResultados={handleResultadosBusqueda}
            />
            
            {resultadosBusqueda.length > 0 && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Resultados de Búsqueda
                  </h3>
                  
                  <div className="space-y-4">
                    {resultadosBusqueda.map((equipo, index) => (
                      <div key={equipo.no_serie || index} className="border border-gray-200 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <strong>No. Serie:</strong> {equipo.no_serie}
                          </div>
                          <div>
                            <strong>Nombre:</strong> {equipo.nombreEquipo}
                          </div>
                          <div>
                            <strong>Tipo:</strong> {equipo.TipoEquipo}
                          </div>
                          <div>
                            <strong>Estatus:</strong> {equipo.EstatusEquipo}
                          </div>
                          <div>
                            <strong>Sucursal:</strong> {equipo.SucursalActual}
                          </div>
                          <div>
                            <strong>Usuario:</strong> {equipo.UsuarioAsignado}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {resultadosBusqueda.length === 0 && (
              <div className="mt-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      No se encontraron equipos con los filtros seleccionados
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Prueba modificando los filtros de búsqueda
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
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
        if (cargandoEquipo) {
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Cargando datos del equipo...</span>
              </div>
            </div>
          );
        }

        if (!equipoParaCambioUbicacion) {
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <i className="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                <p className="text-gray-600">No se pudieron cargar los datos del equipo</p>
                <button
                  onClick={() => setVistaActual('lista')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Volver a Lista
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white rounded-lg shadow">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Cambiar Ubicación - {equipoParaCambioUbicacion.nombreEquipo}
              </h3>
              <button
                onClick={() => setVistaActual('lista')}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver a Lista
              </button>
            </div>
            <EquiposCambioUbicacion
              equipoData={equipoParaCambioUbicacion}
              onSave={(transferencia) => {
                console.log('Transferencia completada:', transferencia);
                setVistaActual('lista');
                setRefreshList(prev => prev + 1);
                // Limpiar datos del equipo
                setEquipoParaCambioUbicacion(null);
                setEquipoSeleccionado('');
              }}
              onCancel={() => {
                setVistaActual('lista');
                setEquipoParaCambioUbicacion(null);
                setEquipoSeleccionado('');
              }}
              isModal={false}
            />
          </div>
        );

      case 'mantenimientoEquipo':
        return (
          <EquiposMantenimiento />
        );

      case 'dashboard':
        return (
          <EquiposDashboard
            noSerie={equipoSeleccionado}
            onVolver={() => setVistaActual('lista')}
          />
        );

      case 'editar':
        if (cargandoEquipo) {
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span>Cargando datos del equipo...</span>
              </div>
            </div>
          );
        }

        if (!equipoParaEditar) {
          return (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <p className="text-gray-600">No se pudieron cargar los datos del equipo</p>
                <button
                  onClick={() => setVistaActual('lista')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Volver a Lista
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="bg-white rounded-lg shadow">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Editar Equipo: {equipoSeleccionado}
              </h3>
              <button
                onClick={() => {
                  setVistaActual('lista');
                  setEquipoParaEditar(null);
                }}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <i className="fas fa-arrow-left mr-2"></i>Volver a Lista
              </button>
            </div>
            <EquiposEditar
              equipoData={equipoParaEditar}
              onSave={(equipoActualizado) => {
                console.log('Equipo actualizado:', equipoActualizado);
                setVistaActual('lista');
                setEquipoParaEditar(null);
              }}
              onCancel={() => {
                setVistaActual('lista');
                setEquipoParaEditar(null);
              }}
              isModal={false}
            />
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
              onClick={() => setEquipoSeleccionado('')}
              className="text-white hover:text-gray-200 ml-2"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={cancelarEliminacion}
        onConfirm={confirmarEliminacion}
        equipoInfo={equipoAEliminar || { no_serie: '', nombreEquipo: '' }}
        isDeleting={eliminandoEquipo}
      />
    </div>
  );
}