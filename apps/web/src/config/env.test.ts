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

  it.each(["", "no-es-una-url", "localhost:3000", "  "])(
    "rechaza la direccion invalida %s",
    (VITE_API_BASE_URL) => {
      expect(() => loadConfig({ ...minimo, VITE_API_BASE_URL })).toThrowError();
    },
  );
});
