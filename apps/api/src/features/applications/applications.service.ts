import type {
  CreateApplicationInput,
  ListApplicationsQuery,
  UploadAuthorization,
  VideoLink,
} from "@educacion-estrella/shared";
import { ConflictError, NotFoundError } from "../../errors.js";
import type { ApplicationsRepository, StoredApplication } from "./applications.repository.js";
import { type VideoStorage, videoKeyFor } from "./applications.storage.js";

export type CreatedApplication = {
  applicationId: string;
  status: "PENDING_VIDEO";
  upload: UploadAuthorization;
};

export type RenewedUpload = {
  applicationId: string;
  status: StoredApplication["status"];
  upload: UploadAuthorization;
};

export type ApplicationsService = {
  create: (userId: string, datos: CreateApplicationInput) => Promise<CreatedApplication>;
  list: (
    userId: string,
    consulta: ListApplicationsQuery,
  ) => Promise<{ items: StoredApplication[]; nextCursor?: string }>;
  completeUpload: (userId: string, applicationId?: string) => Promise<StoredApplication>;
  getVideoLink: (userId: string, applicationId?: string) => Promise<VideoLink>;
  renewUpload: (userId: string, applicationId?: string) => Promise<RenewedUpload>;
};

export function createApplicationsService(
  repositorio: ApplicationsRepository,
  almacenamiento: VideoStorage,
): ApplicationsService {
  return { create, list, completeUpload, getVideoLink, renewUpload };

  async function create(
    userId: string,
    datos: CreateApplicationInput,
  ): Promise<CreatedApplication> {
    const solicitud = await repositorio.createApplication(userId, datos, (applicationId: string) =>
      videoKeyFor(userId, applicationId, datos.videoContentType),
    );

    const upload = await almacenamiento.authorizeUpload(solicitud.videoKey, datos.videoContentType);

    return { applicationId: solicitud.applicationId, status: "PENDING_VIDEO", upload };
  }

  async function list(userId: string, consulta: ListApplicationsQuery) {
    return repositorio.listApplications(userId, consulta);
  }

  // The ORDER of these operations matters: verify, retag, then update. Updating
  // before retagging would leave a submitted application whose video is still
  // marked pending, and the cleanup rule would delete it days later. In this order,
  // a failure in between leaves the application pending with the video safe.
  async function completeUpload(userId: string, applicationId?: string) {
    const solicitud = await findOwn(userId, applicationId);

    // Notifying twice yields the same result as notifying once: it happens on a
    // flaky network, and when someone closes the tab after uploading.
    if (solicitud.status === "UNDER_REVIEW") return solicitud;

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
    return actualizada ?? { ...solicitud, status: "UNDER_REVIEW" as const };
  }

  async function getVideoLink(userId: string, applicationId?: string): Promise<VideoLink> {
    const solicitud = await findOwn(userId, applicationId);

    // A pending application may have no object at all. Signing towards something
    // that may not exist would return an opaque storage error.
    if (solicitud.status !== "UNDER_REVIEW") {
      throw new ConflictError("Esta solicitud todavía no tiene un video confirmado que puedas ver.");
    }

    return almacenamiento.authorizeView(solicitud.videoKey);
  }

  // The object path is the SAME, so retrying overwrites instead of leaving an
  // orphan per failed attempt.
  async function renewUpload(userId: string, applicationId?: string): Promise<RenewedUpload> {
    const solicitud = await findOwn(userId, applicationId);

    if (solicitud.status !== "PENDING_VIDEO") {
      throw new ConflictError("Esta solicitud ya fue enviada y su video está confirmado.");
    }

    const upload = await almacenamiento.authorizeUpload(
      solicitud.videoKey,
      solicitud.videoContentType,
    );

    return { applicationId: solicitud.applicationId, status: solicitud.status, upload };
  }

  // Someone else's application behaves as non-existent: telling "does not exist"
  // apart from "not yours" would reveal which ids are in use. A missing id is
  // treated the same way, so a malformed request learns nothing either.
  async function findOwn(userId: string, applicationId?: string): Promise<StoredApplication> {
    if (!applicationId) throw new NotFoundError("La solicitud no existe.");

    const solicitud = await repositorio.getApplication(userId, applicationId);
    if (!solicitud) throw new NotFoundError("La solicitud no existe.");

    return solicitud;
  }
}
