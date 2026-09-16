import { createApp } from "./app.js";
import { loadConfig, type AppConfig } from "./config/env.js";
import { createAccessTokenVerifier } from "./auth/verifier.js";

// Config is validated and the public keys are fetched BEFORE listening. If either
// fails the process never listens, rather than accepting requests we are bound to
// reject.
async function main(): Promise<void> {
  let config: AppConfig;

  try {
    config = loadConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const verifier = createAccessTokenVerifier(config);

  try {
    await verifier.hydrate();
  } catch (error) {
    console.error("No se pudieron obtener las claves de verificacion del directorio de usuarios.");
    console.error("Revisa COGNITO_USER_POOL_ID y la conectividad.");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  createApp(config, verifier).listen(config.port, () => {
    console.warn(`API escuchando en http://localhost:${String(config.port)}`);
  });
}

void main();
