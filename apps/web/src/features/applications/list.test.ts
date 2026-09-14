import { describe, it, expect } from "vitest";
import type { PaginatedApplications } from "@educacion-estrella/shared";
import { applicationsQuery, solicitudesDe } from "./list.js";

/** El tipo de la opción es una unión; aquí siempre es la función. */
const siguientePuntero = applicationsQuery.getNextPageParam as (
  ultima: PaginatedApplications,
) => string | undefined;

function pagina(items: number, nextCursor?: string): PaginatedApplications {
  return {
    items: Array.from({ length: items }, (_, i) => ({
      applicationId: `app-${String(i)}`,
    })) as never,
    nextCursor,
  };
}

describe("el puntero de continuación", () => {
  it("se propaga TAL CUAL lo entregó la API", () => {
    // Es opaco a propósito: el servidor reconstruye la partición desde el
    // token, no desde el puntero. Interpretarlo aquí solo podría estropearlo.
    const cursor = "QVBQIzAxSFhZWg";

    expect(siguientePuntero(pagina(20, cursor))).toBe(cursor);
  });

  it("sin puntero en la respuesta, no hay página siguiente", () => {
    // Devolver undefined es lo que apaga el botón de traer más.
    expect(siguientePuntero(pagina(3))).toBeUndefined();
  });

  it("una página llena sin puntero tampoco ofrece más", () => {
    // El corte lo decide el servidor, no el número de elementos recibidos.
    expect(siguientePuntero(pagina(20))).toBeUndefined();
  });
});

describe("solicitudesDe", () => {
  it("aplana las páginas conservando el orden en que llegaron", () => {
    const paginas = [pagina(2, "siguiente"), pagina(1)];

    const ids = solicitudesDe(paginas).map((s) => s.applicationId);

    expect(ids).toEqual(["app-0", "app-1", "app-0"]);
  });

  it("sin datos todavía devuelve una lista vacía, no revienta", () => {
    expect(solicitudesDe(undefined)).toEqual([]);
  });
});
