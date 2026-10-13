import { apiFetch } from './client';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (regla acordada del equipo)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valida formato y tamaño del archivo en el cliente antes de transmitir.
 */
export function validateImageFile(file: File): UploadValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no soportado. Usa imágenes JPG, PNG o WebP.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'El archivo excede el tamaño máximo permitido de 5 MB.',
    };
  }

  return { valid: true };
}

/**
 * Sube una imagen utilizando la configuración de variables de entorno.
 * Si no hay endpoint configurado, genera una URL segura para modo demo/desarrollo.
 */
export async function uploadImage(file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const uploadEndpoint = import.meta.env.VITE_STORAGE_UPLOAD_URL;

  // Si existe endpoint configurado en las variables de entorno, enviamos el archivo
  if (uploadEndpoint) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiFetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen al servidor de almacenamiento');
    }

    const data = await response.json();
    return data.url || data.image_url;
  }

  // Fallback controlado para desarrollo local y demo:
  // Retorna una URL representativa válida para que el flujo del Feed no se detenga.
  console.info('[Storage] VITE_STORAGE_UPLOAD_URL no configurado. Usando URL mock de desarrollo.');

  // Simulamos una ligera latencia de red para reflejar la experiencia real
  await new Promise(resolve => setTimeout(resolve, 600));

  // Generamos una URL pública válida compatible con las restricciones de URLField
  return `https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80`;
}
