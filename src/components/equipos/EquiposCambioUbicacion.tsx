'use client';

import React, { useState, useEffect } from 'react';

interface Equipo {
  no_serie: string;
  nombreEquipo: string;
  modelo?: string;
  SucursalActual?: string;
  AreaActual?: string;
  UsuarioAsignado?: string;
  EstatusEquipo?: string;
}

interface Sucursal {
  id: string;
  nombre: string;
  codigo: string;
  zona?: string;
  estado?: string;
}

interface Posicion {
  id: number;
  nombre: string;
  sucursalId: string;
  descripcion?: string;
}

interface EquiposCambioUbicacionProps {
  equipoData?: Equipo;
  onSave?: (transferencia: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const EquiposCambioUbicacion: React.FC<EquiposCambioUbicacionProps> = ({
  equipoData,
  onSave,
  onCancel,
  isModal = false
}) => {
  // Estados del formulario
  const [formData, setFormData] = useState({
    equipos: equipoData ? [equipoData.no_serie] : [],
    sucursalDestino: '',
    posicionDestino: '',
    tipoMovimiento: 'TRASLADO',
    motivo: '',
    observaciones: '',
    urgencia: 'NORMAL',
    responsableTraslado: 'Sistema',
    fechaProgramada: ''
  });

  // Estados para catálogos
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [posiciones, setPosiciones] = useState<Posicion[]>([]);
  const [equiposBusqueda, setEquiposBusqueda] = useState<Equipo[]>([]);
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Equipo[]>([]);

  // Estados de control
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEquipoSearch, setShowEquipoSearch] = useState(!equipoData);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    if (equipoData) {
      setEquiposSeleccionados([equipoData]);
    }
  }, [equipoData]);

  const cargarDatosIniciales = async () => {
    setLoading(true);
    try {
      // Cargar sucursales y posiciones
      await Promise.all([
        cargarSucursales(),
        cargarPosiciones()
      ]);
    } catch (err) {
      console.error('Error cargando datos iniciales:', err);
      setError('Error cargando datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const cargarSucursales = async () => {
    try {
      console.log('🔍 Cargando sucursales...');
      // Intentar endpoint principal primero
      let response = await fetch('/api/sucursales');
      let data = await response.json();
      
      console.log('📡 Respuesta del API sucursales:', data);
      
      if (!data.success || !data.data || data.data.length === 0) {
        console.log('⚠️ Sucursales principales fallaron, intentando endpoint de prueba...');
        // Si falla, usar endpoint de prueba
        response = await fetch('/api/catalogos-prueba');
        data = await response.json();
        if (data.success && data.data.sucursales) {
          console.log('✅ Sucursales de catalogos-prueba cargadas:', data.data.sucursales);
          setSucursales(data.data.sucursales);
        }
      } else {
        console.log('✅ Sucursales principales cargadas:', data.data);
        setSucursales(data.data);
      }
    } catch (err) {
      console.error('❌ Error cargando sucursales:', err);
      // Fallback con datos estáticos
      const fallbackSucursales = [
        { id: 'SUC001', nombre: 'Sucursal Principal' },
        { id: 'SUC002', nombre: 'Sucursal Norte' },
        { id: 'SUC003', nombre: 'Sucursal Sur' }
      ];
      console.log('🔄 Usando sucursales de fallback:', fallbackSucursales);
      setSucursales(fallbackSucursales);
    }
  };

  const cargarPosiciones = async () => {
    try {
      // Intentar endpoint principal primero
      let response = await fetch('/api/posiciones');
      let data = await response.json();
      
      if (!data.success || !data.data || data.data.length === 0) {
        // Si falla, usar endpoint de prueba
        response = await fetch('/api/catalogos-prueba');
        data = await response.json();
        if (data.success && data.data.posiciones) {
          setPosiciones(data.data.posiciones);
        }
      } else {
        setPosiciones(data.data);
      }
    } catch (err) {
      console.error('Error cargando posiciones:', err);
      // Fallback con datos estáticos
      setPosiciones([
        { id: 1, nombre: 'Recepción', sucursalId: 'SUC001' },
        { id: 2, nombre: 'Oficina', sucursalId: 'SUC001' },
        { id: 3, nombre: 'Almacén', sucursalId: 'SUC001' }
      ]);
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
    } catch (err) {
      console.error('Error buscando equipos:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    buscarEquipos(value);
  };

  const agregarEquipo = (equipo: Equipo) => {
    if (!equiposSeleccionados.find(e => e.no_serie === equipo.no_serie)) {
      setEquiposSeleccionados(prev => [...prev, equipo]);
      setFormData(prev => ({
        ...prev,
        equipos: [...prev.equipos, equipo.no_serie]
      }));
    }
    setSearchTerm('');
    setEquiposBusqueda([]);
  };

  const removerEquipo = (no_serie: string) => {
    setEquiposSeleccionados(prev => prev.filter(e => e.no_serie !== no_serie));
    setFormData(prev => ({
      ...prev,
      equipos: prev.equipos.filter(e => e !== no_serie)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.equipos.length === 0) {
      setError('Debe seleccionar al menos un equipo');
      return;
    }
    if (!formData.sucursalDestino) {
      setError('Debe seleccionar una sucursal destino');
      return;
    }
    if (!formData.posicionDestino) {
      setError('Debe seleccionar una posición destino');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const transferData = {
        equipos: formData.equipos,
        sucursalOrigen: equiposSeleccionados[0]?.SucursalActual || 'Centro Principal',
        sucursalDestino: formData.sucursalDestino,
        posicionDestino: formData.posicionDestino,
        tipoMovimiento: formData.tipoMovimiento,
        motivo: formData.motivo,
        observaciones: formData.observaciones,
        responsableTraslado: formData.responsableTraslado,
        fechaProgramada: formData.fechaProgramada || null
      };

      const response = await fetch('/api/equipos/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transferData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(`Transferencia iniciada exitosamente. ID: ${result.data.transferId || 'N/A'}`);
        
        if (onSave) {
          onSave(result.data);
        }

        // Reset form if not modal
        if (!isModal) {
          setFormData({
            equipos: [],
            sucursalDestino: '',
            posicionDestino: '',
            tipoMovimiento: 'TRASLADO',
            motivo: '',
            observaciones: '',
            urgencia: 'NORMAL',
            responsableTraslado: 'Sistema',
            fechaProgramada: ''
          });
          setEquiposSeleccionados([]);
        }
      } else {
        setError(result.error || 'Error procesando la transferencia');
      }
    } catch (err) {
      console.error('Error enviando transferencia:', err);
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const posicionesFiltradas = posiciones.filter(p => 
    !formData.sucursalDestino || p.sucursalId === formData.sucursalDestino
  );

  // Log de depuración para ver el estado actual
  console.log('🏢 Estado de sucursales en render:', sucursales);
  console.log('📍 Estado de posiciones en render:', posiciones);
  console.log('🔍 Posiciones filtradas:', posicionesFiltradas);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className={`${isModal ? 'p-6' : 'max-w-4xl mx-auto p-6'}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          <i className="fas fa-exchange-alt text-blue-600 mr-2"></i>
          Cambio de Ubicación
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Transfiere equipos entre sucursales y ubicaciones
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Selección de Equipos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-laptop text-blue-500 mr-2"></i>
            Equipos a Transferir
          </h3>
          
          {/* Equipos seleccionados */}
          {equiposSeleccionados.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Equipos Seleccionados ({equiposSeleccionados.length})
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {equiposSeleccionados.map((equipo) => (
                  <div key={equipo.no_serie} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <span className="font-medium">{equipo.nombreEquipo}</span>
                      <span className="text-sm text-gray-500 ml-2">#{equipo.no_serie}</span>
                      {equipo.SucursalActual && (
                        <span className="text-xs text-blue-600 ml-2">📍 {equipo.SucursalActual}</span>
                      )}
                    </div>
                    {!equipoData && (
                      <button
                        type="button"
                        onClick={() => removerEquipo(equipo.no_serie)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Búsqueda de equipos */}
          {showEquipoSearch && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Equipos
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por número de serie, nombre o modelo..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Resultados de búsqueda */}
              {equiposBusqueda.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {equiposBusqueda.map((equipo) => (
                    <button
                      key={equipo.no_serie}
                      type="button"
                      onClick={() => agregarEquipo(equipo)}
                      className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                    >
                      <div className="font-medium">{equipo.nombreEquipo}</div>
                      <div className="text-sm text-gray-500">#{equipo.no_serie} • {equipo.modelo}</div>
                      {equipo.SucursalActual && (
                        <div className="text-xs text-blue-600">📍 {equipo.SucursalActual}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ubicación Destino */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-map-marker-alt text-green-500 mr-2"></i>
            Ubicación Destino
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sucursal Destino *
              </label>
              <select
                name="sucursalDestino"
                value={formData.sucursalDestino}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar sucursal...</option>
                {sucursales.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre} {sucursal.equiposAsignados ? `(${sucursal.equiposAsignados} equipos)` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Posición/Área Destino *
              </label>
              <select
                name="posicionDestino"
                value={formData.posicionDestino}
                onChange={handleInputChange}
                required
                disabled={!formData.sucursalDestino}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar posición...</option>
                {posicionesFiltradas.map((posicion, index) => (
                  <option key={`posicion-${posicion.id || index}`} value={posicion.id}>
                    {posicion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Detalles de la Transferencia */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <i className="fas fa-clipboard-list text-orange-500 mr-2"></i>
            Detalles de la Transferencia
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Movimiento
              </label>
              <select
                name="tipoMovimiento"
                value={formData.tipoMovimiento}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="TRASLADO">Traslado</option>
                <option value="REASIGNACION">Reasignación</option>
                <option value="MANTENIMIENTO">Mantenimiento</option>
                <option value="REUBICACION">Reubicación</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Urgencia
              </label>
              <select
                name="urgencia"
                value={formData.urgencia}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="BAJA">Baja</option>
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Responsable del Traslado
              </label>
              <input
                type="text"
                name="responsableTraslado"
                value={formData.responsableTraslado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del responsable"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha Programada (Opcional)
              </label>
              <input
                type="datetime-local"
                name="fechaProgramada"
                value={formData.fechaProgramada}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo
            </label>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Motivo de la transferencia"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-4 pt-6">
          {onCancel && (
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
          )}
          
          <button
            type="submit"
            disabled={saving || equiposSeleccionados.length === 0}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                Iniciar Transferencia
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EquiposCambioUbicacion;
