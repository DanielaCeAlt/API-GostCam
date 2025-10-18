'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import Tesseract from 'tesseract.js';

interface CameraScannerProps {
  onResult: (result: string, type: 'qr' | 'barcode' | 'ocr') => void;
  onClose: () => void;
  mode: 'qr' | 'ocr' | 'auto'; // auto detecta QR/barcode y OCR
  placeholder?: string;
}

export default function CameraScanner({ onResult, onClose, mode, placeholder = "Posiciona el código en el centro" }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [currentMode, setCurrentMode] = useState<'qr' | 'ocr'>(mode === 'auto' ? 'qr' : mode);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  const webcamRef = useRef<Webcam>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  // Configuración de la webcam
  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: { ideal: 'environment' } // Cámara trasera preferida
  };

  // Solicitar permisos de cámara
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasPermission(true);
        // Detener el stream inmediatamente, solo necesitábamos verificar permisos
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        setError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    };

    requestCameraPermission();
  }, []);

  // Inicializar scanner QR/Barcode
  useEffect(() => {
    if (currentMode === 'qr' && qrReaderRef.current && hasPermission) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 300, height: 200 },
          supportedScanTypes: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
          ],
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      scanner.render(
        (decodedText, decodedResult) => {
          console.log('Código escaneado:', decodedText);
          onResult(decodedText, decodedResult.result.format.formatName.includes('QR') ? 'qr' : 'barcode');
          scanner.clear();
        },
        (errorMessage) => {
          // Errores normales de escaneo, no mostrar al usuario
          // console.warn('Scanner error:', errorMessage);
        }
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [currentMode, hasPermission, onResult]);

  // Función para OCR
  const performOCR = useCallback(async () => {
    if (!webcamRef.current) return;

    setIsScanning(true);
    setProgress(0);
    setError(null);

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        throw new Error('No se pudo capturar la imagen');
      }

      const { data: { text } } = await Tesseract.recognize(
        imageSrc,
        'eng+spa', // Inglés y español
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-',
        }
      );

      const cleanText = text.replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, '');
      
      if (cleanText.length > 3) {
        onResult(cleanText, 'ocr');
      } else {
        setError('No se detectó texto válido. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setError('Error al procesar la imagen. Intenta de nuevo.');
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  }, [onResult]);

  // Cambiar modo de escaneo
  const switchMode = () => {
    setCurrentMode(prev => prev === 'qr' ? 'ocr' : 'qr');
    setError(null);
  };

  // Manejar errores de permisos
  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-camera-slash text-red-600 text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Acceso a Cámara Requerido
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Para escanear códigos necesitamos acceso a tu cámara. Por favor, permite el acceso y recarga la página.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Solicitando acceso a la cámara...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentMode === 'qr' ? 'Escanear Código' : 'Reconocer Texto'}
          </h3>
          <div className="flex items-center space-x-2">
            {mode === 'auto' && (
              <button
                onClick={switchMode}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {currentMode === 'qr' ? 'Modo Texto' : 'Modo QR'}
              </button>
            )}
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
          <div className="relative">
            {currentMode === 'qr' ? (
              // Scanner QR/Barcode
              <div>
                <div 
                  id="qr-reader" 
                  ref={qrReaderRef}
                  className="w-full"
                />
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                  {placeholder}
                </p>
              </div>
            ) : (
              // Scanner OCR
              <div className="space-y-4">
                <div className="relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="w-full rounded-lg"
                  />
                  
                  {/* Overlay de guía */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="border-2 border-blue-500 border-dashed rounded-lg w-80 h-20 flex items-center justify-center">
                      <span className="text-blue-500 text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                        Posiciona el texto aquí
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {isScanning && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Scan button */}
                <button
                  onClick={performOCR}
                  disabled={isScanning}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Procesando... {progress}%</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-camera"></i>
                      <span>Escanear Texto</span>
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Posiciona el número de serie o activo en el área marcada y presiona "Escanear Texto"
                </p>
              </div>
            )}
          </div>

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
              Consejos para mejor escaneo:
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• Asegúrate de tener buena iluminación</li>
              <li>• Mantén la cámara estable</li>
              <li>• El texto debe estar claro y bien enfocado</li>
              {currentMode === 'qr' && <li>• Para códigos QR/barras, centráloos en el área de escaneo</li>}
              {currentMode === 'ocr' && <li>• Para texto, posiciónalo horizontal y sin inclinación</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}