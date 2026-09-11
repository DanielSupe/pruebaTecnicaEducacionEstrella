import { z } from "zod";

/**
 * Tamaño máximo del video de entrevista: 200 MiB.
 *
 * Se escribe como producto y no como literal para que se lea de dónde sale el número.
 * Este mismo valor lo usan tres puntos del sistema y los tres tienen que coincidir
 * exactamente: la validación en el navegador antes de subir, el `content-length-range`
 * de la política de subida firmada, y la verificación del objeto ya almacenado. Si
 * divergen, aparecen fallos en el borde muy difíciles de diagnosticar.
 */
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

/** El mismo límite en MB, solo para componer mensajes dirigidos al usuario. */
export const MAX_VIDEO_MB = MAX_VIDEO_BYTES / (1024 * 1024);

/**
 * Formatos aceptados y la extensión que les corresponde en el almacenamiento.
 * Las claves son la única fuente de verdad de los tipos permitidos: el esquema
 * se deriva de ellas en lugar de repetir la lista.
 */
export const VIDEO_CONTENT_TYPES = {
  "video/mp4": "mp4",
  "video/webm": "webm",
} as const;

export type VideoContentType = keyof typeof VIDEO_CONTENT_TYPES;
export type VideoExtension = (typeof VIDEO_CONTENT_TYPES)[VideoContentType];

const VIDEO_CONTENT_TYPE_VALUES = Object.keys(VIDEO_CONTENT_TYPES) as [
  VideoContentType,
  ...VideoContentType[],
];

export const videoContentTypeSchema = z.enum(VIDEO_CONTENT_TYPE_VALUES, {
  error: "El video debe estar en formato .mp4 o .webm",
});

export const videoMetadataSchema = z.strictObject({
  contentType: videoContentTypeSchema,
  sizeBytes: z
    .int({ error: "El tamaño del video debe ser un número entero de bytes" })
    .positive("El video no puede estar vacío")
    .max(MAX_VIDEO_BYTES, `El video no puede superar los ${String(MAX_VIDEO_MB)} MB`),
});

export type VideoMetadata = z.infer<typeof videoMetadataSchema>;

/**
 * Extensión con la que se almacena un video.
 *
 * Se deriva del tipo de contenido, nunca del nombre de archivo que aporta el usuario:
 * ese nombre acabaría formando parte de la ruta del objeto en el almacenamiento, y
 * derivarla de una lista cerrada elimina el problema en vez de intentar sanearlo.
 */
export function extensionForContentType(contentType: VideoContentType): VideoExtension {
  return VIDEO_CONTENT_TYPES[contentType];
}
