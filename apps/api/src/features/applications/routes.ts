import { Router } from "express";
import type { RequestHandler } from "express";
import {
  createApplicationInputSchema,
  listApplicationsQuerySchema,
} from "@educacion-estrella/shared";
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from "../../errors.js";
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

  /**
   * Solicitudes del solicitante autenticado.
   *
   * No tener ninguna es un estado normal de quien acaba de registrarse, asi que
   * se responde con una lista vacia y exito: tratarlo como error obligaria al
   * navegador a distinguir "vacio" de "fallo".
   */
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

        // La identidad sale del token. Si la peticion trae un userId, se ignora:
        // ni siquiera llega hasta aqui.
        const { items, nextCursor } = await repositorio.listApplications(userId, parametros.data);

        res.json({ items: items.map(sinClaveInterna), nextCursor });
      } catch (error) {
        next(error);
      }
    })();
  });

  /**
   * Aviso de que la subida termino.
   *
   * Existe porque la API no se entera: el video va del navegador al
   * almacenamiento sin pasarle por delante.
   *
   * El ORDEN de las tres operaciones no es indiferente. Verificar, reetiquetar y
   * despues actualizar. Si se actualizara antes de reetiquetar y fallara entre
   * medias, quedaria una solicitud enviada con su video aun marcado como
   * pendiente, y la limpieza automatica lo borraria a los siete dias. En este
   * orden, un fallo intermedio deja la solicitud pendiente con el video a salvo
   * y se repara al reintentar.
   */
  router.post("/applications/:id/complete-upload", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const solicitud = await buscarPropia(userId, req.params.id);

        // Avisar dos veces produce el mismo resultado que avisar una: pasa con
        // una red poco fiable, y sobre todo cuando alguien cierra la pestana
        // tras subir y vuelve mas tarde.
        if (solicitud.status === "UNDER_REVIEW") {
          res.json(sinClaveInterna(solicitud));
          return;
        }

        const video = await subidas.verifyStoredVideo(
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

        await subidas.markVideoAsConfirmed(solicitud.videoKey);

        const actualizada = await repositorio.markAsSubmitted(
          userId,
          solicitud.applicationId,
          video.sizeBytes,
        );

        // null significa que la condicion no se cumplio, es decir que otra
        // peticion la envio mientras tanto. Tampoco es un error.
        res.json(sinClaveInterna(actualizada ?? { ...solicitud, status: "UNDER_REVIEW" }));
      } catch (error) {
        next(error);
      }
    })();
  });

  /**
   * Nueva autorizacion de subida para reintentar.
   *
   * La ruta del objeto es la MISMA, asi que reintentar sobreescribe en lugar de
   * ir dejando huerfanos por cada intento fallido.
   */
  router.post("/applications/:id/video-url", authenticate, (req, res, next) => {
    void (async () => {
      try {
        const userId = req.user?.userId;
        if (!userId) throw new UnauthorizedError();

        const solicitud = await buscarPropia(userId, req.params.id);

        if (solicitud.status !== "PENDING_VIDEO") {
          throw new ConflictError("Esta solicitud ya fue enviada y su video está confirmado.");
        }

        const upload = await subidas.authorizeUpload(
          solicitud.videoKey,
          solicitud.videoContentType,
        );

        res.json({ applicationId: solicitud.applicationId, status: solicitud.status, upload });
      } catch (error) {
        next(error);
      }
    })();
  });

  /**
   * Busca una solicitud del solicitante autenticado.
   *
   * Una solicitud ajena se comporta como inexistente: distinguir "no existe" de
   * "no es tuya" permitiria averiguar que identificadores estan en uso. La
   * identidad forma parte de la clave, asi que ni siquiera hay que acordarse de
   * comprobar el propietario.
   */
  async function buscarPropia(userId: string, parametro: string | string[] | undefined) {
    // Express permite parametros repetidos, que llegarian como array. Un
    // identificador no lo es: cualquier otra forma se trata como inexistente.
    const applicationId = typeof parametro === "string" ? parametro : undefined;
    if (!applicationId) throw new NotFoundError("La solicitud no existe.");

    const solicitud = await repositorio.getApplication(userId, applicationId);
    if (!solicitud) throw new NotFoundError("La solicitud no existe.");

    return solicitud;
  }

  return router;
}

/** La ruta del objeto es detalle interno: no se expone al cliente. */
function sinClaveInterna<T extends { videoKey?: string }>(solicitud: T) {
  const { videoKey: _interna, ...publica } = solicitud;
  return publica;
}
