import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../errors.js";

type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

function body(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}

// Not AppError because we do not throw them, but not unexpected either: we cause
// them by accepting JSON with a size limit. Answering 500 to a malformed body
// would blame the server for a client mistake.
function clientBodyError(error: unknown): ErrorBody | null {
  if (typeof error !== "object" || error === null || !("type" in error)) return null;

  switch ((error as { type: unknown }).type) {
    case "entity.parse.failed":
      return body("INVALID_JSON", "El cuerpo de la petición no es JSON válido.");
    case "entity.too.large":
      return body("PAYLOAD_TOO_LARGE", "El cuerpo de la petición es demasiado grande.");
    default:
      return null;
  }
}

function statusFor(error: unknown): number {
  const type = (error as { type?: unknown }).type;
  return type === "entity.too.large" ? 413 : 400;
}

// The only place that builds error responses. No route handler formats its own,
// or the format would stop being one.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(body(error.code, error.message));
    return;
  }

  const deCliente = clientBodyError(error);
  if (deCliente) {
    res.status(statusFor(error)).json(deCliente);
    return;
  }

  // Detail is logged server-side and NEVER travels: a stack trace in the response
  // describes the internal structure to whoever asks for it.
  console.error("Error inesperado:", error);

  res.status(500).json(body("INTERNAL_ERROR", "Ocurrió un error inesperado."));
};

// Goes through the same channel as every other error so a 404 has the same shape
// as a 400, instead of the default Express HTML.
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError("La ruta solicitada no existe."));
};
