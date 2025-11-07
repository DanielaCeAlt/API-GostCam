'use client';

import React, { useState } from 'react';
import { useEquipos } from '@/hooks/useEquipos';
import { useCatalogos } from '@/hooks/useCatalogos';
import CameraScanner from '@/components/ui/CameraScanner';
import ImageCapture from '@/components/ui/ImageCapture';

interface EquiposAltaProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EquiposAlta({ onSuccess, onCancel }: EquiposAltaProps) {
  const { crearEquipo, loading } = useEquipos();
  const { tiposEquipo, sucursales, usuarios, estatusEquipo } = useCatalogos();
  
  const [formData, setFormData] = useState({
    no_serie: '',
    nombreEquipo: '',
    modelo: '',
    numeroActivo: '',
    idTipoEquipo: '',
    idEstatus: '1', // Disponible por defecto
    idSucursal: '',
    idPosicion: '1', // Por defecto
    idUsuarios: '',
    valorEstimado: '',
    observaciones: '',
    imagen_ubicacion: '' // Nueva imagen de ubicación
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [mensaje, setMensaje] = useState<{tipo: 'success' | 'error', texto: string} | null>(null);
  
  // Estados para los componentes de cámara
  const [showScanner, setShowScanner] = useState<'serie' | 'activo' | null>(null);
  const [showImageCapture, setShowImageCapture] = useState(false);
  const [ubicacionImage, setUbicacionImage] = useState<{dataUrl: string, file: File} | null>(null);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.no_serie.trim()) {
      newErrors.no_serie = 'El número de serie es obligatorio';
    }

    if (!formData.nombreEquipo.trim()) {
      newErrors.nombreEquipo = 'El nombre del equipo es obligatorio';
    }

    if (!formData.modelo.trim()) {
      newErrors.modelo = 'El modelo es obligatorio';
    }

    if (!formData.idTipoEquipo) {
      newErrors.idTipoEquipo = 'El tipo de equipo es obligatorio';
    }

    if (!formData.idSucursal) {
      newErrors.idSucursal = 'La sucursal es obligatoria';
    }

    if (!formData.idUsuarios) {
      newErrors.idUsuarios = 'El usuario asignado es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Generar número de activo si no se proporciona
    const numeroActivo = formData.numeroActivo || `ACT-${formData.no_serie}`;

    const equipoData = {
      ...formData,
      numeroActivo,
      idTipoEquipo: parseInt(formData.idTipoEquipo),
      idEstatus: parseInt(formData.idEstatus),
      idUsuarios: parseInt(formData.idUsuarios),
      idPosicion: parseInt(formData.idPosicion),
      imagen_ubicacion: ubicacionImage?.dataUrl || ''
    };

    const resultado = await crearEquipo(equipoData);

    if (resultado.success) {
      setMensaje({
        tipo: 'success',
        texto: resultado.message || 'Equipo creado exitosamente'
      });
      
      // Limpiar formulario
      setFormData({
        no_serie: '',
        nombreEquipo: '',
        modelo: '',
        numeroActivo: '',
        idTipoEquipo: '',
        idEstatus: '1',
        idSucursal: '',
        idPosicion: '1',
        idUsuarios: '',
        valorEstimado: '',
        observaciones: '',
        imagen_ubicacion: ''
      });
      setUbicacionImage(null);

      // Llamar callback de éxito después de un breve delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } else {
      setMensaje({
        tipo: 'error',
        texto: resultado.message || 'Error al crear el equipo'
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      no_serie: '',
      nombreEquipo: '',
      modelo: '',
      numeroActivo: '',
      idTipoEquipo: '',
      idEstatus: '1',
      idSucursal: '',
      idPosicion: '1',
      idUsuarios: '',
      valorEstimado: '',
      observaciones: '',
      imagen_ubicacion: ''
    });
    setErrors({});
    setMensaje(null);
    setUbicacionImage(null);
    onCancel?.();
  };

  // Manejar resultado del scanner
  const handleScanResult = (result: string, type: 'qr' | 'barcode' | 'ocr') => {
    if (showScanner === 'serie') {
      setFormData(prev => ({ ...prev, no_serie: result }));
      // Limpiar error si existe
      if (errors.no_serie) {
        setErrors(prev => ({ ...prev, no_serie: '' }));
      }
    } else if (showScanner === 'activo') {
      setFormData(prev => ({ ...prev, numeroActivo: result }));
    }
    setShowScanner(null);
  };

  // Manejar captura de imagen
  const handleImageCapture = (imageData: string, imageFile: File) => {
    setUbicacionImage({ dataUrl: imageData, file: imageFile });
    setShowImageCapture(false);
  };

  // Remover imagen de ubicación
  const removeUbicacionImage = () => {
    setUbicacionImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alta de Equipo</h1>
          <p className="text-gray-600">Registra un nuevo equipo en el inventario</p>
        </div>
      </div>

      {/* Mensaje de resultado */}
      {mensaje && (
        <div className={`rounded-md p-4 ${
          mensaje.tipo === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <i className={`fas ${mensaje.tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            </div>
            <div className="ml-3">
              <p className="text-sm">{mensaje.texto}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Número de serie */}
          <div>
            <label htmlFor="no_serie" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Serie *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="no_serie"
                name="no_serie"
                value={formData.no_serie}
                onChange={handleChange}
                className={`flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.no_serie ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ej: CAM-001-2024"
              />
              <button
                type="button"
                onClick={() => setShowScanner('serie')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1"
                title="Escanear número de serie"
              >
                <i className="fas fa-barcode"></i>
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>
            {errors.no_serie && <p className="mt-1 text-sm text-red-600">{errors.no_serie}</p>}
          </div>

          {/* Nombre del equipo */}
          <div>
            <label htmlFor="nombreEquipo" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Equipo *
            </label>
            <input
              type="text"
              id="nombreEquipo"
              name="nombreEquipo"
              value={formData.nombreEquipo}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nombreEquipo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: Cámara de Seguridad Exterior"
            />
            {errors.nombreEquipo && <p className="mt-1 text-sm text-red-600">{errors.nombreEquipo}</p>}
          </div>

          {/* Modelo */}
          <div>
            <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-2">
              Modelo *
            </label>
            <input
              type="text"
              id="modelo"
              name="modelo"
              value={formData.modelo}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.modelo ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ej: DH-IPC-HDBW2831TN-AS"
            />
            {errors.modelo && <p className="mt-1 text-sm text-red-600">{errors.modelo}</p>}
          </div>

          {/* Número de activo */}
          <div>
            <label htmlFor="numeroActivo" className="block text-sm font-medium text-gray-700 mb-2">
              Número de Activo
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="numeroActivo"
                name="numeroActivo"
                value={formData.numeroActivo}
                onChange={handleChange}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Se generará automáticamente si está vacío"
              />
              <button
                type="button"
                onClick={() => setShowScanner('activo')}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-1"
                title="Escanear número de activo"
              >
                <i className="fas fa-barcode"></i>
                <span className="hidden sm:inline">Escanear</span>
              </button>
            </div>
          </div>

          {/* Tipo de equipo */}
          <div>
            <label htmlFor="idTipoEquipo" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Equipo *
            </label>
            <select
              id="idTipoEquipo"
              name="idTipoEquipo"
              value={formData.idTipoEquipo}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.idTipoEquipo ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar tipo de equipo</option>
              {tiposEquipo.map((tipo) => (
                <option key={tipo.idTipoEquipo} value={tipo.idTipoEquipo}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {errors.idTipoEquipo && <p className="mt-1 text-sm text-red-600">{errors.idTipoEquipo}</p>}
          </div>

          {/* Estatus */}
          <div>
            <label htmlFor="idEstatus" className="block text-sm font-medium text-gray-700 mb-2">
              Estatus
            </label>
            <select
              id="idEstatus"
              name="idEstatus"
              value={formData.idEstatus}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {estatusEquipo.map((estatus) => (
                <option key={estatus.idEstatus} value={estatus.idEstatus}>
                  {estatus.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sucursal */}
          <div>
            <label htmlFor="idSucursal" className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal *
            </label>
            <select
              id="idSucursal"
              name="idSucursal"
              value={formData.idSucursal}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.idSucursal ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.idCentro} value={sucursal.idCentro}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
            {errors.idSucursal && <p className="mt-1 text-sm text-red-600">{errors.idSucursal}</p>}
          </div>

          {/* Usuario asignado */}
          <div>
            <label htmlFor="idUsuarios" className="block text-sm font-medium text-gray-700 mb-2">
              Usuario Asignado *
            </label>
            <select
              id="idUsuarios"
              name="idUsuarios"
              value={formData.idUsuarios}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.idUsuarios ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar usuario</option>
              {usuarios.map((usuario) => (
                <option key={usuario.idUsuarios} value={usuario.idUsuarios}>
                  {usuario.NombreUsuario}
                </option>
              ))}
            </select>
            {errors.idUsuarios && <p className="mt-1 text-sm text-red-600">{errors.idUsuarios}</p>}
          </div>

          {/* Valor estimado */}
          <div>
            <label htmlFor="valorEstimado" className="block text-sm font-medium text-gray-700 mb-2">
              Valor Estimado (MXN)
            </label>
            <input
              type="number"
              id="valorEstimado"
              name="valorEstimado"
              value={formData.valorEstimado}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Imagen de ubicación */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen de Ubicación
          </label>
          
          {ubicacionImage ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img 
                  src={ubicacionImage.dataUrl} 
                  alt="Ubicación del equipo" 
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                />
                <button
                  type="button"
                  onClick={removeUbicacionImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Quitar imagen"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowImageCapture(true)}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cambiar Imagen
                </button>
                <span className="text-sm text-gray-600 flex items-center">
                  <i className="fas fa-check-circle text-green-600 mr-2"></i>
                  Imagen cargada ({Math.round(ubicacionImage.file.size / 1024)}KB)
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowImageCapture(true)}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <i className="fas fa-camera text-4xl text-gray-400 mb-4"></i>
              <div className="text-lg font-medium text-gray-700 mb-2">
                Capturar Imagen de Ubicación
              </div>
              <p className="text-sm text-gray-500">
                Toma una foto o sube una imagen que muestre dónde estará ubicado el equipo
              </p>
            </button>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            <i className="fas fa-info-circle mr-1"></i>
            La imagen ayudará a identificar la ubicación física del equipo durante las inspecciones
          </p>
        </div>

        {/* Observaciones */}
        <div className="mt-6">
          <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observaciones adicionales sobre el equipo..."
          />
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-plus'} mr-2`}></i>
            {loading ? 'Creando...' : 'Crear Equipo'}
          </button>
        </div>
      </form>
      
      {/* Componente de escaner de cámara */}
      {showScanner && (
        <CameraScanner
          mode="auto"
          onResult={handleScanResult}
          onClose={() => setShowScanner(null)}
          placeholder={showScanner === 'serie' ? 'Escanea el número de serie del equipo' : 'Escanea el número de activo del equipo'}
        />
      )}
      
      {/* Componente de captura de imagen */}
      {showImageCapture && (
        <ImageCapture
          onImageCapture={handleImageCapture}
          onClose={() => setShowImageCapture(false)}
          maxSizeMB={2}
          quality={0.8}
        />
      )}
    </div>
  );
}
