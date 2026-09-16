import {
  S3Client,
  HeadObjectCommand,
  PutObjectTaggingCommand,
  GetObjectCommand,
  NotFound,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  MAX_VIDEO_BYTES,
  extensionForContentType,
  type UploadAuthorization,
  type VideoContentType,
  type VideoLink,
} from "@educacion-estrella/shared";
import type { AppConfig } from "../../config/env.js";

// One hour, not fifteen minutes: 200 MB over a slow connection takes longer than
// that. The wider window is acceptable because the policy authorises ONE concrete
// operation, not access to the bucket.
const CADUCIDAD_SEGUNDOS = 60 * 60;

// Fifteen minutes, not five. A <video> element does not download the file in one
// go: it requests ranges while playing and on every seek, and each request
// presents the signature again. A short window breaks playback mid-seek with an
// error the user cannot interpret.
const CADUCIDAD_LECTURA_SEGUNDOS = 15 * 60;

// Every video is born with this tag. The orphan cleanup rule depends on it.
const ETIQUETA_PENDIENTE =
  "<Tagging><TagSet><Tag><Key>status</Key><Value>pending</Value></Tag></TagSet></Tagging>";

const ETIQUETA_CLAVE = "status";
const ETIQUETA_CONFIRMADO = "confirmed";

// Built by the server. The user-chosen file name never takes part: that way there
// is no path to manipulate, rather than a path to guard.
export function videoKeyFor(
  userId: string,
  applicationId: string,
  contentType: VideoContentType,
): string {
  return `videos/${userId}/${applicationId}.${extensionForContentType(contentType)}`;
}

export type StoredVideo =
  | { estado: "ausente" }
  | { estado: "no-coincide"; motivo: string }
  | { estado: "correcto"; sizeBytes: number };

export type VideoStorage = {
  authorizeUpload: (key: string, contentType: VideoContentType) => Promise<UploadAuthorization>;
  authorizeView: (key: string) => Promise<VideoLink>;
  verifyStoredVideo: (key: string, contentType: VideoContentType) => Promise<StoredVideo>;
  markVideoAsConfirmed: (key: string) => Promise<void>;
};

export function createVideoStorage(
  config: Pick<AppConfig, "awsRegion" | "videosBucketName">,
): VideoStorage {
  const s3 = new S3Client({ region: config.awsRegion });

  return { authorizeUpload, authorizeView, verifyStoredVideo, markVideoAsConfirmed };

  // Non-obvious SDK detail: every Fields entry also becomes an exact-match
  // condition, so repeating them under Conditions would be noise. Only the size
  // range needs declaring separately.
  async function authorizeUpload(
    key: string,
    contentType: VideoContentType,
  ): Promise<UploadAuthorization> {
    const { url, fields } = await createPresignedPost(s3, {
      Bucket: config.videosBucketName,
      Key: key,
      Expires: CADUCIDAD_SEGUNDOS,
      Fields: {
        "Content-Type": contentType,
        tagging: ETIQUETA_PENDIENTE,
      },
      Conditions: [["content-length-range", 1, MAX_VIDEO_BYTES]],
    });

    return { url, fields };
  }

  // The resulting URL carries the signature inside, so it is a credential: it is
  // never logged nor stored. Writing it to a log would turn a fifteen-minute
  // credential into a permanent one.
  async function authorizeView(key: string): Promise<VideoLink> {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: config.videosBucketName, Key: key }),
      { expiresIn: CADUCIDAD_LECTURA_SEGUNDOS },
    );

    const expiresAt = new Date(Date.now() + CADUCIDAD_LECTURA_SEGUNDOS * 1000).toISOString();

    return { url, expiresAt };
  }

  // The only check of the real size. The browser check saves bandwidth and the
  // signed policy caps what S3 accepts, but only here is the stored object seen.
  async function verifyStoredVideo(
    key: string,
    contentType: VideoContentType,
  ): Promise<StoredVideo> {
    let respuesta;

    try {
      respuesta = await s3.send(
        new HeadObjectCommand({ Bucket: config.videosBucketName, Key: key }),
      );
    } catch (error) {
      // Absence is an expected state of the flow, not an unexpected failure.
      if (error instanceof NotFound) return { estado: "ausente" };
      throw error;
    }

    const sizeBytes = respuesta.ContentLength ?? 0;

    if (sizeBytes <= 0 || sizeBytes > MAX_VIDEO_BYTES) {
      return { estado: "no-coincide", motivo: "el tamaño del archivo no es válido" };
    }

    if (respuesta.ContentType !== contentType) {
      return { estado: "no-coincide", motivo: "el tipo del archivo no es el esperado" };
    }

    return { estado: "correcto", sizeBytes };
  }

  // Moves the object out of reach of the orphan cleanup rule. If this failed
  // silently, that rule would delete the video of a submitted application.
  async function markVideoAsConfirmed(key: string): Promise<void> {
    await s3.send(
      new PutObjectTaggingCommand({
        Bucket: config.videosBucketName,
        Key: key,
        Tagging: { TagSet: [{ Key: ETIQUETA_CLAVE, Value: ETIQUETA_CONFIRMADO }] },
      }),
    );
  }
}
