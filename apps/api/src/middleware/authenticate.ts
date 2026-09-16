import type { RequestHandler } from "express";
import { UnauthorizedError } from "../errors.js";

export type AuthenticatedUser = {
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

// Declared here rather than importing the library type so tests can pass a double
// without network or credentials.
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

// Mounted per route group, never globally: the health check must keep answering
// without credentials.
export function authenticate(verifier: AccessTokenVerifier): RequestHandler {
  return (req, _res, next) => {
    void (async () => {
      try {
        const token = extractToken(req.headers.authorization);
        const payload = await verifier.verify(token);

        // If the body carries a userId it is overwritten here: the client does
        // not get to decide who it is.
        req.user = { userId: payload.sub };

        next();
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          next(error);
          return;
        }

        // The real reason is logged server-side and never travels to the client.
        console.error("Token rechazado:", error);
        next(new UnauthorizedError());
      }
    })();
  };
}
