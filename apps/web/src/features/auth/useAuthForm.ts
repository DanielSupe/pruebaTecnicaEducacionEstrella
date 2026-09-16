import type { ZodType } from "zod";
import { useValidatedForm } from "../../lib/useValidatedForm.js";

export function useAuthForm<T>(schema: ZodType<T>) {
  return useValidatedForm(schema, (error) => {
    const titulo = tituloDeError(error);

    // Only errors we cannot translate are logged. Credential ones are skipped on
    // purpose: logging them would reintroduce through the console the distinction
    // the message carefully avoids.
    if (titulo === "No se pudo completar la operación") {
      console.error("Error de autenticación sin traducir:", error);
    }

    return { titulo, mensaje: mensajeDeError(error) };
  });
}

function nombreDeError(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

export function tituloDeError(error: unknown): string {
  switch (nombreDeError(error)) {
    case "UsernameExistsException":
      return "Ese correo ya está registrado";
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "No pudimos iniciar sesión";
    case "InvalidPasswordException":
      return "La contraseña no cumple los requisitos";
    default:
      return "No se pudo completar la operación";
  }
}

export function mensajeDeError(error: unknown): string {
  switch (nombreDeError(error)) {
    case "UsernameExistsException":
      return "Ya existe una cuenta con ese correo. Inicia sesión con ella.";

    // The same message whether the address does not exist or the password is
    // wrong: telling them apart would let someone discover which addresses are
    // registered by trying them one by one.
    case "NotAuthorizedException":
    case "UserNotFoundException":
      return "El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.";

    case "InvalidPasswordException":
      return "Debe tener al menos 8 caracteres, con una mayúscula, una minúscula y un número.";

    case "NetworkError":
      return "No se pudo conectar. Comprueba tu conexión e inténtalo de nuevo.";

    default:
      return "Inténtalo de nuevo en unos momentos.";
  }
}
