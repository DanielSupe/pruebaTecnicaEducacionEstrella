import axios, { type AxiosInstance } from "axios";
import { config } from "../config/config.js";

/**
 * Error ya traducido a algo que se le puede enseñar a una persona.
 *
 * El mensaje tecnico crudo nunca llega a la interfaz: ni un "Network Error", ni
 * un codigo de estado a secas, ni la traza de axios.
 */
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  /** Si la accion se puede repetir tal cual, la interfaz ofrece reintentar. */
  readonly retriable: boolean;

  constructor(message: string, code: string, options: { status?: number; retriable: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
    this.retriable = options.retriable;
  }
}

/** Formato de error que devuelve la API. Lo define la capability api-rest. */
function mensajeDeLaApi(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("error" in data)) return null;
  const error = (data as { error: unknown }).error;
  if (typeof error !== "object" || error === null || !("message" in error)) return null;
  const message = (error as { message: unknown }).message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

function codigoDeLaApi(data: unknown): string | null {
  if (typeof data !== "object" || data === null || !("error" in data)) return null;
  const error = (data as { error: unknown }).error;
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = (error as { code: unknown }).code;
  return typeof code === "string" ? code : null;
}

/**
 * Traduce cualquier fallo a un ApiError.
 *
 * Tres casos, porque al usuario le importan de forma distinta:
 *  - La API respondio con un error: ya trae un mensaje pensado para leerse.
 *  - La API no respondio: el problema es de red o el servicio no esta.
 *  - La peticion se cancelo: no es un fallo, no hay que avisar de nada.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (axios.isCancel(error)) {
    return new ApiError("La operación se canceló.", "CANCELLED", { retriable: false });
  }

  if (axios.isAxiosError(error)) {
    if (error.response) {
      const status = error.response.status;
      return new ApiError(
        mensajeDeLaApi(error.response.data) ?? "No se pudo completar la operación.",
        codigoDeLaApi(error.response.data) ?? "API_ERROR",
        // Reintentar un 4xx repite el mismo error: solo se ofrece en fallos del servidor.
        { status, retriable: status >= 500 },
      );
    }

    return new ApiError(
      "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
      "NETWORK_ERROR",
      { retriable: true },
    );
  }

  return new ApiError("Ocurrió un error inesperado.", "UNKNOWN", { retriable: true });
}

/**
 * Cliente hacia la API.
 *
 * Sin interceptor de credenciales todavia: llega en add-web-auth, cuando exista
 * un token que adjuntar.
 */
export const http: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
