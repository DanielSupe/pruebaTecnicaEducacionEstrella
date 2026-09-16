import { Router } from "express";

export const healthRouter: Router = Router();

// Deliberately does NOT query DynamoDB, S3 or Cognito. A check that interrogates
// its dependencies turns one of them being slow into "the service is down", and
// causes cascading restarts that worsen what it meant to detect.
healthRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});
