import serverlessExpress from "serverless-http";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from "aws-lambda";
import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createAccessTokenVerifier } from "./auth/verifier.js";

/**
 * Arranque en Lambda.
 *
 * La aplicación es la MISMA que en local: `createApp` se separó de `listen` en el
 * change 4 justamente para que llegar aquí no obligara a reestructurar nada.
 *
 * Lo que cambia es cuándo ocurre la preparación. En local, `server.ts` valida la
 * configuración y descarga las claves de verificación ANTES de escuchar. Aquí eso
 * tiene que pasar en el ámbito del módulo, fuera del manejador: el ámbito del
 * módulo se ejecuta una vez por contenedor, y el manejador una vez por petición.
 * Descargar las claves dentro del manejador significaría pagar esa descarga en
 * cada llamada.
 */
const preparacion = preparar();

async function preparar() {
  // No se captura el error: si la configuración es inválida o las claves no se
  // pueden obtener, la función debe fallar de forma visible. Atender tráfico que
  // estamos condenados a rechazar es peor que no atender ninguno, porque el fallo
  // aparece como un error del usuario en lugar de como un despliegue roto.
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
