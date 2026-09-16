import type { Request, RequestHandler, Response } from "express";
import {
  createApplicationInputSchema,
  listApplicationsQuerySchema,
} from "@educacion-estrella/shared";
import { BadRequestError, UnauthorizedError } from "../../errors.js";
import type { ApplicationsService } from "./applications.service.js";

export type ApplicationsController = {
  create: RequestHandler;
  list: RequestHandler;
  completeUpload: RequestHandler;
  getVideoLink: RequestHandler;
  renewUpload: RequestHandler;
};

export function createApplicationsController(
  servicio: ApplicationsService,
): ApplicationsController {
  return { create, list, completeUpload, getVideoLink, renewUpload };

  async function create(req: Request, res: Response) {
    const userId = identidad(req);

    // Validated server-side EVEN THOUGH the browser already did: the client is
    // not a trust boundary.
    const validado = createApplicationInputSchema.safeParse(req.body);

    if (!validado.success) {
      const primero = validado.error.issues[0];
      throw new BadRequestError(
        primero ? `${primero.path.join(".")}: ${primero.message}` : "Datos inválidos.",
      );
    }

    res.status(201).json(await servicio.create(userId, validado.data));
  }

  async function list(req: Request, res: Response) {
    const userId = identidad(req);

    const parametros = listApplicationsQuerySchema.safeParse(req.query);

    if (!parametros.success) {
      const primero = parametros.error.issues[0];
      throw new BadRequestError(primero?.message ?? "Parámetros de consulta inválidos.");
    }

    const { items, nextCursor } = await servicio.list(userId, parametros.data);

    res.json({ items: items.map(sinClaveInterna), nextCursor });
  }

  async function completeUpload(req: Request, res: Response) {
    const solicitud = await servicio.completeUpload(identidad(req), identificador(req));
    res.json(sinClaveInterna(solicitud));
  }

  async function getVideoLink(req: Request, res: Response) {
    // The link carries the location signed inside, which is not the same as
    // publishing it as data.
    res.json(await servicio.getVideoLink(identidad(req), identificador(req)));
  }

  async function renewUpload(req: Request, res: Response) {
    res.json(await servicio.renewUpload(identidad(req), identificador(req)));
  }
}

// From the verified token, never from the body: accepting it there would let
// anyone file applications in someone else's name.
function identidad(req: Request): string {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();
  return userId;
}

// Express allows repeated params, which arrive as an array. An id is not one, so
// any other shape is handed over as absent.
function identificador(req: Request): string | undefined {
  return typeof req.params.id === "string" ? req.params.id : undefined;
}

// The object path is internal detail and is never exposed to the client.
function sinClaveInterna<T extends { videoKey?: string }>(solicitud: T) {
  const { videoKey: _interna, ...publica } = solicitud;
  return publica;
}
