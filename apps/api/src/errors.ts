// An AppError is one we know can happen and know what to tell the user about.
// Anything else is an unexpected failure, and the client never sees its detail.
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "El recurso solicitado no existe.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  // Deliberately generic: it does not tell a missing token from an expired,
  // tampered or foreign one. Being precise only helps whoever is probing tokens.
  constructor(message = "Credenciales ausentes o inválidas.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Los datos enviados no son válidos.") {
    super(message, 400, "BAD_REQUEST");
  }
}

export class ConflictError extends AppError {
  // The request clashes with the current state of the resource: not a malformed
  // request (that is 400), and not a server failure.
  constructor(message = "La operación no es posible en el estado actual.") {
    super(message, 409, "CONFLICT");
  }
}
