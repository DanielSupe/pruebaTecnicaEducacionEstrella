import { Router } from "express";
import type { RequestHandler } from "express";
import { createApplicationInputSchema } from "@educacion-estrella/shared";
import { BadRequestError, UnauthorizedError } from "../../errors.js";
import type { ApplicationsRepository } from "./repository.js";
import { type UploadAuthorizer, videoKeyFor } from "./uploads.js";

export function createApplicationsRouter(
  authenticate: RequestHandler,
  repositorio: ApplicationsRepository,
  subidas: UploadAuthorizer,
): Router {
  const router = Router();

  router.post("/applications", authenticate, (req, res, next) => {
    void (async () => {
      try {
        // El identificador sale del token verificado. Nunca del cuerpo: aceptarlo
        // de ahi permitiria registrar solicitudes en nombre de cualquiera.
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        // Se valida en el servidor AUNQUE el navegador ya lo haya hecho: el
        // cliente no es una frontera de confianza.
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

        const upload = await subidas.authorizeUpload(solicitud.videoKey, datos.videoContentType);

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

  return router;
}
