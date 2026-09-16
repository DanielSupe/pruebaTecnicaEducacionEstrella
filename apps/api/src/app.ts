import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { AppConfig } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authenticate, type AccessTokenVerifier } from "./middleware/authenticate.js";
import { healthRouter } from "./routes/health.js";
import { createMeRouter } from "./routes/me.js";
import { createApplicationsRouter } from "./features/applications/routes.js";
import { createApplicationsRepository } from "./features/applications/repository.js";
import { createVideoStorage } from "./features/applications/uploads.js";

// The API never receives files: the video goes straight to S3. The largest body is
// a few hundred bytes of form data, so accepting more only widens the surface.
const JSON_BODY_LIMIT = "16kb";

// Builds the app without listening on a port. That separation is what lets the
// tests exercise it without sockets, and what makes the Lambda adapter trivial.
export type AppDependencies = Pick<
  AppConfig,
  "corsAllowedOrigins" | "awsRegion" | "applicationsTableName" | "videosBucketName"
>;

export function createApp(config: AppDependencies, verifier: AccessTokenVerifier): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.corsAllowedOrigins }));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  // Unauthenticated on purpose: requiring credentials would defeat what it is for.
  app.use("/api/v1", healthRouter);

  const autenticar = authenticate(verifier);
  app.use("/api/v1", createMeRouter(autenticar));
  app.use(
    "/api/v1",
    createApplicationsRouter(
      autenticar,
      createApplicationsRepository(config),
      createVideoStorage(config),
    ),
  );

  // Order matters: routes, then 404, then the error handler. Mounting it earlier
  // would leave it with no effect.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
