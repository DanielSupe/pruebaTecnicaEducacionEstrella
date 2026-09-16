import { Router } from "express";
import type { RequestHandler } from "express";
import type { MeController } from "./me.controller.js";

export function createMeRouter(authenticate: RequestHandler, controlador: MeController): Router {
  const router = Router();

  router.get("/me", authenticate, controlador.describe);

  return router;
}
