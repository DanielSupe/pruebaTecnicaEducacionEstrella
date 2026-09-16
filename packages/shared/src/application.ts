import { z } from "zod";
import { videoContentTypeSchema, uploadAuthorizationSchema } from "./video.js";

// Only two, and they model the lifecycle of the APPLICATION, not of the credit.
// An upload failure is not a state of its own: it is absence of progress.
export const APPLICATION_STATUSES = ["PENDING_VIDEO", "UNDER_REVIEW"] as const;

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES, {
  error: "Estado de solicitud no reconocido",
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

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
  // No business maximum: the brief does not set one. z.int() already caps at the
  // largest integer JavaScript represents exactly, which is the only real limit.
  amount: z
    .int({
      // Distinguishes absence from invalidity: telling someone who typed nothing
      // that it "must be a whole number" does not help them fix it.
      error: (issue) =>
        issue.input === undefined
          ? "El monto solicitado es obligatorio"
          : "El monto solicitado debe ser un número entero, sin decimales",
    })
    .positive("El monto solicitado debe ser mayor que cero"),
});

export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

// Strict on purpose: an unknown key is an explicit error, so a client cannot try
// to set `status` or `userId`, which the server controls.
export const createApplicationInputSchema = z.strictObject({
  ...applicationFieldsSchema.shape,
  // Content type only. The size is NOT declared: the signed policy caps it, and a
  // number sent by the client can lie.
  videoContentType: videoContentTypeSchema,
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

// Separate from the input: what the server controls is never part of what the
// client sends.
export const applicationSchema = z.object({
  ...applicationFieldsSchema.shape,
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  videoContentType: videoContentTypeSchema,
  // Known only after verifying the stored object.
  videoSizeBytes: z.int().positive().optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Application = z.infer<typeof applicationSchema>;

export const createApplicationResponseSchema = z.object({
  applicationId: z.string().min(1),
  status: applicationStatusSchema,
  upload: uploadAuthorizationSchema,
});

export type CreateApplicationResponse = z.infer<typeof createApplicationResponseSchema>;

// Coercion IS used here, unlike in the request body: a query string can only
// carry text, so there is nothing to relax. In a JSON body, accepting "5000"
// where a number is expected would weaken the validation.
export const listApplicationsQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "El límite debe ser un número" })
    .int("El límite debe ser un número entero")
    .min(1, "El límite debe ser al menos 1")
    .max(50, "El límite no puede superar 50")
    .default(20),

  // Opaque on purpose: the client returns it untouched.
  cursor: z.string().min(1).optional(),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const paginatedApplicationsSchema = z.object({
  items: z.array(applicationSchema),
  nextCursor: z.string().optional(),
});

export type PaginatedApplications = z.infer<typeof paginatedApplicationsSchema>;
