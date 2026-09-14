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
  // Dos formas legitimas, y ninguna mas.
  //
  // Absoluta con protocolo: la API vive en otro origen. Es el caso del desarrollo
  // local, donde el navegador esta en el 5173 y la API en el 3000.
  //
  // Ruta desde la raiz: frontend y API comparten origen, que es como se sirve en
  // la nube. Ademas rompe un circulo, porque el dominio solo se conoce al aplicar
  // la infraestructura y el paquete hay que construirlo antes de subirlo: una
  // ruta relativa no necesita saber el dominio.
  //
  // Lo que se sigue rechazando: una absoluta SIN protocolo. z.url() por si sola
  // acepta "localhost:3000", porque lo lee como esquema "localhost:" con ruta
  // "3000", y olvidar el http:// es el error de configuracion mas comun. Y una
  // ruta que no empiece por barra, que se resolveria contra la pagina actual y
  // funcionaria o no segun desde donde se navegue.
  VITE_API_BASE_URL: z
    .string({ error: "VITE_API_BASE_URL es obligatoria" })
    .trim()
    .min(1, "VITE_API_BASE_URL no puede estar vacia")
    .refine(
      (valor) => {
        if (valor.startsWith("/")) return true;

        try {
          return /^https?:$/.test(new URL(valor).protocol);
        } catch {
          return false;
        }
      },
      {
        error:
          "VITE_API_BASE_URL debe ser una URL que empiece por http:// o https://, o una ruta que empiece por /",
      },
    ),

  // Identificadores del directorio de usuarios. No son secretos: viajan en el
  // paquete que descarga el navegador. Pero sin valor por omision, porque
  // apuntar al directorio equivocado parece funcionar hasta que no funciona.
  VITE_COGNITO_USER_POOL_ID: z
    .string({ error: "VITE_COGNITO_USER_POOL_ID es obligatoria" })
    .trim()
    .min(1, "VITE_COGNITO_USER_POOL_ID no puede estar vacia"),

  VITE_COGNITO_CLIENT_ID: z
    .string({ error: "VITE_COGNITO_CLIENT_ID es obligatoria" })
    .trim()
    .min(1, "VITE_COGNITO_CLIENT_ID no puede estar vacia"),
});

export type WebConfig = {
  apiBaseUrl: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
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
    cognitoUserPoolId: parsed.data.VITE_COGNITO_USER_POOL_ID,
    cognitoClientId: parsed.data.VITE_COGNITO_CLIENT_ID,
  };
}
