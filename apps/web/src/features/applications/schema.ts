import { z } from "zod";
import { applicationFieldsSchema, videoFileSchema, MAX_VIDEO_MB } from "@educacion-estrella/shared";

// Fields reuse the shared schema: the SAME rules the server applies, not a copy to
// keep in sync. The file is validated here to reject it before spending bandwidth,
// which does not replace the server check.
export const applicationFormSchema = applicationFieldsSchema.extend({
  video: z
    .file({ error: "Selecciona el video de la entrevista" })
    // superRefine, not refine, so the message the user sees is the shared
    // schema's rather than a generic one written here.
    .superRefine((archivo, ctx) => {
      const resultado = videoFileSchema.safeParse({
        contentType: archivo.type,
        sizeBytes: archivo.size,
      });

      if (!resultado.success) {
        ctx.addIssue({
          code: "custom",
          message: resultado.error.issues[0]?.message ?? "El video no es válido",
        });
      }
    }),
});

export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

// Converted BEFORE validating rather than coercing inside the schema: that same
// schema runs on the server, where accepting text would weaken the validation.
export function montoATexto(valor: string): number | string | undefined {
  const limpio = valor.trim();

  // Empty maps to absence, so the schema says "required" instead of complaining
  // about the format of something nobody typed.
  if (limpio === "") return undefined;

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : limpio;
}

/** Human-readable size shown next to the chosen file. */
export function tamanoLegible(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export { MAX_VIDEO_MB };
