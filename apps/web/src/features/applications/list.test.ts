import { describe, it, expect } from "vitest";
import type { PaginatedApplications } from "@educacion-estrella/shared";
import { applicationsQuery, solicitudesDe } from "./list.js";

/** The option type is a union; here it is always the function. */
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
    // Opaque on purpose: the server rebuilds the partition from the token, not
    // from the cursor. Interpreting it here could only break it.
    const cursor = "QVBQIzAxSFhZWg";

    expect(siguientePuntero(pagina(20, cursor))).toBe(cursor);
  });

  it("sin puntero en la respuesta, no hay página siguiente", () => {
    // Returning undefined is what turns off the load-more button.
    expect(siguientePuntero(pagina(3))).toBeUndefined();
  });

  it("una página llena sin puntero tampoco ofrece más", () => {
    // The server decides where to cut, not the number of items received.
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
