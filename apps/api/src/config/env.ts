import { z } from "zod";

// Validated at startup, not at use: a misconfigured deployment fails immediately
// naming the missing variable, instead of breaking mid-request later.
//
// This is the ONLY file that reads process.env.
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Only matters locally: on Lambda nothing listens on a port, so a default here
  // masks nothing.
  PORT: z.coerce
    .number({ error: "PORT debe ser un numero" })
    .int()
    .positive()
    .max(65535)
    .default(3000),

  // Split and trimmed INSIDE the schema, then validated: checking only that the
  // string is non-empty would let "   " through, which yields zero origins in
  // silence and leaves the API unreachable from the browser.
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

  // No defaults: one would mean verifying tokens against the wrong user pool,
  // which is worse than not verifying, because it looks like it works.
  COGNITO_USER_POOL_ID: z
    .string({ error: "COGNITO_USER_POOL_ID es obligatoria" })
    .trim()
    .min(1, "COGNITO_USER_POOL_ID no puede estar vacia"),

  COGNITO_CLIENT_ID: z
    .string({ error: "COGNITO_CLIENT_ID es obligatoria" })
    .trim()
    .min(1, "COGNITO_CLIENT_ID no puede estar vacia"),

  APPLICATIONS_TABLE_NAME: z
    .string({ error: "APPLICATIONS_TABLE_NAME es obligatoria" })
    .trim()
    .min(1, "APPLICATIONS_TABLE_NAME no puede estar vacia"),

  VIDEOS_BUCKET_NAME: z
    .string({ error: "VIDEOS_BUCKET_NAME es obligatoria" })
    .trim()
    .min(1, "VIDEOS_BUCKET_NAME no puede estar vacia"),

  AWS_REGION: z
    .string({ error: "AWS_REGION es obligatoria" })
    .trim()
    .min(1, "AWS_REGION no puede estar vacia"),
});

export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  corsAllowedOrigins: string[];
  cognitoUserPoolId: string;
  cognitoClientId: string;
  applicationsTableName: string;
  videosBucketName: string;
  awsRegion: string;
};

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
    cognitoUserPoolId: parsed.data.COGNITO_USER_POOL_ID,
    cognitoClientId: parsed.data.COGNITO_CLIENT_ID,
    applicationsTableName: parsed.data.APPLICATIONS_TABLE_NAME,
    videosBucketName: parsed.data.VIDEOS_BUCKET_NAME,
    awsRegion: parsed.data.AWS_REGION,
  };
}
