import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { crearRouter } from "./routes/router.js";
import { queryClient } from "./lib/queryClient.js";
import { configureAuth } from "./lib/amplify.js";
import { onSessionRejected } from "./lib/http.js";
import { sessionQuery } from "./lib/session.js";
import { avisarError } from "./lib/dialogs.js";
import "./index.css";

configureAuth();

const router = crearRouter(queryClient);

// Warn before redirecting: landing on the login screen with no explanation reads
// as the application having failed.
//
// The loop guard matters: if the rejection happens while already on a public
// screen, redirecting again would chain alerts forever.
const RUTAS_PUBLICAS = ["/login", "/registro"];
let avisando = false;

onSessionRejected(() => {
  if (avisando || RUTAS_PUBLICAS.includes(window.location.pathname)) return;
  avisando = true;

  void (async () => {
    queryClient.setQueryData(sessionQuery.queryKey, null);

    await avisarError({
      titulo: "Tu sesión caducó",
      mensaje: "Vuelve a iniciar sesión para continuar.",
    });

    await router.navigate({ to: "/login" });
    avisando = false;
  })();
});

const contenedor = document.getElementById("root");

if (!contenedor) {
  throw new Error("No se encontró el elemento #root en el documento.");
}

createRoot(contenedor).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
