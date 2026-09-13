import { S3Client } from "@aws-sdk/client-s3";
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
export type UploadAuthorizer = {
  authorizeUpload: (key: string, contentType: VideoContentType) => Promise<UploadAuthorization>;
};

/** Ver la nota del repositorio: la configuracion se inyecta y el cliente se
 *  crea una vez por fabrica, no por peticion. */
export function createUploadAuthorizer(
  config: Pick<AppConfig, "awsRegion" | "videosBucketName">,
): UploadAuthorizer {
  const s3 = new S3Client({ region: config.awsRegion });

  return { authorizeUpload };

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
}
