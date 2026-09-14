import { describe, it, expect } from "vitest";
import { loadConfig } from "./env.js";

const minimo = {
  VITE_API_BASE_URL: "https://api.ejemplo.com/api/v1",
  VITE_COGNITO_USER_POOL_ID: "us-east-1_XXXXXXXXX",
  VITE_COGNITO_CLIENT_ID: "clienteficticio123",
};

describe("loadConfig", () => {
  it("acepta una configuracion valida", () => {
    const config = loadConfig(minimo);
    expect(config.apiBaseUrl).toBe("https://api.ejemplo.com/api/v1");
    expect(config.cognitoUserPoolId).toBe("us-east-1_XXXXXXXXX");
  });

  it("quita la barra final para no construir rutas con doble barra", () => {
    const config = loadConfig({ ...minimo, VITE_API_BASE_URL: "http://localhost:3000/api/v1/" });
    expect(config.apiBaseUrl).toBe("http://localhost:3000/api/v1");
  });

  it.each(["VITE_API_BASE_URL", "VITE_COGNITO_USER_POOL_ID", "VITE_COGNITO_CLIENT_ID"])(
    "falla si falta %s, diciendo cual",
    (variable) => {
      // En una aplicacion de pagina unica los valores se incrustan al construir:
      // si esto no falla aqui, falla como pantalla rota para el usuario.
      const { [variable]: _omitida, ...incompleta } = minimo as Record<string, string>;
      expect(() => loadConfig(incompleta)).toThrowError(new RegExp(variable));
    },
  );

  it.each(["", "no-es-una-url", "localhost:3000", "  ", "api/v1", "./api/v1"])(
    "rechaza la direccion invalida %s",
    (VITE_API_BASE_URL) => {
      // "localhost:3000" es el caso que no salta a la vista: sin protocolo, el
      // parser lo lee como esquema "localhost:" con ruta "3000". Y "api/v1" se
      // resolveria contra la pagina actual, asi que funcionaria o no segun desde
      // donde se navegara.
      expect(() => loadConfig({ ...minimo, VITE_API_BASE_URL })).toThrowError();
    },
  );

  it("acepta una ruta desde la raiz, para cuando frontend y API comparten origen", () => {
    // Es como se sirve en la nube, y ademas evita tener que conocer el dominio
    // para poder construir el paquete.
    const config = loadConfig({ ...minimo, VITE_API_BASE_URL: "/api/v1" });

    expect(config.apiBaseUrl).toBe("/api/v1");
  });

  it("a una ruta desde la raiz tambien le quita la barra final", () => {
    // Si no, las peticiones saldrian con doble barra.
    const config = loadConfig({ ...minimo, VITE_API_BASE_URL: "/api/v1/" });

    expect(config.apiBaseUrl).toBe("/api/v1");
  });
});
