import { loadConfig } from "./env.js";

/**
 * Configuracion de la aplicacion en tiempo de ejecucion.
 *
 * La MISMA validacion corre ademas durante la construccion, desde vite.config.ts:
 * es lo unico que impide publicar un artefacto que apunta a ninguna parte.
 */
export const config = loadConfig();
