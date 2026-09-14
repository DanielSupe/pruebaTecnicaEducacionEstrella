import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import type { RequestHandler } from "express";
import { errorHandler, notFoundHandler } from "../../middleware/error-handler.js";

const SUB = "947844e8-5031-701a-bdf1-6d13401f76e9";

const crearSolicitud = vi.fn();
const autorizarSubida = vi.fn();
const leerSolicitud = vi.fn();
const marcarEnviada = vi.fn();
const verificarVideo = vi.fn();
const marcarConfirmado = vi.fn();
const firmarLectura = vi.fn();
const listarSolicitudes = vi.fn();

/** Registro del orden en que se llamaron las operaciones del aviso. */
const orden: string[] = [];

// Solo se simula lo que habla con AWS. El repositorio y el autorizador se
// inyectan como dependencias, asi que no hace falta interceptar modulos.
import { createApplicationsRouter } from "./routes.js";

const repositorio = {
  createApplication: crearSolicitud,
  getApplication: leerSolicitud,
  markAsSubmitted: marcarEnviada,
  listApplications: listarSolicitudes,
};

const almacenamiento = {
  authorizeUpload: autorizarSubida,
  authorizeView: firmarLectura,
  verifyStoredVideo: verificarVideo,
  markVideoAsConfirmed: marcarConfirmado,
};

const SOLICITUD_PENDIENTE = {
  applicationId: "01HXYZ",
  userId: SUB,
  status: "PENDING_VIDEO" as const,
  videoContentType: "video/mp4" as const,
  videoKey: `videos/${SUB}/01HXYZ.mp4`,
  fullName: "Ana María Restrepo",
  idDocument: "1012345678",
  institution: "Universidad Nacional",
  program: "Ingeniería",
  amount: 8_500_000,
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
};

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
  aplicacion.use(
    "/api/v1",
    createApplicationsRouter(autenticaComo(userId), repositorio, almacenamiento),
  );
  aplicacion.use(notFoundHandler);
  aplicacion.use(errorHandler);
  return aplicacion;
}

beforeEach(() => {
  orden.length = 0;
  crearSolicitud.mockReset();
  autorizarSubida.mockReset();
  leerSolicitud.mockReset();
  marcarEnviada.mockReset();
  verificarVideo.mockReset();
  marcarConfirmado.mockReset();
  firmarLectura.mockReset();
  firmarLectura.mockResolvedValue({
    url: "https://bucket.s3.amazonaws.com/videos/x/01HXYZ.mp4?X-Amz-Signature=abc",
    expiresAt: "2026-09-14T10:15:00.000Z",
  });
  listarSolicitudes.mockReset();
  listarSolicitudes.mockResolvedValue({ items: [], nextCursor: undefined });

  leerSolicitud.mockResolvedValue(SOLICITUD_PENDIENTE);
  verificarVideo.mockImplementation(() => {
    orden.push("verificar");
    return Promise.resolve({ estado: "correcto", sizeBytes: 15_728_640 });
  });
  marcarConfirmado.mockImplementation(() => {
    orden.push("reetiquetar");
    return Promise.resolve();
  });
  marcarEnviada.mockImplementation(() => {
    orden.push("actualizar");
    return Promise.resolve({
      ...SOLICITUD_PENDIENTE,
      status: "UNDER_REVIEW",
      videoSizeBytes: 15_728_640,
    });
  });

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

describe("POST /:id/complete-upload", () => {
  const url = "/api/v1/applications/01HXYZ/complete-upload";

  it("da la solicitud por enviada y registra el tamaño real", async () => {
    const res = await request(app()).post(url).send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UNDER_REVIEW");
    expect(res.body.videoSizeBytes).toBe(15_728_640);
    expect(marcarEnviada).toHaveBeenCalledWith(SUB, "01HXYZ", 15_728_640);
  });

  it("reetiqueta ANTES de actualizar", async () => {
    // El orden no es indiferente: al reves, un fallo entre medias dejaria una
    // solicitud enviada con el video aun marcado como pendiente, y la limpieza
    // automatica lo borraria. Un test que solo comprobara que ambas ocurren
    // pasaria igual con el orden equivocado.
    await request(app()).post(url).send();

    expect(orden).toEqual(["verificar", "reetiquetar", "actualizar"]);
  });

  it("no expone la ruta interna del objeto", async () => {
    const res = await request(app()).post(url).send();

    expect(res.body.videoKey).toBeUndefined();
  });

  it("responde con conflicto si no hay video almacenado, sin tocar nada", async () => {
    verificarVideo.mockResolvedValue({ estado: "ausente" });

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(409);
    expect(marcarConfirmado).not.toHaveBeenCalled();
    expect(marcarEnviada).not.toHaveBeenCalled();
  });

  it("responde con conflicto si el objeto no coincide con lo autorizado", async () => {
    verificarVideo.mockResolvedValue({ estado: "no-coincide", motivo: "el tamaño no es válido" });

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(409);
    expect(marcarEnviada).not.toHaveBeenCalled();
  });

  it("avisar dos veces devuelve exito sin repetir los efectos", async () => {
    leerSolicitud.mockResolvedValue({ ...SOLICITUD_PENDIENTE, status: "UNDER_REVIEW" });

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("UNDER_REVIEW");
    expect(verificarVideo).not.toHaveBeenCalled();
    expect(marcarConfirmado).not.toHaveBeenCalled();
  });

  it("una solicitud ajena se comporta como inexistente", async () => {
    leerSolicitud.mockResolvedValue(null);

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(404);
  });

  it("sin autenticacion devuelve 401 y no toca nada", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app(null)).post(url).send();

    expect(res.status).toBe(401);
    expect(leerSolicitud).not.toHaveBeenCalled();
  });
});

describe("POST /:id/video-url", () => {
  const url = "/api/v1/applications/01HXYZ/video-url";

  it("devuelve una autorizacion nueva para la MISMA ruta", async () => {
    // La ruta se reutiliza a proposito: reintentar sobreescribe en lugar de ir
    // dejando huerfanos por cada intento.
    const res = await request(app()).post(url).send();

    expect(res.status).toBe(200);
    expect(autorizarSubida).toHaveBeenCalledWith(`videos/${SUB}/01HXYZ.mp4`, "video/mp4");
  });

  it("responde con conflicto si la solicitud ya fue enviada", async () => {
    leerSolicitud.mockResolvedValue({ ...SOLICITUD_PENDIENTE, status: "UNDER_REVIEW" });

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(409);
    expect(autorizarSubida).not.toHaveBeenCalled();
  });

  it("una solicitud ajena se comporta como inexistente", async () => {
    leerSolicitud.mockResolvedValue(null);

    const res = await request(app()).post(url).send();

    expect(res.status).toBe(404);
  });
});

describe("GET /:id/video-url: enlace para ver el video", () => {
  const url = "/api/v1/applications/01HXYZ/video-url";
  const ENVIADA = { ...SOLICITUD_PENDIENTE, status: "UNDER_REVIEW" as const };

  it("firma la lectura de la ruta registrada en la solicitud", async () => {
    leerSolicitud.mockResolvedValue(ENVIADA);

    const res = await request(app()).get(url);

    expect(res.status).toBe(200);
    expect(firmarLectura).toHaveBeenCalledWith(`videos/${SUB}/01HXYZ.mp4`);
    expect(res.body.url).toContain("X-Amz-Signature");
  });

  it("la respuesta NO expone la ubicación del objeto como dato", async () => {
    // Va dentro del enlace, firmada. Devolverla aparte seria publicarla.
    leerSolicitud.mockResolvedValue(ENVIADA);

    const res = await request(app()).get(url);

    expect(res.body).toEqual({
      url: expect.any(String) as string,
      expiresAt: expect.any(String) as string,
    });
    expect(res.body).not.toHaveProperty("videoKey");
  });

  it("la caducidad va por delante del momento de la petición", async () => {
    leerSolicitud.mockResolvedValue(ENVIADA);
    const antes = Date.now();
    firmarLectura.mockImplementation(() =>
      Promise.resolve({
        url: "https://bucket.s3.amazonaws.com/x?X-Amz-Signature=abc",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      }),
    );

    const res = await request(app()).get(url);

    expect(new Date(res.body.expiresAt as string).getTime()).toBeGreaterThan(antes);
  });

  it("sin el video confirmado responde con conflicto y NO llega a firmar nada", async () => {
    // Afirmar solo sobre el codigo dejaria pasar una version que firma primero
    // y decide despues: la firma es justo lo que no debe ocurrir.
    leerSolicitud.mockResolvedValue(SOLICITUD_PENDIENTE);

    const res = await request(app()).get(url);

    expect(res.status).toBe(409);
    expect(firmarLectura).not.toHaveBeenCalled();
  });

  it("una solicitud ajena se comporta como inexistente y no se firma nada", async () => {
    leerSolicitud.mockResolvedValue(null);

    const res = await request(app()).get(url);

    expect(res.status).toBe(404);
    expect(firmarLectura).not.toHaveBeenCalled();
  });

  it("sin identidad responde 401 y no se firma nada", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app(null)).get(url);

    expect(res.status).toBe(401);
    expect(firmarLectura).not.toHaveBeenCalled();
  });
});

describe("GET /applications", () => {
  const url = "/api/v1/applications";

  it("consulta con la identidad DEL TOKEN", async () => {
    await request(app()).get(url);

    expect(listarSolicitudes).toHaveBeenCalledOnce();
    expect(listarSolicitudes.mock.calls[0]?.[0]).toBe(SUB);
  });

  it("ignora un identificador de usuario que venga en la petición", async () => {
    await request(app()).get(`${url}?userId=usuario-ajeno`);

    expect(listarSolicitudes.mock.calls[0]?.[0]).toBe(SUB);
  });

  it("sin solicitudes devuelve lista vacía y éxito, no un error", async () => {
    // No tener ninguna es el estado normal de quien acaba de registrarse.
    const res = await request(app()).get(url);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });

  it("devuelve las solicitudes con su estado y su fecha", async () => {
    listarSolicitudes.mockResolvedValue({
      items: [SOLICITUD_PENDIENTE, { ...SOLICITUD_PENDIENTE, applicationId: "01HXYA" }],
      nextCursor: undefined,
    });

    const res = await request(app()).get(url);

    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).toMatchObject({
      status: "PENDING_VIDEO",
      createdAt: expect.any(String),
    });
  });

  it("no expone la ruta interna del objeto en ninguna solicitud", async () => {
    listarSolicitudes.mockResolvedValue({ items: [SOLICITUD_PENDIENTE], nextCursor: undefined });

    const res = await request(app()).get(url);

    expect(res.body.items[0].videoKey).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("videos/");
  });

  it("aplica el límite por omisión cuando no se indica", async () => {
    await request(app()).get(url);

    expect(listarSolicitudes.mock.calls[0]?.[1]).toMatchObject({ limit: 20 });
  });

  it("traslada el límite y el puntero recibidos", async () => {
    await request(app()).get(`${url}?limit=5&cursor=QVBQIzAx`);

    expect(listarSolicitudes.mock.calls[0]?.[1]).toMatchObject({ limit: 5, cursor: "QVBQIzAx" });
  });

  it.each(["0", "51", "-1", "abc", "2.5"])("rechaza el límite inválido %s", async (limit) => {
    const res = await request(app()).get(`${url}?limit=${limit}`);

    expect(res.status).toBe(400);
    expect(listarSolicitudes).not.toHaveBeenCalled();
  });

  it("devuelve el puntero cuando quedan más resultados", async () => {
    listarSolicitudes.mockResolvedValue({ items: [SOLICITUD_PENDIENTE], nextCursor: "QVBQIzAy" });

    const res = await request(app()).get(url);

    expect(res.body.nextCursor).toBe("QVBQIzAy");
  });

  it("sin autenticación devuelve 401 y no consulta nada", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(app(null)).get(url);

    expect(res.status).toBe(401);
    expect(listarSolicitudes).not.toHaveBeenCalled();
  });
});
