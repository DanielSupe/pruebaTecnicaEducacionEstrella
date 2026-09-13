import type { RequestHandler } from "express";
import { UnauthorizedError } from "../errors.js";

/** Identidad del solicitante, tomada del token ya verificado. */
export type AuthenticatedUser = {
  /** Identificador estable del usuario en el directorio. Nunca sale del cuerpo. */
  userId: string;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Lo minimo que el middleware necesita de un verificador de tokens.
 *
 * Se declara aqui, y no se importa el tipo concreto de la libreria, para que las
 * pruebas puedan pasar un doble sin red ni credenciales. No es una abstraccion
 * especulativa: es el parametro que hace probable este middleware.
 */
export type AccessTokenVerifier = {
  verify(token: string): Promise<{ sub: string }>;
};

const BEARER = /^Bearer (.+)$/;

function extractToken(header: string | undefined): string {
  if (!header) throw new UnauthorizedError();

  const match = BEARER.exec(header.trim());
  if (!match?.[1]) throw new UnauthorizedError();

  return match[1];
}

/**
 * Exige un token de acceso valido y expone la identidad a los manejadores
 * posteriores.
 *
 * Se monta por grupo de rutas, nunca de forma global: la comprobacion de vida
 * tiene que seguir respondiendo sin credenciales.
 */
export function authenticate(verifier: AccessTokenVerifier): RequestHandler {
  return (req, _res, next) => {
    void (async () => {
      try {
        const token = extractToken(req.headers.authorization);
        const payload = await verifier.verify(token);

        // La identidad sale del token verificado. Si el cuerpo trae un userId,
        // aqui se sobreescribe: el cliente no decide quien es.
        req.user = { userId: payload.sub };

        next();
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          next(error);
          return;
        }

        // El motivo real (caducado, firma invalida, cliente ajeno) se registra
        // en el servidor y no viaja al cliente.
        console.error("Token rechazado:", error);
        next(new UnauthorizedError());
      }
    })();
  };
}
