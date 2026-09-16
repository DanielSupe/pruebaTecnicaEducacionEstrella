import { describe, it, expect } from "vitest";
import { loadConfig } from "./env.js";

const minimo = {
  CORS_ALLOWED_ORIGINS: "http://localhost:5173",
  COGNITO_USER_POOL_ID: "us-east-1_XXXXXXXXX",
  COGNITO_CLIENT_ID: "clienteficticio123",
  APPLICATIONS_TABLE_NAME: "tabla-de-prueba",
  VIDEOS_BUCKET_NAME: "bucket-de-prueba",
  AWS_REGION: "us-east-1",
};

describe("loadConfig", () => {
  it("acepta una configuracion valida y aplica los valores por omision", () => {
    const config = loadConfig(minimo);

    expect(config.corsAllowedOrigins).toEqual(["http://localhost:5173"]);
    expect(config.port).toBe(3000);
    expect(config.nodeEnv).toBe("development");
  });

  it("separa varios origenes y descarta los espacios", () => {
    const config = loadConfig({
      ...minimo,
      CORS_ALLOWED_ORIGINS: "http://localhost:5173, https://ejemplo.cloudfront.net",
    });

    expect(config.corsAllowedOrigins).toEqual([
      "http://localhost:5173",
      "https://ejemplo.cloudfront.net",
    ]);
  });

  it("falla si falta una variable obligatoria, diciendo cual", () => {
    // Without this, a misconfigured deployment breaks mid-request instead of
    // refusing to start.
    expect(() => loadConfig({})).toThrowError(/CORS_ALLOWED_ORIGINS/);
  });

  it.each(["", "   "])("falla si la variable obligatoria esta vacia (%s)", (valor) => {
    expect(() => loadConfig({ ...minimo, CORS_ALLOWED_ORIGINS: valor })).toThrowError();
  });

  it.each([
    "COGNITO_USER_POOL_ID",
    "COGNITO_CLIENT_ID",
    "APPLICATIONS_TABLE_NAME",
    "VIDEOS_BUCKET_NAME",
    "AWS_REGION",
  ])("falla si falta %s, diciendo cual", (variable) => {
    const { [variable]: _omitida, ...incompleta } = minimo as Record<string, string>;
    expect(() => loadConfig(incompleta)).toThrowError(new RegExp(variable));
  });

  it.each(["no-es-un-numero", "-1", "99999"])("rechaza el puerto invalido %s", (PORT) => {
    expect(() => loadConfig({ ...minimo, PORT })).toThrowError();
  });

  it("rechaza un entorno no reconocido", () => {
    expect(() => loadConfig({ ...minimo, NODE_ENV: "staging" })).toThrowError();
  });
});
