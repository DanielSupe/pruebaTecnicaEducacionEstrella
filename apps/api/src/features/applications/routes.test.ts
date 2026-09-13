import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import type { RequestHandler } from "express";
import { errorHandler, notFoundHandler } from "../../middleware/error-handler.js";

const crearSolicitud = vi.fn();
const autorizarSubida = vi.fn();

// Solo se simula lo que habla con AWS. El repositorio y el autorizador se
// inyectan como dependencias, asi que no hace falta interceptar modulos.
import { createApplicationsRouter } from "./routes.js";

const repositorio = { createApplication: crearSolicitud };
const subidas = { authorizeUpload: autorizarSubida };

const SUB = "947844e8-5031-701a-bdf1-6d13401f76e9";

const datosValidos = {
  fullName: "Ana María Restrepo",
  idDocument: "1012345678",
  institution: "Universidad Nacional de Colombia",
  program: "Ingeniería de Sistemas",
  amount: 8_500_000,
  videoContentType: "video/mp4",
};

/** Simula el middleware de autenticación: estas pruebas son de la ruta. */
function autenticaComo(userId: string | null): RequestHandler {
  return (req, _res, next) => {
    if (userId) req.user = { userId };
    next();
  };
}

function app(userId: string | null = SUB) {
  const aplicacion = express();
  aplicacion.use(express.json());
  aplicacion.use("/api/v1", createApplicationsRouter(autenticaComo(userId), repositorio, subidas));
  aplicacion.use(notFoundHandler);
  aplicacion.use(errorHandler);
  return aplicacion;
}

beforeEach(() => {
  crearSolicitud.mockReset();
  autorizarSubida.mockReset();

  crearSolicitud.mockImplementation(
    (userId: string, _datos: unknown, videoKeyFor: (id: string) => string) => ({
      applicationId: "01HXYZ",
      userId,
      videoKey: videoKeyFor("01HXYZ"),
      createdAt: "2026-09-13T10:00:00.000Z",
    }),
  );

  autorizarSubida.mockResolvedValue({
    url: "https://bucket.s3.amazonaws.com/",
    fields: { key: "videos/x/01HXYZ.mp4", tagging: "<Tagging/>" },
  });
});

describe("POST /applications: autenticación", () => {
  it("responde 401 y no escribe nada si no hay identidad", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app(null)).post("/api/v1/applications").send(datosValidos);

    expect(res.status).toBe(401);
    expect(crearSolicitud).not.toHaveBeenCalled();
  });
});

describe("POST /applications: validación en servidor", () => {
  it.each([
    ["falta un campo", { ...datosValidos, fullName: undefined }],
    ["monto con decimales", { ...datosValidos, amount: 1500.5 }],
    ["monto negativo", { ...datosValidos, amount: -1 }],
    ["documento con letras", { ...datosValidos, idDocument: "10ABC5678" }],
    ["tipo de video no permitido", { ...datosValidos, videoContentType: "video/avi" }],
  ])("rechaza con 400 y no escribe nada: %s", async (_caso, cuerpo) => {
    const res = await request(app()).post("/api/v1/applications").send(cuerpo);

    expect(res.status).toBe(400);
    expect(crearSolicitud).not.toHaveBeenCalled();
  });

  it.each(["userId", "status", "videoKey", "videoSizeBytes"])(
    "rechaza si el cliente intenta fijar %s",
    async (campo) => {
      const res = await request(app())
        .post("/api/v1/applications")
        .send({ ...datosValidos, [campo]: "intruso" });

      expect(res.status).toBe(400);
      expect(crearSolicitud).not.toHaveBeenCalled();
    },
  );

  it("indica qué campo falla, no un mensaje genérico", async () => {
    const res = await request(app())
      .post("/api/v1/applications")
      .send({ ...datosValidos, idDocument: "abc" });

    expect(res.body.error.message).toContain("idDocument");
  });
});

describe("POST /applications: registro", () => {
  it("registra la solicitud con la identidad DEL TOKEN", async () => {
    const res = await request(app()).post("/api/v1/applications").send(datosValidos);

    expect(res.status).toBe(201);
    expect(crearSolicitud).toHaveBeenCalledOnce();
    expect(crearSolicitud.mock.calls[0]?.[0]).toBe(SUB);
  });

  it("ignora un userId del cuerpo aunque lograra colarse", async () => {
    // Doble red: el esquema estricto ya lo rechaza, pero si esa barrera
    // cambiara, la identidad seguiria saliendo del token.
    await request(app()).post("/api/v1/applications").send(datosValidos);

    expect(crearSolicitud.mock.calls[0]?.[0]).not.toBe("usuario-ajeno");
  });

  it("devuelve identificador, estado y autorización de subida", async () => {
    const res = await request(app()).post("/api/v1/applications").send(datosValidos);

    expect(res.body).toMatchObject({
      applicationId: "01HXYZ",
      status: "PENDING_VIDEO",
      upload: { url: expect.any(String), fields: expect.any(Object) },
    });
  });
});

describe("POST /applications: ruta del objeto", () => {
  it("la construye con la identidad del token y el identificador, no con el nombre del archivo", async () => {
    await request(app()).post("/api/v1/applications").send(datosValidos);

    expect(autorizarSubida).toHaveBeenCalledWith(`videos/${SUB}/01HXYZ.mp4`, "video/mp4");
  });

  it("deriva la extensión del tipo de contenido", async () => {
    await request(app())
      .post("/api/v1/applications")
      .send({ ...datosValidos, videoContentType: "video/webm" });

    expect(autorizarSubida).toHaveBeenCalledWith(`videos/${SUB}/01HXYZ.webm`, "video/webm");
  });
});
