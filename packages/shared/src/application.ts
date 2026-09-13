import { z } from "zod";
import { videoContentTypeSchema, uploadAuthorizationSchema } from "./video.js";

/**
 * Estados de una solicitud.
 *
 * Solo dos, y modelan el ciclo de vida de la *solicitud*, no el del crédito: la
 * aprobación o el rechazo quedan fuera de alcance por la sección 6 del enunciado.
 * Un fallo de subida no es un estado propio, es ausencia de progreso: la solicitud
 * sigue en PENDING_VIDEO y el usuario reintenta.
 */
export const APPLICATION_STATUSES = ["PENDING_VIDEO", "UNDER_REVIEW"] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES, {
  error: "Estado de solicitud no reconocido",
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

/** Datos que aporta el solicitante en el formulario. */
export const applicationFieldsSchema = z.object({
  fullName: z
    .string({ error: "El nombre completo es obligatorio" })
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(100, "El nombre completo no puede superar los 100 caracteres"),
  idDocument: z
    .string({ error: "El documento de identidad es obligatorio" })
    .trim()
    .regex(/^\d{5,20}$/, "El documento de identidad debe tener entre 5 y 20 dígitos, sin letras"),
  institution: z
    .string({ error: "La institución educativa es obligatoria" })
    .trim()
    .min(2, "La institución educativa debe tener al menos 2 caracteres")
    .max(120, "La institución educativa no puede superar los 120 caracteres"),
  program: z
    .string({ error: "El programa académico es obligatorio" })
    .trim()
    .min(2, "El programa académico debe tener al menos 2 caracteres")
    .max(120, "El programa académico no puede superar los 120 caracteres"),
  // Entero positivo sin máximo de negocio: el enunciado no fija uno y no se inventa.
  // z.int() ya acota al mayor entero que JavaScript representa con exactitud, que es
  // el único tope real: más allá, el valor no sobreviviría intacto al almacenamiento.
  amount: z
    .int({ error: "El monto solicitado debe ser un número entero, sin decimales" })
    .positive("El monto solicitado debe ser mayor que cero"),
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

/**
 * Cuerpo de la petición que crea una solicitud.
 *
 * Es estricto a propósito: una clave desconocida es un error explícito y no algo que
 * se descarte en silencio, para que un cliente no pueda intentar fijar `status` o
 * `userId`, que los controla el servidor.
 */
export const createApplicationInputSchema = z.strictObject({
  ...applicationFieldsSchema.shape,
  // Solo el tipo de contenido: hace falta para construir la ruta del objeto y
  // para fijarlo en la politica firmada. El tamano no se declara — lo acota esa
  // misma politica, y un numero que envia el cliente puede mentir.
  videoContentType: videoContentTypeSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

/**
 * Solicitud tal y como la devuelve la API.
 *
 * Separada de la entrada: lo que el servidor controla (identificador, estado, fechas y
 * la referencia al video almacenado) nunca forma parte de lo que el cliente envía.
 */
export const applicationSchema = z.object({
  ...applicationFieldsSchema.shape,
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  videoContentType: videoContentTypeSchema,
  // Opcional: el tamano real se conoce al verificar el objeto almacenado, en la
  // confirmacion. Antes de eso no hay nada que registrar.
  videoSizeBytes: z.int().positive().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Application = z.infer<typeof applicationSchema>;

/** Respuesta de la creacion de una solicitud. */
export const createApplicationResponseSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  upload: uploadAuthorizationSchema,
});

export type CreateApplicationResponse = z.infer<typeof createApplicationResponseSchema>;
