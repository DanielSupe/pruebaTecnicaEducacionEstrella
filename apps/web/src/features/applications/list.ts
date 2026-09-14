import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Application, PaginatedApplications } from "@educacion-estrella/shared";
import { http } from "../../lib/http.js";

export const applicationsQueryKey = ["applications"] as const;

async function fetchPagina(cursor?: string): Promise<PaginatedApplications> {
  const { data } = await http.get<PaginatedApplications>("/applications", {
    // Sin puntero se pide la primera pagina. El limite lo decide el servidor.
    params: cursor ? { cursor } : undefined,
  });
  return data;
}

/**
 * Consulta paginada de las solicitudes propias.
 *
 * El puntero se devuelve TAL CUAL lo entrego la API. Es opaco a proposito: el
 * servidor reconstruye la particion a consultar desde el token, no desde lo que
 * venga en el puntero, asi que aqui no hay nada que interpretar ni que
 * completar. Tocarlo solo podria estropearlo.
 */
export const applicationsQuery = infiniteQueryOptions({
  queryKey: applicationsQueryKey,
  queryFn: ({ pageParam }) => fetchPagina(pageParam),
  initialPageParam: undefined as string | undefined,
  // Sin puntero en la respuesta significa que no quedan mas. Devolver undefined
  // es lo que apaga el boton de traer mas.
  getNextPageParam: (ultima: PaginatedApplications) => ultima.nextCursor,
});

/** Aplana las paginas en una sola lista, conservando el orden en que llegaron. */
export function solicitudesDe(paginas: PaginatedApplications[] | undefined): Application[] {
  return paginas?.flatMap((pagina) => pagina.items) ?? [];
}
