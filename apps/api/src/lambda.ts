import serverlessExpress from "serverless-http";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createAccessTokenVerifier } from "./auth/verifier.js";

// Preparation runs at MODULE scope, outside the handler: module scope executes
// once per container and the handler once per request. Fetching the verification
// keys inside the handler would pay that download on every call.
const preparacion = preparar();

async function preparar() {
  // The error is not caught on purpose: the function must fail visibly. Serving
  // traffic we are bound to reject makes a broken deployment look like a user
  // error.
  const config = loadConfig();
  const verifier = createAccessTokenVerifier(config);

  await verifier.hydrate();

  return serverlessExpress(createApp(config, verifier));
}

export async function handler(
  evento: APIGatewayProxyEventV2,
  contexto: Context,
): Promise<APIGatewayProxyResultV2> {
  const atender = await preparacion;
  return (await atender(evento, contexto)) as APIGatewayProxyResultV2;
}
