import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";

/**
 * Arranque local. La validacion de la configuracion ocurre aqui, antes de aceptar
 * ninguna peticion: si algo falta, el proceso no llega a escuchar.
 */
function main(): void {
  let config;

  try {
    config = loadConfig();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  createApp(config).listen(config.port, () => {
    console.warn(`API escuchando en http://localhost:${String(config.port)}`);
  });
}

main();
