import type { RequestHandler } from "express";
import { UnauthorizedError } from "../../errors.js";
import type { MeService } from "./me.service.js";

export type MeController = {
  describe: RequestHandler;
};

export function createMeController(servicio: MeService): MeController {
  return {
    describe: (req, res) => {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError();

      res.json(servicio.describe(userId));
    },
  };
}
