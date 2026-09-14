import { describe, it, expect } from "vitest";
import { APPLICATION_STATUSES } from "@educacion-estrella/shared";
import { fechaLegible, montoLegible, distintivoDeEstado } from "./format.js";

describe("fechaLegible", () => {
  it("traduce el instante de la API a una fecha en español", () => {
    const texto = fechaLegible("2026-09-13T10:00:00.000Z");

    // Se afirma sobre las partes y no sobre la cadena entera: el separador y el
    // punto tras el mes varían entre versiones de ICU, y fijarlos convertiría
    // una prueba de comportamiento en una prueba de la librería.
    expect(texto).toContain("2026");
    expect(texto.toLowerCase()).toContain("sep");
    expect(texto).toContain("13");
  });

  it("no muestra la hora: en un listado no distingue una solicitud de otra", () => {
    expect(fechaLegible("2026-09-13T23:45:00.000Z")).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("un instante ilegible no rompe la fila", () => {
    // El resto de la solicitud se tiene que seguir viendo.
    expect(fechaLegible("no es una fecha")).toBe("—");
    expect(fechaLegible("")).toBe("—");
  });
});

describe("montoLegible", () => {
  it("agrupa los millares", () => {
    const texto = montoLegible(8_500_000);

    // El separador concreto lo decide la configuración regional; lo que importa
    // es que agrupe y que estén todos los dígitos.
    expect(texto).not.toBe("8500000");
    expect(texto.replace(/\D/g, "")).toBe("8500000");
  });

  it("NO añade símbolo de moneda", () => {
    // No se persiste ninguna moneda: pintar un símbolo afirmaría algo que el
    // dato no contiene. La unidad va en la cabecera de la columna.
    const texto = montoLegible(8_500_000);

    expect(texto).not.toContain("$");
    expect(texto).not.toContain("COP");
  });

  it("un monto de un solo dígito se muestra tal cual", () => {
    expect(montoLegible(1)).toBe("1");
  });

  it("un monto que no es un número no rompe la fila", () => {
    expect(montoLegible(Number.NaN)).toBe("—");
  });
});

describe("distintivoDeEstado", () => {
  it("traduce cada estado a su texto en español", () => {
    expect(distintivoDeEstado("PENDING_VIDEO").texto).toBe("Video pendiente");
    expect(distintivoDeEstado("UNDER_REVIEW").texto).toBe("En revisión");
  });

  it("NO muestra el identificador interno", () => {
    for (const estado of APPLICATION_STATUSES) {
      expect(distintivoDeEstado(estado).texto).not.toContain("_");
      expect(distintivoDeEstado(estado).texto).not.toBe(estado);
    }
  });

  it("cada estado del dominio tiene su propio color", () => {
    // Si dos estados compartieran clases, el distintivo dejaria de distinguir
    // lo que espera al usuario de lo que sigue su curso.
    const clases = APPLICATION_STATUSES.map((e) => distintivoDeEstado(e).clases);

    expect(new Set(clases).size).toBe(APPLICATION_STATUSES.length);
  });

  it("un estado desconocido no rompe la fila", () => {
    // Una API que anada estados no deberia dejar al usuario ante una pantalla
    // rota: la solicitud se sigue viendo con el resto de sus datos.
    const distintivo = distintivoDeEstado("APPROVED");

    expect(distintivo.texto).toBe("Estado desconocido");
    expect(distintivo.clases).not.toBe("");
  });
});
