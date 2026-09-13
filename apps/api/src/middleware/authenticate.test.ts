import { describe, it, expect, vi, afterEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import type { AccessTokenVerifier } from "./authenticate.js";

const config = { corsAllowedOrigins: ["http://localhost:5173"] };

const SUB = "140864d8-8011-701e-a19d-f2b91bb4932b";

const aceptaTodo: AccessTokenVerifier = {
  verify: () => Promise.resolve({ sub: SUB }),
};

const rechazaTodo: AccessTokenVerifier = {
  // Mensaje deliberadamente revelador: la prueba comprueba que NO se filtra.
  verify: () => Promise.reject(new Error("Token issued for client 9999, expected 1234")),
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("rutas protegidas", () => {
  it("responde 401 sin cabecera de autorizacion", async () => {
    const res = await request(createApp(config, aceptaTodo)).get("/api/v1/me");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: { code: "UNAUTHORIZED", message: "Credenciales ausentes o inválidas." },
    });
  });

  it.each([
    ["esquema desconocido", "Basic abc123"],
    ["sin esquema", "abc123"],
    ["Bearer sin token", "Bearer "],
    ["cadena vacia", ""],
  ])("responde 401 si la cabecera tiene formato incorrecto: %s", async (_caso, header) => {
    const res = await request(createApp(config, aceptaTodo))
      .get("/api/v1/me")
      .set("Authorization", header);

    expect(res.status).toBe(401);
  });

  it("responde 401 si el verificador rechaza el token, sin revelar el motivo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(createApp(config, rechazaTodo))
      .get("/api/v1/me")
      .set("Authorization", "Bearer token.que.no.vale");

    expect(res.status).toBe(401);

    // Lo importante: el motivo real no viaja. Decirle a quien prueba tokens que
    // "el cliente esperado es 1234" es regalarle informacion.
    const cuerpo = JSON.stringify(res.body) + res.text;
    expect(cuerpo).not.toContain("9999");
    expect(cuerpo).not.toContain("1234");
    expect(cuerpo).not.toContain("client");
  });

  it("registra en el servidor el motivo del rechazo, para poder diagnosticarlo", async () => {
    const espia = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(createApp(config, rechazaTodo))
      .get("/api/v1/me")
      .set("Authorization", "Bearer token.que.no.vale");

    expect(espia).toHaveBeenCalledOnce();
    expect((espia.mock.calls[0]?.[1] as Error).message).toContain("9999");
  });

  it("deja pasar un token valido y expone la identidad del token", async () => {
    const res = await request(createApp(config, aceptaTodo))
      .get("/api/v1/me")
      .set("Authorization", "Bearer token.valido");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ userId: SUB });
  });

  it("ignora cualquier identidad que llegue en la peticion", async () => {
    // Si esto fallara, cualquiera podria actuar en nombre de otro.
    const res = await request(createApp(config, aceptaTodo))
      .get("/api/v1/me")
      .query({ userId: "usuario-ajeno" })
      .set("Authorization", "Bearer token.valido");

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(SUB);
    expect(res.body.userId).not.toBe("usuario-ajeno");
  });
});

describe("la comprobacion de vida sigue publica", () => {
  it("responde sin cabecera de autorizacion", async () => {
    const res = await request(createApp(config, rechazaTodo)).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
