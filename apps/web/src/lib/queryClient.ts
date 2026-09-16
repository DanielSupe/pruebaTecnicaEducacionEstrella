import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./http.js";

// Automatic retry only makes sense for a server or network failure. Retrying a 4xx
// repeats the same error three times and only makes the user wait longer to read
// the same message.
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

// The interceptor in http.ts ALWAYS rejects with an ApiError, so declaring it as
// the default error type is a true statement, not a cast.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
