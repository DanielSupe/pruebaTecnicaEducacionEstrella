import { createApp } from "./app.js";
import { loadConfig, type AppConfig } from "./config/env.js";
import { createAccessTokenVerifier } from "./auth/verifier.js";

/**
 * Arranque local.
 *
 * Dos cosas ocurren antes de aceptar ninguna peticion: se valida la configuracion
 * y se descargan las claves publicas del directorio de usuarios. Si cualquiera de
 * las dos falla, el proceso no llega a escuchar. La alternativa seria aceptar
 * peticiones que estamos condenados a rechazar.
 */
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
