/**
 * Utilidades para manejo de imágenes
 * Incluye funciones para compresión, validación y conversión de imágenes
 */

// Tipos permitidos de imagen
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_SIZE_MB = 10;
export const DEFAULT_COMPRESSION_QUALITY = 0.8;
export const DEFAULT_MAX_WIDTH = 1920;
export const DEFAULT_MAX_HEIGHT = 1080;

// Interfaz para configuración de compresión
export interface CompressionOptions {
  maxSizeMB?: number;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

// Interfaz para resultado de compresión
export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Valida si un archivo es una imagen válida
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  // Verificar tipo de archivo
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Formato no soportado. Use: ${ALLOWED_IMAGE_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
    };
  }

  // Verificar tamaño
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
    return {
      isValid: false,
      error: `La imagen es demasiado grande. Máximo ${MAX_IMAGE_SIZE_MB}MB, actual: ${fileSizeMB.toFixed(2)}MB`
    };
  }

  return { isValid: true };
}

/**
 * Comprime una imagen manteniendo la calidad visual
 */
export function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const {
      maxSizeMB = 2,
      quality = DEFAULT_COMPRESSION_QUALITY,
      maxWidth = DEFAULT_MAX_WIDTH,
      maxHeight = DEFAULT_MAX_HEIGHT,
      outputFormat = 'image/jpeg'
    } = options;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('No se pudo crear contexto de canvas'));
      return;
    }

    const originalSize = file.size;

    img.onload = () => {
      // Calcular nuevas dimensiones manteniendo aspect ratio
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
      ctx.drawImage(img, 0, 0, width, height);

      // Función recursiva para ajustar calidad hasta alcanzar el tamaño objetivo
      const tryCompress = (currentQuality: number): void => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Error al procesar la imagen'));
            return;
          }

          const sizeMB = blob.size / (1024 * 1024);
          
          // Si el tamaño es aceptable o la calidad ya es muy baja, usar este resultado
          if (sizeMB <= maxSizeMB || currentQuality <= 0.1) {
            const reader = new FileReader();
            reader.onload = () => {
              const compressedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              });

              const result: CompressionResult = {
                file: compressedFile,
                dataUrl: reader.result as string,
                originalSize,
                compressedSize: blob.size,
                compressionRatio: ((originalSize - blob.size) / originalSize) * 100
              };

              resolve(result);
            };
            reader.onerror = () => reject(new Error('Error al leer la imagen comprimida'));
            reader.readAsDataURL(blob);
          } else {
            // Reducir calidad y volver a intentar
            tryCompress(Math.max(0.1, currentQuality - 0.1));
          }
        }, outputFormat, currentQuality);
      };

      tryCompress(quality);
    };

    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convierte un Data URL a File
 */
export async function dataUrlToFile(dataUrl: string, filename: string = 'image.jpg'): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
}

/**
 * Convierte un File a Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Redimensiona una imagen para vista previa (thumbnail)
 */
export function createThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('No se pudo crear contexto de canvas'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;
      
      // Calcular dimensiones del thumbnail
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
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => reject(new Error('Error al cargar la imagen para thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Valida las dimensiones de una imagen
 */
export function validateImageDimensions(
  file: File,
  minWidth?: number,
  minHeight?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<{ isValid: boolean; error?: string; dimensions?: { width: number; height: number } }> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      
      if (minWidth && width < minWidth) {
        resolve({
          isValid: false,
          error: `La imagen debe tener al menos ${minWidth}px de ancho. Actual: ${width}px`,
          dimensions: { width, height }
        });
        return;
      }
      
      if (minHeight && height < minHeight) {
        resolve({
          isValid: false,
          error: `La imagen debe tener al menos ${minHeight}px de alto. Actual: ${height}px`,
          dimensions: { width, height }
        });
        return;
      }
      
      if (maxWidth && width > maxWidth) {
        resolve({
          isValid: false,
          error: `La imagen debe tener máximo ${maxWidth}px de ancho. Actual: ${width}px`,
          dimensions: { width, height }
        });
        return;
      }
      
      if (maxHeight && height > maxHeight) {
        resolve({
          isValid: false,
          error: `La imagen debe tener máximo ${maxHeight}px de alto. Actual: ${height}px`,
          dimensions: { width, height }
        });
        return;
      }

      resolve({
        isValid: true,
        dimensions: { width, height }
      });
    };

    img.onerror = () => resolve({
      isValid: false,
      error: 'No se pudo determinar las dimensiones de la imagen'
    });

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Formatea el tamaño de archivo para mostrar al usuario
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calcula el porcentaje de compresión
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Verifica si el navegador soporta las funciones de imagen necesarias
 */
export function checkImageSupport(): {
  canvas: boolean;
  fileReader: boolean;
  webp: boolean;
} {
  const canvas = !!document.createElement('canvas').getContext;
  const fileReader = typeof FileReader !== 'undefined';
  
  // Verificar soporte para WebP
  const webpCanvas = document.createElement('canvas');
  const webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  return { canvas, fileReader, webp };
}