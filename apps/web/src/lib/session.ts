import { fetchAuthSession, signOut as amplifySignOut } from "aws-amplify/auth";
import type { QueryClient } from "@tanstack/react-query";

export type Session = {
  userId: string;
} | null;

/**
 * Resuelve la sesion actual.
 *
 * fetchAuthSession renueva el token por su cuenta si hace falta, asi que llamarla
 * es tambien la forma de saber si la sesion sigue siendo valida.
 */
async function fetchSession(): Promise<Session> {
  try {
    const sesion = await fetchAuthSession();
    const sub = sesion.tokens?.accessToken.payload.sub;
    return typeof sub === "string" ? { userId: sub } : null;
  } catch {
    // Sin sesion no es un error: es el estado normal de quien no ha entrado.
    return null;
  }
}

/**
 * Definicion compartida de la consulta.
 *
 * La usan tanto la interfaz (con hooks) como el guardian de rutas, que corre
 * FUERA de React. Una sola fuente de verdad: si cada uno resolviera la sesion
 * por su lado, acabarian discrepando justo en los bordes.
 */
export const sessionQuery = {
  queryKey: ["session"] as const,
  queryFn: fetchSession,
  staleTime: 30_000,
};

/** Obtiene el token vigente para adjuntarlo a una peticion, o null si no hay. */
export async function getAccessToken(): Promise<string | null> {
  try {
    const sesion = await fetchAuthSession();
    return sesion.tokens?.accessToken.toString() ?? null;
  } catch {
    return null;
  }
}

/**
 * Cierra la sesion y deja la cache en un estado que el guardian de rutas puede
 * creerse.
 *
 * Se FIJA el valor en lugar de invalidarlo: invalidar solo marca el dato como
 * viejo, y ensureQueryData puede devolver el anterior mientras refresca. El
 * guardian decidiria entonces con una sesion que ya no existe, y la pantalla
 * privada seguiria en pie despues de cerrar sesion.
 */
export async function signOut(queryClient: QueryClient): Promise<void> {
  await amplifySignOut();
  queryClient.setQueryData(sessionQuery.queryKey, null);
}

/**
 * Refresca la sesion tras iniciarla, y ESPERA al resultado.
 *
 * staleTime se anula a proposito. Es una optimizacion de cache razonable para
 * leer la sesion a lo largo de la navegacion, pero aqui sabemos con certeza que
 * acaba de cambiar: respetarlo devolveria el valor anterior (tipicamente null,
 * cacheado al cargar la pantalla de acceso) y el guardian de rutas rebotaria al
 * usuario recien autenticado de vuelta al acceso.
 */
export async function refreshSession(queryClient: QueryClient): Promise<void> {
  await queryClient.fetchQuery({ ...sessionQuery, staleTime: 0 });
}
