'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Equipo {
  no_serie: string;
  nombreEquipo: string;
  modelo: string;
  numeroActivo?: string;
  fechaAlta: string;
  TipoEquipo: string;
  EstatusEquipo: string;
  UsuarioAsignado: string;
  SucursalActual: string;
  AreaActual: string;
  CorreoUsuario: string;
}

interface EquiposEditarProps {
  equipoData: Equipo;
  onSave?: (equipoActualizado: Equipo) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

interface SelectOption {
  id: number;
  nombre: string;
}

const EquiposEditar: React.FC<EquiposEditarProps> = ({
  equipoData,
  onSave,
  onCancel,
  isModal = false
}) => {
  const router = useRouter();
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreEquipo: equipoData.nombreEquipo || '',
    modelo: equipoData.modelo || '',
    numeroActivo: equipoData.numeroActivo || '',
    idTipoEquipo: '',
    idEstatus: '',
    idUsuarios: '',
    idPosicion: ''
  });

  // Estados para opciones de selects
  const [tiposEquipo, setTiposEquipo] = useState<SelectOption[]>([]);
  const [estatusEquipo, setEstatusEquipo] = useState<SelectOption[]>([]);
  const [usuarios, setUsuarios] = useState<SelectOption[]>([]);
  const [posiciones, setPosiciones] = useState<SelectOption[]>([]);

  // Estados de carga y errores
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/catalogos');
      const data = await response.json();
      
      if (data.success) {
        setTiposEquipo(data.data.tiposEquipo || []);
        setEstatusEquipo(data.data.estatusEquipo || []);
        setUsuarios(data.data.usuarios || []);
        setPosiciones(data.data.posiciones || []);
      } else {
        setError('Error cargando catálogos');
      }
    } catch (err) {
      console.error('Error cargando catálogos:', err);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes al editar
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.nombreEquipo.trim()) {
      setError('El nombre del equipo es requerido');
      return;
    }
    if (!formData.modelo.trim()) {
      setError('El modelo es requerido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Filtrar solo los campos que tienen valores válidos
      const dataToSend = {
        nombreEquipo: formData.nombreEquipo,
        modelo: formData.modelo,
        numeroActivo: formData.numeroActivo,
        // Solo incluir campos de ID si tienen valores válidos (no vacíos)
        ...(formData.idTipoEquipo && formData.idTipoEquipo !== '' && { idTipoEquipo: formData.idTipoEquipo }),
        ...(formData.idEstatus && formData.idEstatus !== '' && { idEstatus: formData.idEstatus }),
        ...(formData.idUsuarios && formData.idUsuarios !== '' && { idUsuarios: formData.idUsuarios }),
        ...(formData.idPosicion && formData.idPosicion !== '' && { idPosicion: formData.idPosicion })
      };

      const response = await fetch(`/api/equipos/${equipoData.no_serie}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Equipo actualizado exitosamente');
        
        // Ejecutar callback si existe
        if (onSave && result.data) {
          onSave(result.data);
        }

        // Si no es modal, navegar de vuelta
        if (!isModal) {
          setTimeout(() => {
            router.push('/equipos');
          }, 1500);
        }
      } else {
        setError(result.error || 'Error actualizando el equipo');
      }
    } catch (err) {
      console.error('Error actualizando equipo:', err);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (!isModal) {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando catálogos...</span>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'p-6' : 'max-w-4xl mx-auto p-6'}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Editar Equipo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No. Serie: <span className="font-semibold">{equipoData.no_serie}</span>
        </p>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <i className="fas fa-exclamation-circle text-red-500 mr-2 mt-0.5"></i>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex">
            <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5"></i>
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Equipo *
              </label>
              <input
                type="text"
                name="nombreEquipo"
                value={formData.nombreEquipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Laptop HP ProBook"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: HP-840-G8"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de Activo
              </label>
              <input
                type="text"
                name="numeroActivo"
                value={formData.numeroActivo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: ACT-2024-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Alta
              </label>
              <input
                type="text"
                value={new Date(equipoData.fechaAlta).toLocaleDateString()}
                disabled
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Clasificación */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Clasificación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Equipo
              </label>
              <select
                name="idTipoEquipo"
                value={formData.idTipoEquipo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar tipo...</option>
                {tiposEquipo.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estatus
              </label>
              <select
                name="idEstatus"
                value={formData.idEstatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar estatus...</option>
                {estatusEquipo.map(estatus => (
                  <option key={estatus.id} value={estatus.id}>
                    {estatus.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Asignación */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Asignación
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario Asignado
              </label>
              <select
                name="idUsuarios"
                value={formData.idUsuarios}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar usuario...</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Posición/Área
              </label>
              <select
                name="idPosicion"
                value={formData.idPosicion}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar posición...</option>
                {posiciones.map(posicion => (
                  <option key={posicion.id} value={posicion.id}>
                    {posicion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700
                     hover:bg-gray-50 dark:hover:bg-gray-600 
                     focus:ring-2 focus:ring-gray-500 focus:border-gray-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquiposEditar;