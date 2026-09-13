import { CognitoJwtVerifier } from "aws-jwt-verify";
import type { AppConfig } from "../config/env.js";

/**
 * Verificador de tokens de acceso de Cognito.
 *
 * Las dos opciones que importan para la seguridad no son la firma, que la libreria
 * comprueba siempre, sino estas:
 *
 * - tokenUse "access": sin fijarlo, un token de identidad valido pasaria. El de
 *   identidad describe al usuario para el propio cliente; el de acceso es el que
 *   autoriza a llamar a este servicio.
 *
 * - clientId: un token firmado por ESTE mismo directorio de usuarios pero emitido
 *   para otro cliente es criptograficamente valido. Comprobar solo la firma
 *   responde "el token es autentico"; hay que responder "el token es para mi".
 */
export function createAccessTokenVerifier(
  config: Pick<AppConfig, "cognitoUserPoolId" | "cognitoClientId">,
) {
  return CognitoJwtVerifier.create({
    userPoolId: config.cognitoUserPoolId,
    tokenUse: "access",
    clientId: config.cognitoClientId,
  });
}
