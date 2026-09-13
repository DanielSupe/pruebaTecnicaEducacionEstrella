/**
 * Errores previstos de la aplicacion.
 *
 * Lo que distingue a un AppError de cualquier otra excepcion es que sabemos que
 * puede pasar y sabemos que decirle al usuario. Todo lo demas es un fallo
 * inesperado, y de esos el cliente no ve el detalle nunca.
 *
 * Solo estan las subclases que este change usa. Las demas llegan con el endpoint
 * que las lance, para no decidir hoy contratos de error que aun pueden cambiar.
 */
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
  /**
   * El mensaje es deliberadamente generico y no distingue entre token ausente,
   * caducado, manipulado o emitido para otro cliente. Precisar el motivo solo
   * ayuda a quien esta probando tokens: el usuario legitimo no necesita saberlo.
   */
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
  /**
   * La peticion choca con el estado actual del recurso: avisar de una subida
   * que no ocurrio, o pedir una autorizacion nueva para algo ya enviado. No es
   * un fallo del cliente al construir la peticion (eso seria 400) ni un fallo
   * del servidor: es que el mundo no esta como la peticion supone.
   */
  constructor(message = "La operación no es posible en el estado actual.") {
    super(message, 409, "CONFLICT");
  }
}
