import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { AppConfig } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";

/** Cuerpo maximo aceptado. La API nunca recibe archivos: el video va directo a S3
 *  con una politica firmada, asi que el cuerpo mas grande son unos cientos de bytes
 *  de formulario. Aceptar mas solo abre superficie. */
const JSON_BODY_LIMIT = "16kb";

/**
 * Construye la aplicacion sin escuchar en ningun puerto.
 *
 * Esa separacion es lo que permite que las pruebas la ejerciten sin abrir sockets,
 * y lo que hara trivial montarla sobre Lambda mas adelante.
 */
export function createApp(config: Pick<AppConfig, "corsAllowedOrigins">): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsAllowedOrigins }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  app.use("/api/v1", healthRouter);

  // El orden importa: primero las rutas, luego el 404, y el manejador de errores
  // al final. Montarlo antes lo dejaria sin efecto.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
