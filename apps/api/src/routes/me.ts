import { Router } from "express";
import type { RequestHandler } from "express";

/**
 * Ruta protegida de ejemplo.
 *
 * Existe para que este change sea demostrable por si solo y para que las pruebas
 * tengan algo detras del middleware: los endpoints reales llegan en el change de
 * creacion de solicitudes. Cuando existan, habra que decidir si esta se queda como
 * diagnostico o se retira.
 */
export function createMeRouter(authenticate: RequestHandler): Router {
  const router = Router();

  router.get("/me", authenticate, (req, res) => {
    res.json({ userId: req.user?.userId });
  });

  return router;
}
