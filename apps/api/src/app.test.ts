import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import express from "express";
import { createApp } from "./app.js";
import { errorHandler } from "./middleware/error-handler.js";

const config = { corsAllowedOrigins: ["http://localhost:5173"] };

// Doble del verificador: estas pruebas son del contrato de la app, no de la
// verificacion de tokens. Esa vive en authenticate.test.ts.
const verifier = { verify: () => Promise.resolve({ sub: "usuario-de-prueba" }) };

const app = () => createApp(config, verifier);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/v1/health", () => {
  it("responde que el servicio esta vivo", async () => {
    const res = await request(app()).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
    expect(typeof res.body.timestamp).toBe("string");
  });
});

describe("rutas desconocidas", () => {
  it("responde 404 con el formato comun de error, no con el HTML de Express", async () => {
    const res = await request(app()).get("/api/v1/no-existe");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { code: "NOT_FOUND", message: "La ruta solicitada no existe." },
    });
    expect(res.text).not.toContain("<html");
  });
});

describe("errores inesperados", () => {
  // Se monta una app minima con una ruta que revienta a proposito: es la unica
  // forma de ejercitar el camino del fallo no previsto.
  function appQueFalla(handler: express.RequestHandler) {
    const app = express();
    app.get("/boom", handler);
    app.use(errorHandler);
    return app;
  }

  const secreto = "SELECT * FROM usuarios WHERE password";

  it("no revela la traza ni el mensaje interno", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(
      appQueFalla(() => {
        throw new Error(secreto);
      }),
    ).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Ocurrió un error inesperado." },
    });

    // Lo que de verdad importa: nada del error original viaja al cliente.
    const cuerpo = JSON.stringify(res.body) + res.text;
    expect(cuerpo).not.toContain(secreto);
    expect(cuerpo).not.toContain("at ");
    expect(cuerpo).not.toContain("stack");
  });

  it("registra el detalle en el servidor para que siga siendo diagnosticable", async () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(
      appQueFalla(() => {
        throw new Error(secreto);
      }),
    ).get("/boom");

    expect(espia).toHaveBeenCalledOnce();

    // Ojo: JSON.stringify de un Error devuelve {}, porque sus propiedades no son
    // enumerables. Hay que mirar el objeto en si.
    const registrado = espia.mock.calls[0]?.[1];
    expect(registrado).toBeInstanceOf(Error);
    expect((registrado as Error).message).toBe(secreto);
  });

  it("captura tambien el rechazo de un manejador asincrono, sin envoltorios", async () => {
    // En Express 4 esto dejaba la peticion colgada hasta agotar el tiempo de
    // espera. Es la razon concreta por la que se eligio Express 5.
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(
      appQueFalla(async () => {
        await Promise.resolve();
        throw new Error("fallo asincrono");
      }),
    ).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("cuerpo de la peticion", () => {
  it("responde 400 con el formato comun si el JSON esta mal formado", async () => {
    const res = await request(app())
      .post("/api/v1/health")
      .set("Content-Type", "application/json")
      .send("{ esto no es json");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});
