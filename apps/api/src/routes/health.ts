import { Router } from "express";

export const healthRouter: Router = Router();

/**
 * Comprobacion de vida: responde si el proceso responde.
 *
 * A proposito NO consulta DynamoDB, S3 ni Cognito. Un chequeo que interroga a sus
 * dependencias convierte la lentitud de una de ellas en "el servicio esta caido",
 * y provoca reinicios en cascada que empeoran justo lo que pretendia detectar.
 */
healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
