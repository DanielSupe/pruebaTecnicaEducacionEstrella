import { describe, it, expect } from "vitest";
import { APPLICATION_STATUSES } from "@educacion-estrella/shared";
import { fechaLegible, montoLegible, distintivoDeEstado } from "./format.js";

describe("fechaLegible", () => {
  it("traduce el instante de la API a una fecha en español", () => {
    const texto = fechaLegible("2026-09-13T10:00:00.000Z");

    // Asserting on parts, not the whole string: separators vary between ICU
    // versions, and pinning them would test the library instead of the behaviour.
    expect(texto).toContain("2026");
    expect(texto.toLowerCase()).toContain("sep");
    expect(texto).toContain("13");
  });

  it("no muestra la hora: en un listado no distingue una solicitud de otra", () => {
    expect(fechaLegible("2026-09-13T23:45:00.000Z")).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it("un instante ilegible no rompe la fila", () => {
    // The rest of the row must stay visible.
    expect(fechaLegible("no es una fecha")).toBe("—");
    expect(fechaLegible("")).toBe("—");
  });
});

describe("montoLegible", () => {
  it("agrupa los millares", () => {
    const texto = montoLegible(8_500_000);

    // The locale decides the separator; what matters is that it groups.
    expect(texto).not.toBe("8500000");
    expect(texto.replace(/\D/g, "")).toBe("8500000");
  });

  it("NO añade símbolo de moneda", () => {
    // No currency is persisted: a symbol would assert something absent from the
    // data.
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
    // Sharing classes would stop the badge telling "waiting on you" from "under
    // way".
    const clases = APPLICATION_STATUSES.map((e) => distintivoDeEstado(e).clases);

    expect(new Set(clases).size).toBe(APPLICATION_STATUSES.length);
  });

  it("un estado desconocido no rompe la fila", () => {
    // An API that adds states should not leave the user with a broken screen.
    const distintivo = distintivoDeEstado("APPROVED");

    expect(distintivo.texto).toBe("Estado desconocido");
    expect(distintivo.clases).not.toBe("");
  });
});
