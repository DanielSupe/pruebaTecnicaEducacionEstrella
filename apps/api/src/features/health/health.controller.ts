import type { RequestHandler } from "express";
import type { HealthService } from "./health.service.js";

export type HealthController = {
  check: RequestHandler;
};

export function createHealthController(servicio: HealthService): HealthController {
  return {
    check: (_req, res) => {
      res.json(servicio.check());
    },
  };
}
