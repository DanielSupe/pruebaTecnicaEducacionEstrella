import { infiniteQueryOptions } from "@tanstack/react-query";
import type { Application, PaginatedApplications } from "@educacion-estrella/shared";
import { http } from "../../lib/http.js";

export const applicationsQueryKey = ["applications"] as const;

async function fetchPagina(cursor?: string): Promise<PaginatedApplications> {
  const { data } = await http.get<PaginatedApplications>("/applications", {
    // With no cursor this asks for the first page. The server decides the limit.
    params: cursor ? { cursor } : undefined,
  });
  return data;
}

// The cursor is returned EXACTLY as the API handed it over. It is opaque on
// purpose: the server rebuilds the partition from the token, so there is nothing
// here to interpret. Touching it could only break it.
export const applicationsQuery = infiniteQueryOptions({
  queryKey: applicationsQueryKey,
  queryFn: ({ pageParam }) => fetchPagina(pageParam),
  initialPageParam: undefined as string | undefined,
  // No cursor in the response means there are no more pages: returning undefined
  // is what turns off the load-more button.
  getNextPageParam: (ultima: PaginatedApplications) => ultima.nextCursor,
});

/** Flattens the pages into one list, keeping the order they arrived in. */
export function solicitudesDe(paginas: PaginatedApplications[] | undefined): Application[] {
  return paginas?.flatMap((pagina) => pagina.items) ?? [];
}
