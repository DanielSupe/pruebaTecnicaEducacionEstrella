import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { AppShell } from "../components/AppShell.js";
import { ApplicationsPage } from "./ApplicationsPage.js";
import { NewApplicationPage } from "./NewApplicationPage.js";
import { LoginPage } from "./LoginPage.js";
import { SignUpPage } from "./SignUpPage.js";
import { sessionQuery } from "../lib/session.js";

// The context carries the query client because beforeLoad runs OUTSIDE React and
// cannot use hooks. Without it, the route guard would resolve the session on its
// own and diverge from what the interface sees, exactly at the edges.
type RouterContext = {
  queryClient: QueryClient;
};

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

// The check happens BEFORE painting: a guard that shows the screen and redirects
// afterwards reveals, if only for an instant, what should not be seen.
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

const applicationsRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/",
  component: ApplicationsPage,
});

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

const newApplicationRoute = createRoute({
  getParentRoute: () => privateRoute,
  path: "/solicitudes/nueva",
  component: NewApplicationPage,
});

const routeTree = rootRoute.addChildren([
  privateRoute.addChildren([applicationsRoute, newApplicationRoute]),
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
