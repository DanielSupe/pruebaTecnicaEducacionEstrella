import { describe, it, expect } from "vitest";
import { coincidencias, normalizar, MAX_OPCIONES } from "./filtrar.js";
import instituciones from "../features/applications/institutions.json";

const MUESTRA = [
  "UNIVERSIDAD DE ANTIOQUIA",
  "CENTRO DE ESTUDIOS AERONÁUTICOS - CEA",
  "UNIVERSIDAD NACIONAL DE COLOMBIA",
  "SERVICIO NACIONAL DE APRENDIZAJE-SENA-",
];

describe("normalizar", () => {
  it("quita las tildes y baja a minúsculas", () => {
    expect(normalizar("AERONÁUTICOS")).toBe("aeronauticos");
  });

  it("también iguala la eñe a la ene, porque esto es un buscador", () => {
    // For IDENTITY they are different letters. For SEARCH they are not: typing
    // "narino" on a keyboard without ñ must find "NARIÑO". The stored value is
    // always the original.
    expect(normalizar("NARIÑO")).toBe("narino");
  });
});

describe("coincidencias: cómo se busca", () => {
  it("encuentra una institución real escribiendo sin eñe", () => {
    expect(coincidencias(instituciones, "narino").visibles).toContain(
      "CORPORACION UNIVERSITARIA AUTONOMA DE NARIÑO -AUNAR-",
    );
  });

  it("encuentra escribiendo en minúscula", () => {
    const { visibles } = coincidencias(MUESTRA, "antioquia");

    expect(visibles).toEqual(["UNIVERSIDAD DE ANTIOQUIA"]);
  });

  it("encuentra escribiendo SIN tildes", () => {
    // Typing the accent on a mobile keyboard is extra work.
    const { visibles } = coincidencias(MUESTRA, "aeronautica");

    expect(visibles).toEqual([]);
    expect(coincidencias(MUESTRA, "aeronauticos").visibles).toEqual([
      "CENTRO DE ESTUDIOS AERONÁUTICOS - CEA",
    ]);
  });

  it("busca en cualquier parte del nombre, no solo al principio", () => {
    // Someone searching "SENA" does not start with "SERVICIO NACIONAL".
    expect(coincidencias(MUESTRA, "sena").visibles).toEqual([
      "SERVICIO NACIONAL DE APRENDIZAJE-SENA-",
    ]);
  });

  it("sin texto ofrece el principio del listado", () => {
    const { visibles, total } = coincidencias(MUESTRA, "");

    expect(visibles).toEqual(MUESTRA);
    expect(total).toBe(MUESTRA.length);
  });

  it("un texto de solo espacios cuenta como sin texto", () => {
    expect(coincidencias(MUESTRA, "   ").visibles).toEqual(MUESTRA);
  });
});

describe("coincidencias: cuando no hay nada", () => {
  it("devuelve VACÍO, no el listado entero", () => {
    // Returning everything would tell the user their search found something.
    const { visibles, total } = coincidencias(MUESTRA, "universitat de barcelona");

    expect(visibles).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("coincidencias: cuántas se pintan", () => {
  it("no devuelve más de las que se pintan, pero sí dice cuántas hay", () => {
    // 300 DOM nodes per keystroke is waste; the total tells the user to keep
    // typing.
    const { visibles, total } = coincidencias(instituciones, "");

    expect(visibles).toHaveLength(MAX_OPCIONES);
    expect(total).toBe(instituciones.length);
    expect(total).toBeGreaterThan(visibles.length);
  });
});

describe("el listado versionado", () => {
  it("no tiene duplicados", () => {
    // The registry has one row per campus: without deduplication the Nacional
    // would appear nine times in a row.
    expect(new Set(instituciones).size).toBe(instituciones.length);
  });

  it("está ordenado alfabéticamente en español", () => {
    const ordenado = [...instituciones].sort((a, b) => a.localeCompare(b, "es"));

    expect(instituciones).toEqual(ordenado);
  });

  it("conserva las tildes", () => {
    // Detects a broken encoding before a mangled name reaches the database.
    expect(instituciones.some((n) => /[ÁÉÍÓÚÑ]/.test(n))).toBe(true);
  });

  it("no tiene nombres vacíos ni con espacios de sobra", () => {
    for (const nombre of instituciones) {
      expect(nombre).toBe(nombre.trim());
      expect(nombre.length).toBeGreaterThan(0);
    }
  });
});
