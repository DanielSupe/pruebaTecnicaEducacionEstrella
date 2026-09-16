import { Router } from "express";
import type { RequestHandler } from "express";
import {
  createApplicationInputSchema,
  listApplicationsQuerySchema,
} from "@educacion-estrella/shared";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../../errors.js";
import type { ApplicationsRepository } from "./repository.js";
import { type VideoStorage, videoKeyFor } from "./uploads.js";

export function createApplicationsRouter(
  authenticate: RequestHandler,
  repositorio: ApplicationsRepository,
  almacenamiento: VideoStorage,
): Router {
  const router = Router();

  router.post("/applications", authenticate, (req, res, next) => {
    void (async () => {
      try {
        // From the verified token, never from the body: accepting it there would
        // let anyone file applications in someone else's name.
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        // Validated server-side EVEN THOUGH the browser already did: the client
        // is not a trust boundary.
        const validado = createApplicationInputSchema.safeParse(req.body);

        if (!validado.success) {
          const primero = validado.error.issues[0];
          throw new BadRequestError(
            primero ? `${primero.path.join(".")}: ${primero.message}` : "Datos inválidos.",
          );
        }

        const datos = validado.data;

        const solicitud = await repositorio.createApplication(
          userId,
          datos,
          (applicationId: string) => videoKeyFor(userId, applicationId, datos.videoContentType),
        );

        const upload = await almacenamiento.authorizeUpload(
          solicitud.videoKey,
          datos.videoContentType,
        );

        res.status(201).json({
          applicationId: solicitud.applicationId,
          status: "PENDING_VIDEO",
          upload,
        });
      } catch (error) {
        next(error);
      }
    })();
  });

  router.get("/applications", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const parametros = listApplicationsQuerySchema.safeParse(req.query);

        if (!parametros.success) {
          const primero = parametros.error.issues[0];
          throw new BadRequestError(primero?.message ?? "Parámetros de consulta inválidos.");
        }

        const { items, nextCursor } = await repositorio.listApplications(userId, parametros.data);

        res.json({ items: items.map(sinClaveInterna), nextCursor });
      } catch (error) {
        next(error);
      }
    })();
  });

  // Exists because the API never sees the upload: the video goes straight to
  // storage.
  //
  // The ORDER of the three operations matters: verify, retag, then update. Updating
  // before retagging would leave a submitted application whose video is still
  // marked pending, and the cleanup rule would delete it days later. In this order,
  // a failure in between leaves the application pending with the video safe.
  router.post("/applications/:id/complete-upload", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const solicitud = await buscarPropia(userId, req.params.id);

        // Notifying twice yields the same result as notifying once: it happens on
        // a flaky network, and when someone closes the tab after uploading.
        if (solicitud.status === "UNDER_REVIEW") {
          res.json(sinClaveInterna(solicitud));
          return;
        }

        const video = await almacenamiento.verifyStoredVideo(
          solicitud.videoKey,
          solicitud.videoContentType,
        );

        if (video.estado === "ausente") {
          throw new ConflictError(
            "No encontramos el video de esta solicitud. Vuelve a subirlo e inténtalo de nuevo.",
          );
        }

        if (video.estado === "no-coincide") {
          throw new ConflictError(`No pudimos validar el video: ${video.motivo}.`);
        }

        await almacenamiento.markVideoAsConfirmed(solicitud.videoKey);

        const actualizada = await repositorio.markAsSubmitted(
          userId,
          solicitud.applicationId,
          video.sizeBytes,
        );

        // null means another request submitted it meanwhile. Not an error either.
        res.json(sinClaveInterna(actualizada ?? { ...solicitud, status: "UNDER_REVIEW" }));
      } catch (error) {
        next(error);
      }
    })();
  });

  router.get("/applications/:id/video-url", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const solicitud = await buscarPropia(userId, req.params.id);

        // A pending application may have no object at all. Signing towards
        // something that may not exist would return an opaque storage error.
        if (solicitud.status !== "UNDER_REVIEW") {
          throw new ConflictError(
            "Esta solicitud todavía no tiene un video confirmado que puedas ver.",
          );
        }

        const enlace = await almacenamiento.authorizeView(solicitud.videoKey);

        // The link carries the location signed inside, which is not the same as
        // publishing it as data.
        res.json(enlace);
      } catch (error) {
        next(error);
      }
    })();
  });

  // The object path is the SAME, so retrying overwrites instead of leaving an
  // orphan per failed attempt.
  router.post("/applications/:id/video-url", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const solicitud = await buscarPropia(userId, req.params.id);

        if (solicitud.status !== "PENDING_VIDEO") {
          throw new ConflictError("Esta solicitud ya fue enviada y su video está confirmado.");
        }

        const upload = await almacenamiento.authorizeUpload(
          solicitud.videoKey,
          solicitud.videoContentType,
        );

        res.json({ applicationId: solicitud.applicationId, status: solicitud.status, upload });
      } catch (error) {
        next(error);
      }
    })();
  });

  // Someone else's application behaves as non-existent: telling "does not exist"
  // apart from "not yours" would reveal which ids are in use.
  async function buscarPropia(userId: string, parametro: string | string[] | undefined) {
    // Express allows repeated params, which arrive as an array. An id is not one.
    const applicationId = typeof parametro === "string" ? parametro : undefined;
    if (!applicationId) throw new NotFoundError("La solicitud no existe.");

    const solicitud = await repositorio.getApplication(userId, applicationId);
    if (!solicitud) throw new NotFoundError("La solicitud no existe.");

    return solicitud;
  }

  return router;
}

// The object path is internal detail and is never exposed to the client.
function sinClaveInterna<T extends { videoKey?: string }>(solicitud: T) {
  const { videoKey: _interna, ...publica } = solicitud;
  return publica;
}
