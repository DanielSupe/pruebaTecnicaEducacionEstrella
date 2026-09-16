import { Router } from "express";
import type { RequestHandler } from "express";

export function createMeRouter(authenticate: RequestHandler): Router {
  const router = Router();

  router.get("/me", authenticate, (req, res) => {
    res.json({ userId: req.user?.userId });
  });

  return router;
}
