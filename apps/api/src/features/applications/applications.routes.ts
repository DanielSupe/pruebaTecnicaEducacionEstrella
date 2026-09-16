import { Router } from "express";
import type { RequestHandler } from "express";
import type { ApplicationsController } from "./applications.controller.js";

export function createApplicationsRouter(
  authenticate: RequestHandler,
  controlador: ApplicationsController,
): Router {
  const router = Router();

  router.post("/applications", authenticate, controlador.create);
  router.get("/applications", authenticate, controlador.list);
  router.post("/applications/:id/complete-upload", authenticate, controlador.completeUpload);
  router.get("/applications/:id/video-url", authenticate, controlador.getVideoLink);
  router.post("/applications/:id/video-url", authenticate, controlador.renewUpload);

  return router;
}
