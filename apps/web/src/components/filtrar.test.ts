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
    // Para IDENTIDAD, eñe y ene son letras distintas. Para BUSCAR, no: quien
    // escribe "narino" en un teclado sin eñe debe encontrar "NARIÑO". El valor
    // que se guarda es siempre el original, con su eñe intacta.
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
    // En un teclado móvil poner la tilde es trabajo extra. Exigirla convertiría
    // la ayuda en un obstáculo.
    const { visibles } = coincidencias(MUESTRA, "aeronautica");

    expect(visibles).toEqual([]);
    expect(coincidencias(MUESTRA, "aeronauticos").visibles).toEqual([
      "CENTRO DE ESTUDIOS AERONÁUTICOS - CEA",
    ]);
  });

  it("busca en cualquier parte del nombre, no solo al principio", () => {
    // Quien busca "SENA" no empieza por "SERVICIO NACIONAL".
    expect(coincidencias(MUESTRA, "sena").visibles).toEqual([
      "SERVICIO NACIONAL DE APRENDIZAJE-SENA-",
    ]);
  });

  it("sin texto ofrece el principio del listado", () => {
    // Para quien no sabe cómo se escribe exactamente lo que busca.
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
    // Devolver todo le diría al usuario que su búsqueda encontró algo.
    const { visibles, total } = coincidencias(MUESTRA, "universitat de barcelona");

    expect(visibles).toEqual([]);
    expect(total).toBe(0);
  });
});

describe("coincidencias: cuántas se pintan", () => {
  it("no devuelve más de las que se pintan, pero sí dice cuántas hay", () => {
    // 300 nodos en el DOM por cada pulsación es gasto para nada; el total sirve
    // para decirle al usuario que siga escribiendo.
    const { visibles, total } = coincidencias(instituciones, "");

    expect(visibles).toHaveLength(MAX_OPCIONES);
    expect(total).toBe(instituciones.length);
    expect(total).toBeGreaterThan(visibles.length);
  });
});

describe("el listado versionado", () => {
  it("no tiene duplicados", () => {
    // El registro trae una fila por sede: sin deduplicar, la Nacional aparecería
    // nueve veces seguidas.
    expect(new Set(instituciones).size).toBe(instituciones.length);
  });

  it("está ordenado alfabéticamente en español", () => {
    const ordenado = [...instituciones].sort((a, b) => a.localeCompare(b, "es"));

    expect(instituciones).toEqual(ordenado);
  });

  it("conserva las tildes", () => {
    // Si la descarga o el guardado rompieran la codificación, esto lo detecta
    // antes de que un nombre mal escrito acabe en la base de datos.
    expect(instituciones.some((n) => /[ÁÉÍÓÚÑ]/.test(n))).toBe(true);
  });

  it("no tiene nombres vacíos ni con espacios de sobra", () => {
    for (const nombre of instituciones) {
      expect(nombre).toBe(nombre.trim());
      expect(nombre.length).toBeGreaterThan(0);
    }
  });
});
