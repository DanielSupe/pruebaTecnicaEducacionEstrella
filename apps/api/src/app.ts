import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { AppConfig } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authenticate, type AccessTokenVerifier } from "./middleware/authenticate.js";
import { createHealthRouter } from "./features/health/health.routes.js";
import { createHealthController } from "./features/health/health.controller.js";
import { createHealthService } from "./features/health/health.service.js";
import { createMeRouter } from "./features/me/me.routes.js";
import { createMeController } from "./features/me/me.controller.js";
import { createMeService } from "./features/me/me.service.js";
import { createApplicationsRouter } from "./features/applications/applications.routes.js";
import { createApplicationsController } from "./features/applications/applications.controller.js";
import { createApplicationsService } from "./features/applications/applications.service.js";
import { createApplicationsRepository } from "./features/applications/applications.repository.js";
import { createVideoStorage } from "./features/applications/applications.storage.js";

// The API never receives files: the video goes straight to S3. The largest body is
// a few hundred bytes of form data, so accepting more only widens the surface.
const JSON_BODY_LIMIT = "16kb";

export type AppDependencies = Pick<
  AppConfig,
  "corsAllowedOrigins" | "awsRegion" | "applicationsTableName" | "videosBucketName"
>;

// Builds the app without listening on a port. That separation is what lets the
// tests exercise it without sockets, and what makes the Lambda adapter trivial.
export function createApp(config: AppDependencies, verifier: AccessTokenVerifier): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsAllowedOrigins }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Each layer receives the one below it: nobody reaches for its own dependencies.
  const solicitudes = createApplicationsController(
    createApplicationsService(createApplicationsRepository(config), createVideoStorage(config)),
  );

  const autenticar = authenticate(verifier);

  // Unauthenticated on purpose: requiring credentials would defeat what it is for.
  app.use("/api/v1", createHealthRouter(createHealthController(createHealthService())));

  app.use("/api/v1", createMeRouter(autenticar, createMeController(createMeService())));
  app.use("/api/v1", createApplicationsRouter(autenticar, solicitudes));

  // Order matters: routes, then 404, then the error handler. Mounting it earlier
  // would leave it with no effect.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
