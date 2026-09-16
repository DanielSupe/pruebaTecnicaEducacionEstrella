import axios, { type AxiosInstance } from "axios";
import { config } from "../config/config.js";
import { getAccessToken } from "./session.js";

// The raw technical message never reaches the interface: no "Network Error", no
// bare status code, no axios stack.
export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  /** Whether the interface should offer to retry. */
  readonly retriable: boolean;

  constructor(message: string, code: string, options: { status?: number; retriable: boolean }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status;
    this.retriable = options.retriable;
  }
}

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
        // Retrying a 4xx repeats the same error.
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

export const http: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Requested on EVERY request and never cached: the auth library decides when to
// refresh. Caching it ourselves means sending expired tokens to whoever has been
// working for a while.
//
// With no session the request goes out without the header instead of failing: the
// public screens use this client too.
http.interceptors.request.use(async (peticion) => {
  const token = await getAccessToken();
  if (token) {
    peticion.headers.Authorization = `Bearer ${token}`;
  }
  return peticion;
});

// Installed by the app at startup, because this module knows neither the router
// nor the query client.
let alRechazarSesion: (() => void) | null = null;

export function onSessionRejected(manejador: () => void): void {
  alRechazarSesion = manejador;
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    if (apiError.status === 401) {
      alRechazarSesion?.();
    }

    return Promise.reject(apiError);
  },
);
