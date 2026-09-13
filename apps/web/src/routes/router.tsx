import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { AppShell } from "../components/AppShell.js";
import { HomePage } from "./HomePage.js";
import { LoginPage } from "./LoginPage.js";
import { SignUpPage } from "./SignUpPage.js";
import { sessionQuery } from "../lib/session.js";

/**
 * El contexto lleva el cliente de consultas porque beforeLoad corre FUERA de
 * React y no puede usar hooks. Sin esto, la proteccion de rutas tendria que
 * resolver la sesion por su cuenta y acabaria discrepando de lo que ve la
 * interfaz justo en los bordes.
 */
type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

/**
 * Rama privada.
 *
 * La comprobacion ocurre ANTES de pintar: un guardian que muestra la pantalla y
 * redirige despues deja ver, aunque sea un instante, lo que no debia verse.
 * ensureQueryData reutiliza la sesion ya resuelta si esta fresca.
 */
const privateRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "privada",
  component: AppShell,
  beforeLoad: async ({ context }) => {
    const sesion = await context.queryClient.ensureQueryData(sessionQuery);

    if (!sesion) {
      throw redirect({ to: "/login" });
    }

    return { sesion };
  },
});

const homeRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/",
  component: HomePage,
});

/** Rama publica: quien ya tiene sesion no deberia estar aqui. */
const publicRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "publica",
  component: Outlet,
  beforeLoad: async ({ context }) => {
    const sesion = await context.queryClient.ensureQueryData(sessionQuery);

    if (sesion) {
      throw redirect({ to: "/" });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/login",
  component: LoginPage,
});

const signUpRoute = createRoute({
  getParentRoute: () => publicRoute,
  path: "/registro",
  component: SignUpPage,
});

const routeTree = rootRoute.addChildren([
  privateRoute.addChildren([homeRoute]),
  publicRoute.addChildren([loginRoute, signUpRoute]),
]);

export function crearRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof crearRouter>;
  }
}
