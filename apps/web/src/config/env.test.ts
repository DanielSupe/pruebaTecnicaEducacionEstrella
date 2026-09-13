import { describe, it, expect } from "vitest";
import { loadConfig } from "./env.js";

describe("loadConfig", () => {
  it("acepta una URL valida", () => {
    const config = loadConfig({ VITE_API_BASE_URL: "https://api.ejemplo.com/api/v1" });
    expect(config.apiBaseUrl).toBe("https://api.ejemplo.com/api/v1");
  });

  it("quita la barra final para no construir rutas con doble barra", () => {
    const config = loadConfig({ VITE_API_BASE_URL: "http://localhost:3000/api/v1/" });
    expect(config.apiBaseUrl).toBe("http://localhost:3000/api/v1");
  });

  it("falla si falta la direccion de la API, diciendo cual", () => {
    // En una aplicacion de pagina unica los valores se incrustan al construir:
    // si esto no falla aqui, falla como pantalla rota para el usuario.
    expect(() => loadConfig({})).toThrowError(/VITE_API_BASE_URL/);
  });

  it.each(["", "no-es-una-url", "localhost:3000", "  "])(
    "rechaza la direccion invalida %s",
    (VITE_API_BASE_URL) => {
      expect(() => loadConfig({ VITE_API_BASE_URL })).toThrowError();
    },
  );
});
