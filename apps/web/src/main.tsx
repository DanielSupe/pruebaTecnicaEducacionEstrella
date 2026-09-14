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

/**
 * Sesion caducada.
 *
 * Se avisa antes de redirigir: aparecer de golpe en la pantalla de acceso sin
 * explicacion hace pensar que la aplicacion fallo.
 *
 * El guardia contra bucles importa: si el rechazo ocurre estando ya en una
 * pantalla publica, redirigir de nuevo encadenaria avisos sin fin.
 */
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
