import { apiFetch } from '@/lib/api/client';
import { isAcceptedImageFile } from '@/lib/image-file';

declare global {
  interface ErrorConstructor {
    new (message?: string, options?: { cause?: unknown }): Error;
  }
}

// Actualizado a la ruta v1
const UPLOAD_ENDPOINT = '/api/v1/uploads/';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!isAcceptedImageFile(file)) {
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

interface UploadResponse {
  url: string;
}

export async function uploadImage(file: File): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Archivo no válido.');
  }

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiFetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen al servidor.');
    }

    const data = (await response.json()) as UploadResponse;

    if (!data?.url) {
      throw new Error('Respuesta inválida del servidor de subida.');
    }

    return data.url;
  } catch (error) {
    // Propagamos el error real en todos los entornos
    throw new Error(
      error instanceof Error ? error.message : 'Error al subir la imagen. Inténtalo de nuevo.',
      { cause: error },
    );
  }
}
