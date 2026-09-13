import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AppShell } from "../components/AppShell.js";
import { HomePage } from "./HomePage.js";

/**
 * Arbol de rutas escrito a mano.
 *
 * Se descarto la variante generada a partir de archivos: ahorra codigo repetido
 * pero deja en el repositorio un archivo que nadie escribio, y con media docena
 * de rutas el ahorro no compensa la capa de magia.
 */
const rootRoute = createRootRoute({
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const routeTree = rootRoute.addChildren([homeRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
