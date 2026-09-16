import { z } from "zod";

// Three places must agree on this exact value: the browser check before
// uploading, the content-length-range of the signed upload policy, and the
// verification of the stored object. Divergence causes edge failures that are
// very hard to diagnose.
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export const MAX_VIDEO_MB = MAX_VIDEO_BYTES / (1024 * 1024);

// The keys are the single source of truth for the accepted types: the schema is
// derived from them instead of repeating the list.
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

// Browser-only, and it does NOT travel to the API: a size declared by a client
// proves nothing. The real limit is the signed upload policy, which the client
// cannot alter.
export const videoFileSchema = z.strictObject({
  contentType: videoContentTypeSchema,
  sizeBytes: z
    .int({ error: "El tamaño del video debe ser un número entero de bytes" })
    .positive("El video no puede estar vacío")
    .max(MAX_VIDEO_BYTES, `El video no puede superar los ${String(MAX_VIDEO_MB)} MB`),
});

export type VideoFile = z.infer<typeof videoFileSchema>;

// Derived from the content type, never from the user-supplied file name: that
// name would end up inside the object path. A closed list removes the problem
// instead of sanitising it.
export function extensionForContentType(contentType: VideoContentType): VideoExtension {
  return VIDEO_CONTENT_TYPES[contentType];
}

export const uploadAuthorizationSchema = z.object({
  url: z.url(),
  fields: z.record(z.string(), z.string()),
});

export type UploadAuthorization = z.infer<typeof uploadAuthorizationSchema>;

// Expiry travels as an ABSOLUTE instant, not as "N seconds left": the client
// does not know how long the response took to arrive, so a relative duration
// would be read from a different moment than the server intended.
export const videoLinkSchema = z.object({
  url: z.url(),
  expiresAt: z.iso.datetime(),
});

export type VideoLink = z.infer<typeof videoLinkSchema>;
