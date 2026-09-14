import { Amplify } from "aws-amplify";
import { config } from "../config/config.js";

/**
 * Configura la autenticacion una sola vez, al arrancar.
 *
 * Se importa unicamente aws-amplify/auth en el resto del codigo: el paquete
 * completo arrastra modulos de almacenamiento, analitica y APIs que no usamos.
 */
export function configureAuth(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.cognitoUserPoolId,
        userPoolClientId: config.cognitoClientId,
      },
    },
  });
}
