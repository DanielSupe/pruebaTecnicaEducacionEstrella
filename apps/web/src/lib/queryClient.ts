import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./http.js";

/**
 * Valores por omision de las consultas.
 *
 * El reintento automatico solo tiene sentido ante un fallo del servidor o de red.
 * Reintentar un 4xx repite el mismo error tres veces y solo consigue que el
 * usuario espere mas para ver el mismo mensaje.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (intentos, error) => {
        if (error instanceof ApiError && !error.retriable) return false;
        return intentos < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * El interceptor de http.ts rechaza SIEMPRE con un ApiError, asi que declararlo
 * como tipo de error por omision es una afirmacion cierta y no un casteo. Evita
 * tener que anotar el tipo en cada consulta.
 */
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
