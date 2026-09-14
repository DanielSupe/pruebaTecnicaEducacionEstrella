import { z } from "zod";
import { applicationFieldsSchema, videoFileSchema, MAX_VIDEO_MB } from "@educacion-estrella/shared";

/**
 * Formulario de solicitud.
 *
 * Los campos reutilizan el esquema compartido: las MISMAS reglas que aplica el
 * servidor, no una copia que haya que mantener sincronizada.
 *
 * El archivo se valida aqui, en el navegador, para rechazarlo antes de gastar
 * ancho de banda. Eso no sustituye a la comprobacion del servidor: el limite real
 * lo impone la autorizacion firmada, que el cliente no puede alterar.
 */
export const applicationFormSchema = applicationFieldsSchema.extend({
  video: z
    .file({ error: "Selecciona el video de la entrevista" })
    // superRefine y no refine: asi el mensaje que ve el usuario es el del
    // esquema compartido ("no puede superar los 200 MB", "debe estar en formato
    // .mp4 o .webm") en lugar de uno generico escrito aqui.
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

/**
 * El monto llega del campo como texto.
 *
 * Se convierte ANTES de validar, en lugar de usar coercion dentro del esquema:
 * ese mismo esquema corre en el servidor, donde aceptar texto relajaria la
 * validacion que precisamente se evalua.
 */
export function montoATexto(valor: string): number | string | undefined {
  const limpio = valor.trim();

  // Vacio se traduce a ausencia, para que el esquema diga "es obligatorio" en
  // lugar de quejarse del formato de algo que nadie escribio.
  if (limpio === "") return undefined;

  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : limpio;
}

/** Tamaño legible para mostrar junto al archivo elegido. */
export function tamanoLegible(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export { MAX_VIDEO_MB };
