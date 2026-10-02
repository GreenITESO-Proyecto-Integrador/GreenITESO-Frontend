/**
 * Error from an API response. `message` and `fieldErrors` are already user-facing Spanish.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const NETWORK_MESSAGE =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Friendly message for an HTTP status, or the fallback when the status says nothing useful.
 */
function statusMessage(status: number, fallback: string): string {
  if (status === 400) return 'Revisa los datos e inténtalo de nuevo.';
  if (status === 401) return 'Tu sesión expiró. Inicia sesión de nuevo.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró lo que buscas.';
  if (status === 429) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo más tarde.';
  return fallback;
}

/** Known backend messages (English) and their Spanish text. First match wins. */
const MESSAGE_RULES: readonly {
  pattern: RegExp;
  message: string | ((match: RegExpMatchArray) => string);
}[] = [
  {
    pattern: /only administrators can create global campaigns/i,
    message: 'Solo los administradores pueden crear campañas globales.',
  },
  {
    pattern: /only the clan leader can create campaigns/i,
    message:
      'Solo el líder de este clan puede crear campañas. Crea un clan para ser su líder y poder crearla.',
  },
  {
    pattern: /only .*(private|institutional)|clan type/i,
    message: 'Solo se pueden crear campañas para clanes privados o institucionales.',
  },
  {
    pattern: /only administrators/i,
    message: 'Esta acción es solo para administradores.',
  },
  {
    pattern: /global.*target_clan|target_clan.*global|global campaign.*clan/i,
    message: 'Una campaña global no puede tener clan.',
  },
  {
    pattern: /private.*target_clan|target_clan.*(required|private)/i,
    message: 'Elige un clan para la campaña de clan.',
  },
  {
    pattern: /clan.*(does not exist|not found|deleted)|invalid pk.*clan/i,
    message: 'El clan seleccionado no existe.',
  },
  {
    pattern: /end_date.*future|end date.*future|must be in the future/i,
    message: 'La fecha de fin debe estar en el futuro.',
  },
  {
    pattern: /start_date.*(before|earlier|less)|before.*end_date|end_date.*(after|later|greater)/i,
    message: 'La fecha de inicio debe ser anterior a la fecha de fin.',
  },
  {
    pattern: /date.*wrong format|valid date|valid datetime/i,
    message: 'Escribe una fecha válida.',
  },
  {
    pattern: /already.*(participant|joined|enrolled)|already in (this )?campaign/i,
    message: 'Ya estás inscrito en esta campaña.',
  },
  {
    pattern: /promotion/i,
    message: 'Solo puedes hacer esto mientras la campaña está en promoción.',
  },
  {
    pattern: /already exists|only once|duplicate|unique/i,
    message: 'No repitas la misma acción en una campaña.',
  },
  {
    pattern: /action.*(not found|does not exist|inactive)|invalid pk.*action/i,
    message: 'La acción seleccionada no está disponible.',
  },
  {
    pattern: /greater than or equal to (\d+)/i,
    message: match => `Debe ser mayor o igual a ${match[1]}.`,
  },
  { pattern: /may not be (blank|null)/i, message: 'Este campo no puede estar vacío.' },
  { pattern: /required/i, message: 'Este campo es obligatorio.' },
  {
    pattern: /authentication credentials|token.*(invalid|expired)/i,
    message: 'Tu sesión expiró. Inicia sesión de nuevo.',
  },
  {
    pattern: /do not have permission|permission denied/i,
    message: 'No tienes permiso para realizar esta acción.',
  },
  { pattern: /not found/i, message: 'No se encontró lo que buscas.' },
];

/**
 * Translate one backend message. Unknown text falls back to a status-based message,
 * so raw English never reaches the user.
 */
export function translateMessage(message: string, status: number, fallback: string): string {
  for (const rule of MESSAGE_RULES) {
    const match = message.match(rule.pattern);
    if (match) return typeof rule.message === 'function' ? rule.message(match) : rule.message;
  }
  return statusMessage(status, fallback);
}

/**
 * Collect every string message nested in a DRF error value.
 */
function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (isRecord(value)) return Object.values(value).flatMap(collectMessages);
  return [];
}

/**
 * Read a DRF error body into one Spanish message plus per-field Spanish messages.
 * `fallback` is the Spanish text used when the response says nothing useful.
 */
export async function readError(response: Response, fallback: string): Promise<ApiError> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && !Array.isArray(body)) {
      const fieldErrors: Record<string, string> = {};
      for (const [key, value] of Object.entries(body)) {
        const messages = [
          ...new Set(
            collectMessages(value).map(text => translateMessage(text, response.status, fallback)),
          ),
        ];
        if (messages.length > 0) fieldErrors[key] = messages.join(' ');
      }
      const first = Object.values(fieldErrors)[0];
      if (first) return new ApiError(first, response.status, fieldErrors);
    }
  } catch {
    // body not JSON
  }
  return new ApiError(statusMessage(response.status, fallback), response.status);
}

/**
 * Message safe to show to the user for any thrown value.
 */
export function toFriendlyMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError) return NETWORK_MESSAGE;
  return fallback;
}
