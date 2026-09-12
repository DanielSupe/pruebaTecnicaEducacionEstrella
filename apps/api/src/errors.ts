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
  constructor(message = "Credenciales ausentes o invalidas.") {
    super(message, 401, "UNAUTHORIZED");
  }
}
