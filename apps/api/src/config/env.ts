import { z } from "zod";

/**
 * Configuracion de la API.
 *
 * Se valida al arrancar, no al usarse. La diferencia importa: un despliegue mal
 * configurado falla al instante y con un mensaje que dice que variable falta, en
 * lugar de romperse a mitad de la peticion de un usuario real, con un error que no
 * apunta a la causa.
 *
 * Este es el UNICO archivo que lee process.env.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // El puerto solo importa en local: en Lambda no se escucha en ninguno. Por eso
  // aqui un valor por omision no enmascara nada.
  PORT: z.coerce
    .number({ error: "PORT debe ser un numero" })
    .int()
    .positive()
    .max(65535)
    .default(3000),

  // Sin valor por omision a proposito. Un default aqui significaria desplegar con
  // los origenes equivocados sin enterarse.
  //
  // Se parte y se limpia DENTRO del esquema, y se valida el resultado: comprobar
  // solo que la cadena no este vacia dejaria pasar "   ", que produce cero origenes
  // en silencio y deja la API inalcanzable desde el navegador.
  CORS_ALLOWED_ORIGINS: z
    .string({ error: "CORS_ALLOWED_ORIGINS es obligatoria" })
    .transform((valor) =>
      valor
        .split(",")
        .map((origen) => origen.trim())
        .filter((origen) => origen.length > 0),
    )
    .refine(
      (origenes) => origenes.length > 0,
      "CORS_ALLOWED_ORIGINS debe incluir al menos un origen",
    ),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsAllowedOrigins: string[];
};

/**
 * Valida el entorno y devuelve la configuracion ya tipada.
 * Lanza si algo falta o es invalido: quien la llama decide si eso aborta el proceso.
 */
export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Configuracion invalida:\n${detalle}`);
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    corsAllowedOrigins: parsed.data.CORS_ALLOWED_ORIGINS,
  };
}
