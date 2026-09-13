import { S3Client, HeadObjectCommand, PutObjectTaggingCommand, NotFound } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  MAX_VIDEO_BYTES,
  extensionForContentType,
  type UploadAuthorization,
  type VideoContentType,
} from "@educacion-estrella/shared";
import type { AppConfig } from "../../config/env.js";

/**
 * Caducidad de la autorizacion de subida.
 *
 * Una hora y no quince minutos: 200 MB a 2 Mbps tardan unos trece minutos, y
 * quince no dejan margen a una conexion lenta. La ventana mas larga es asumible
 * porque la politica autoriza UNA operacion concreta, no acceso al bucket.
 */
const CADUCIDAD_SEGUNDOS = 60 * 60;

/** Etiqueta con la que nace todo video. La limpieza de huerfanos depende de ella. */
const ETIQUETA_PENDIENTE =
  "<Tagging><TagSet><Tag><Key>status</Key><Value>pending</Value></Tag></TagSet></Tagging>";

/** Clave y valores de la etiqueta de estado del objeto. */
const ETIQUETA_CLAVE = "status";
const ETIQUETA_CONFIRMADO = "confirmed";

/**
 * Ruta del objeto en el almacenamiento.
 *
 * La construye el servidor con la identidad del solicitante, el identificador de
 * la solicitud y la extension derivada del TIPO DE CONTENIDO. El nombre del
 * archivo que eligio el usuario no interviene: asi no hay ruta que manipular,
 * en lugar de haber una ruta que vigilar.
 */
export function videoKeyFor(
  userId: string,
  applicationId: string,
  contentType: VideoContentType,
): string {
  return `videos/${userId}/${applicationId}.${extensionForContentType(contentType)}`;
}

/**
 * Autoriza EXACTAMENTE una subida.
 *
 * La politica fija la ruta, el tipo de contenido, el rango de tamano y la
 * etiqueta. Nada de eso puede alterarlo quien recibe la autorizacion: cambiar
 * un solo campo invalida la firma.
 *
 * Detalle del SDK que no es evidente: cada entrada de Fields se convierte
 * ademas en una condicion de coincidencia exacta, asi que repetirlas en
 * Conditions seria ruido. Solo el rango de tamano necesita declararse aparte.
 */
/** Resultado de mirar el objeto realmente almacenado. */
export type StoredVideo =
  | { estado: "ausente" }
  | { estado: "no-coincide"; motivo: string }
  | { estado: "correcto"; sizeBytes: number };

export type UploadAuthorizer = {
  authorizeUpload: (key: string, contentType: VideoContentType) => Promise<UploadAuthorization>;
  verifyStoredVideo: (key: string, contentType: VideoContentType) => Promise<StoredVideo>;
  markVideoAsConfirmed: (key: string) => Promise<void>;
};

/** Ver la nota del repositorio: la configuracion se inyecta y el cliente se
 *  crea una vez por fabrica, no por peticion. */
export function createUploadAuthorizer(
  config: Pick<AppConfig, "awsRegion" | "videosBucketName">,
): UploadAuthorizer {
  const s3 = new S3Client({ region: config.awsRegion });

  return { authorizeUpload, verifyStoredVideo, markVideoAsConfirmed };

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

  /**
   * Mira el objeto que de VERDAD quedo almacenado.
   *
   * Esta es la unica comprobacion del tamano real. La del navegador evita gastar
   * ancho de banda y la autorizacion firmada acota lo que S3 acepta, pero solo
   * aqui se observa lo que hay guardado.
   *
   * El tipo se comprueba tambien aunque la firma ya lo fije: llega en la misma
   * respuesta, no cuesta nada, y detectaria una autorizacion mal construida o un
   * cambio futuro que la aflojara.
   */
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
      // Que no este es un estado previsible del flujo, no un fallo inesperado:
      // el usuario puede avisar sin haber llegado a subir nada.
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

  /**
   * Saca el objeto del alcance de la limpieza de huerfanos.
   *
   * Esta operacion es la que sostiene toda esa maquinaria: si fallara en
   * silencio, la regla por etiqueta borraria el video de una solicitud enviada.
   */
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
