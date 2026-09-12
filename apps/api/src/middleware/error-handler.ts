import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError, NotFoundError } from "../errors.js";

/** Forma unica de toda respuesta de error de la API. */
type ErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

function body(code: string, message: string): ErrorBody {
  return { error: { code, message } };
}

/**
 * Errores que produce el parseo del cuerpo JSON.
 *
 * No son AppError porque no los lanzamos nosotros, pero tampoco son inesperados:
 * los provocamos al poner un limite de tamano y al aceptar JSON. Devolver 500 ante
 * un cuerpo mal formado seria culpar al servidor de un error del cliente.
 */
function clientBodyError(error: unknown): ErrorBody | null {
  if (typeof error !== "object" || error === null || !("type" in error)) return null;

  switch ((error as { type: unknown }).type) {
    case "entity.parse.failed":
      return body("INVALID_JSON", "El cuerpo de la peticion no es JSON valido.");
    case "entity.too.large":
      return body("PAYLOAD_TOO_LARGE", "El cuerpo de la peticion es demasiado grande.");
    default:
      return null;
  }
}

function statusFor(error: unknown): number {
  const type = (error as { type?: unknown }).type;
  return type === "entity.too.large" ? 413 : 400;
}

/**
 * Unico punto de la aplicacion que construye respuestas de error. Ningun manejador
 * de ruta formatea las suyas: si lo hicieran, el formato dejaria de ser uno.
 */
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

  // Inesperado: el detalle se registra en el servidor y NUNCA viaja al cliente.
  // Una traza en la respuesta describe la estructura interna a quien la pida.
  console.error("Error inesperado:", error);

  res.status(500).json(body("INTERNAL_ERROR", "Ocurrio un error inesperado."));
};

/**
 * Rutas desconocidas. Pasa por el mismo canal que el resto de errores para que un
 * 404 tenga el mismo formato que un 400, en lugar del HTML por omision de Express.
 */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError("La ruta solicitada no existe."));
};
