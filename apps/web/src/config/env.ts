import { z } from "zod";

/**
 * Configuracion del frontend.
 *
 * Diferencia importante respecto a la API: aqui los valores se incrustan en
 * tiempo de CONSTRUCCION. Una variable ausente no se manifiesta al desplegar,
 * se manifiesta como una pantalla rota para el usuario. Por eso la construccion
 * es el ultimo momento en que se puede detectar, y por eso esto falla ruidosamente.
 *
 * Este es el UNICO archivo que lee import.meta.env.
 */
const envSchema = z.object({
  // z.url() por si solo acepta "localhost:3000": el parser lo lee como esquema
  // "localhost:" con ruta "3000". Y olvidar el http:// es el error de
  // configuracion mas comun, asi que el protocolo se comprueba de forma explicita.
  VITE_API_BASE_URL: z
    .url({ error: "VITE_API_BASE_URL es obligatoria y debe ser una URL valida" })
    .refine(
      (valor) => {
        try {
          return /^https?:$/.test(new URL(valor).protocol);
        } catch {
          return false;
        }
      },
      { error: "VITE_API_BASE_URL debe empezar por http:// o https://" },
    ),
});

export type WebConfig = {
  apiBaseUrl: string;
};

export function loadConfig(source: Record<string, unknown> = import.meta.env): WebConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuracion invalida:\n${detalle}`);
  }

  return {
    // Se quita la barra final para no acabar construyendo rutas con doble barra.
    apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/+$/, ""),
  };
}
