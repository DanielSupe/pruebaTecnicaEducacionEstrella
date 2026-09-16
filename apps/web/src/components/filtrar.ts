// Lives outside Combobox.tsx so it can be tested without mounting React, which is
// what the rest of the project does: pure functions, not components.

/** Maximum number of options rendered at once. */
export const MAX_OPCIONES = 50;

// Without this, typing "aeronautica" would not find "AERONÁUTICOS". Requiring the
// exact accent turns the help into an obstacle, worse still on a mobile keyboard.
//
// NFD splits each letter from its accent; the stripped range is those loose marks.
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type Coincidencias = {
  /** What gets rendered: at most MAX_OPCIONES. */
  visibles: string[];
  /** How many match in total, which may exceed the rendered ones. */
  total: number;
};

// With no text, the start of the list is offered, so the field also helps whoever
// does not know the exact spelling.
//
// With text that matches nothing, returns EMPTY rather than the whole list:
// returning everything would tell the user their search found something.
export function coincidencias(opciones: readonly string[], texto: string): Coincidencias {
  const buscado = normalizar(texto);

  if (buscado === "") {
    return { visibles: opciones.slice(0, MAX_OPCIONES), total: opciones.length };
  }

  const encontradas = opciones.filter((opcion) => normalizar(opcion).includes(buscado));

  return { visibles: encontradas.slice(0, MAX_OPCIONES), total: encontradas.length };
}
