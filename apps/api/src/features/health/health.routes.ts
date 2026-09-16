import { Router } from "express";
import type { HealthController } from "./health.controller.js";

export function createHealthRouter(controlador: HealthController): Router {
  const router = Router();

  router.get("/health", controlador.check);

  return router;
}
