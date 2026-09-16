import { z } from "zod";

// Values are baked in at BUILD time. A missing variable does not show up at deploy
// time: it shows up as a broken screen for the user. The build is the last moment
// it can be caught.
//
// This is the ONLY file that reads import.meta.env.
const envSchema = z.object({
  // Two legitimate forms: an absolute URL with protocol (local development, where
  // the API lives on another origin) and a root-relative path (cloud, where both
  // share an origin, which also lets the bundle be built without knowing the
  // domain).
  //
  // Still rejected: an absolute URL WITHOUT protocol. z.url() on its own accepts
  // "localhost:3000", reading it as scheme "localhost:" with path "3000", and
  // forgetting http:// is the most common configuration mistake.
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

  // Not secrets: they travel in the downloaded bundle. But no defaults, because
  // pointing at the wrong user pool looks like it works until it does not.
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
    // Trailing slash removed to avoid building paths with a double slash.
    apiBaseUrl: parsed.data.VITE_API_BASE_URL.replace(/\/+$/, ""),
    cognitoUserPoolId: parsed.data.VITE_COGNITO_USER_POOL_ID,
    cognitoClientId: parsed.data.VITE_COGNITO_CLIENT_ID,
  };
}
