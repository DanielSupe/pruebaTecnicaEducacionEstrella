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
      // Values are baked in at build time: if this does not fail here, it fails
      // as a broken screen for the user.
      const { [variable]: _omitida, ...incompleta } = minimo as Record<string, string>;
      expect(() => loadConfig(incompleta)).toThrowError(new RegExp(variable));
    },
  );

  it.each(["", "no-es-una-url", "localhost:3000", "  ", "api/v1", "./api/v1"])(
    "rechaza la direccion invalida %s",
    (VITE_API_BASE_URL) => {
      // "localhost:3000" is the non-obvious case: with no protocol the parser
      // reads it as scheme "localhost:" with path "3000".
      expect(() => loadConfig({ ...minimo, VITE_API_BASE_URL })).toThrowError();
    },
  );

  it("acepta una ruta desde la raiz, para cuando frontend y API comparten origen", () => {
    // How it is served in the cloud, and it avoids needing the domain to build.
    const config = loadConfig({ ...minimo, VITE_API_BASE_URL: "/api/v1" });

    expect(config.apiBaseUrl).toBe("/api/v1");
  });

  it("a una ruta desde la raiz tambien le quita la barra final", () => {
    // Otherwise requests would go out with a double slash.
    const config = loadConfig({ ...minimo, VITE_API_BASE_URL: "/api/v1/" });

    expect(config.apiBaseUrl).toBe("/api/v1");
  });
});
