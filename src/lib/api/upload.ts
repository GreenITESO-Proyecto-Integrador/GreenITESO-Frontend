import { apiFetch } from '@/lib/api/client';

declare global {
  interface ErrorConstructor {
    new (message?: string, options?: { cause?: unknown }): Error;
  }
}

const UPLOAD_ENDPOINT = '/api/uploads/';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File): ImageValidationResult {
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
    // El fallback de prueba únicamente se permite en entorno de desarrollo local
    if (import.meta.env.DEV) {
      console.warn(
        '[DEV] Endpoint de subida no disponible o falló. Usando imagen mock de desarrollo.',
        error,
      );
      return 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80';
    }

    // En producción se propaga el error real para no falsificar la evidencia
    throw new Error(
      error instanceof Error ? error.message : 'Error al subir la imagen. Inténtalo de nuevo.',
      { cause: error },
    );
  }
}
