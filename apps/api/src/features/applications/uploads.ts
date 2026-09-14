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

/**
 * Caducidad de la autorizacion de subida.
 *
 * Una hora y no quince minutos: 200 MB a 2 Mbps tardan unos trece minutos, y
 * quince no dejan margen a una conexion lenta. La ventana mas larga es asumible
 * porque la politica autoriza UNA operacion concreta, no acceso al bucket.
 */
const CADUCIDAD_SEGUNDOS = 60 * 60;

/**
 * Caducidad del enlace de lectura.
 *
 * Quince minutos y no cinco, que es lo que pareceria mas prudente. Un elemento
 * <video> no descarga el archivo de una vez: pide trozos conforme se reproduce
 * y cada vez que alguien adelanta, y cada peticion vuelve a presentar la firma.
 * Con una ventana corta, adelantar pasado ese rato rompe la reproduccion con un
 * error que el usuario no puede interpretar.
 *
 * Mas corta que la de subida porque leer no necesita esa ventana: subir 200 MB
 * por una conexion lenta lleva minutos, abrir un video no.
 */
const CADUCIDAD_LECTURA_SEGUNDOS = 15 * 60;

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

/** Resultado de mirar el objeto realmente almacenado. */
export type StoredVideo =
  | { estado: "ausente" }
  | { estado: "no-coincide"; motivo: string }
  | { estado: "correcto"; sizeBytes: number };

/**
 * Operaciones sobre el video almacenado.
 *
 * Se llamaba UploadAuthorizer mientras solo autorizaba subidas. Al ganar la
 * lectura, ese nombre pasaba a describir mal lo que hace: un nombre que miente
 * cuesta mas que un renombrado de cinco lineas.
 */
export type VideoStorage = {
  authorizeUpload: (key: string, contentType: VideoContentType) => Promise<UploadAuthorization>;
  authorizeView: (key: string) => Promise<VideoLink>;
  verifyStoredVideo: (key: string, contentType: VideoContentType) => Promise<StoredVideo>;
  markVideoAsConfirmed: (key: string) => Promise<void>;
};

/** Ver la nota del repositorio: la configuracion se inyecta y el cliente se
 *  crea una vez por fabrica, no por peticion. */
export function createVideoStorage(
  config: Pick<AppConfig, "awsRegion" | "videosBucketName">,
): VideoStorage {
  const s3 = new S3Client({ region: config.awsRegion });

  return { authorizeUpload, authorizeView, verifyStoredVideo, markVideoAsConfirmed };

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
   * Autoriza LEER un objeto concreto, durante un rato.
   *
   * El almacenamiento es privado y no se abre para esto: la firma es lo que
   * concede el acceso, y solo a esta ruta y solo hasta que caduque.
   *
   * La URL resultante lleva la firma dentro, asi que es una credencial: no se
   * registra en ningun log ni se guarda en la tabla. Escribirla en un log
   * convertiria una credencial de quince minutos en una permanente.
   *
   * El instante de caducidad se calcula aqui, en el servidor, para que el
   * cliente no tenga que suponer cuando empezo a contar.
   */
  async function authorizeView(key: string): Promise<VideoLink> {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: config.videosBucketName, Key: key }),
      { expiresIn: CADUCIDAD_LECTURA_SEGUNDOS },
    );

    const expiresAt = new Date(Date.now() + CADUCIDAD_LECTURA_SEGUNDOS * 1000).toISOString();

    return { url, expiresAt };
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
