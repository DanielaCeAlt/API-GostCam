'use client';

import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

interface ImageCaptureProps {
  onImageCapture: (imageData: string, imageFile: File) => void;
  onClose: () => void;
  maxSizeMB?: number;
  quality?: number;
}

export default function ImageCapture({ 
  onImageCapture, 
  onClose, 
  maxSizeMB = 2,
  quality = 0.8 
}: ImageCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: { ideal: 'environment' }
  };

  // Solicitar permisos de cámara al montar
  React.useEffect(() => {
    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Camera permission error:', error);
        setHasPermission(false);
        setMode('upload'); // Cambiar a modo upload si no hay cámara
      }
    };

    if (mode === 'camera') {
      requestPermission();
    }
  }, [mode]);

  // Comprimir imagen
  const compressImage = useCallback(async (file: File, maxSizeMB: number, quality: number): Promise<{ dataUrl: string, file: File }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo el aspect ratio
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir a blob con calidad especificada
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al procesar la imagen'));
            return;
          }

          // Verificar tamaño
          const sizeMB = blob.size / (1024 * 1024);
          if (sizeMB > maxSizeMB) {
            // Si aún es muy grande, reducir calidad recursivamente
            const newQuality = Math.max(0.1, quality - 0.1);
            if (newQuality > 0.1) {
              compressImage(file, maxSizeMB, newQuality).then(resolve).catch(reject);
              return;
            }
          }

          const reader = new FileReader();
          reader.onload = () => {
            const compressedFile = new File([blob], file.name, {
              type: blob.type,
              lastModified: Date.now()
            });

            resolve({
              dataUrl: reader.result as string,
              file: compressedFile
            });
          };
          reader.onerror = () => reject(new Error('Error al leer la imagen'));
          reader.readAsDataURL(blob);
        }, 'image/jpeg', quality);
      };

      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Capturar foto con la cámara
  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('No se pudo capturar la imagen');
      }

      // Convertir data URL a File
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], `ubicacion_${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Comprimir imagen
      const { dataUrl, file: compressedFile } = await compressImage(file, maxSizeMB, quality);
      
      setCapturedImage(dataUrl);
    } catch (error) {
      console.error('Capture error:', error);
      setError('Error al capturar la imagen. Intenta de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  }, [compressImage, maxSizeMB, quality]);

  // Manejar selección de archivo
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (10MB max para archivo original)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { dataUrl, file: compressedFile } = await compressImage(file, maxSizeMB, quality);
      setCapturedImage(dataUrl);
    } catch (error) {
      console.error('File processing error:', error);
      setError('Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setIsProcessing(false);
    }
  }, [compressImage, maxSizeMB, quality]);

  // Confirmar imagen capturada
  const confirmImage = useCallback(async () => {
    if (!capturedImage) return;

    try {
      // Convertir data URL a File para el callback
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], `ubicacion_${Date.now()}.jpg`, { type: 'image/jpeg' });

      onImageCapture(capturedImage, file);
    } catch (error) {
      console.error('Confirm error:', error);
      setError('Error al procesar la imagen');
    }
  }, [capturedImage, onImageCapture]);

  // Reiniciar captura
  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
  };

  // Si no hay imagen capturada, mostrar interfaz de captura
  if (!capturedImage) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Capturar Imagen de Ubicación
            </h3>
            <div className="flex items-center space-x-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setMode('camera')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mode === 'camera'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                  disabled={hasPermission === false}
                >
                  <i className="fas fa-camera mr-2"></i>
                  Cámara
                </button>
                <button
                  onClick={() => setMode('upload')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    mode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <i className="fas fa-upload mr-2"></i>
                  Subir
                </button>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === 'camera' ? (
              hasPermission === false ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-camera-slash text-red-600 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Cámara no disponible
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    No se pudo acceder a la cámara. Usa la opción "Subir" para seleccionar una imagen.
                  </p>
                </div>
              ) : hasPermission === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-300">Accediendo a la cámara...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="w-full rounded-lg"
                    />
                    
                    {/* Overlay guide */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="border-2 border-green-500 border-dashed rounded-lg p-4">
                        <span className="text-green-500 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                          Muestra dónde estará ubicado el equipo
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={capturePhoto}
                    disabled={isProcessing}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-camera"></i>
                        <span>Tomar Foto</span>
                      </>
                    )}
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Seleccionar Imagen
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Haz clic aquí o arrastra una imagen que muestre la ubicación del equipo
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Formatos: JPG, PNG, WEBP • Máximo: 10MB
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-folder-open"></i>
                      <span>Seleccionar Archivo</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <i className="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                  <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                <i className="fas fa-lightbulb mr-2"></i>
                Consejos para una buena imagen:
              </h4>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <li>• Muestra claramente dónde estará ubicado el equipo</li>
                <li>• Incluye referencias visuales (paredes, muebles, etc.)</li>
                <li>• Asegúrate de que haya buena iluminación</li>
                <li>• La imagen se comprimirá automáticamente para optimizar el almacenamiento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar imagen capturada para confirmación
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Confirmar Imagen de Ubicación
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative">
              <img
                src={capturedImage}
                alt="Imagen de ubicación capturada"
                className="w-full max-h-96 object-contain rounded-lg bg-gray-100 dark:bg-gray-900"
              />
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={retakePhoto}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
              >
                <i className="fas fa-redo"></i>
                <span>Tomar Otra</span>
              </button>
              <button
                onClick={confirmImage}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <i className="fas fa-check"></i>
                <span>Usar Esta Imagen</span>
              </button>
            </div>

            {/* Info */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Esta imagen mostrará la ubicación donde se instalará el equipo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}