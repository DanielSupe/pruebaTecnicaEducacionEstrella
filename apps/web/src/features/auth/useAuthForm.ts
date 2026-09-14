import type { ZodType } from "zod";
import { useValidatedForm } from "../../lib/useValidatedForm.js";

/**
 * Logica compartida por los formularios de acceso.
 *
 * Separa dos tipos de fallo que se confunden con facilidad:
 *  - Formato de lo escrito: se valida con Zod y se muestra BAJO cada campo.
 *  - La operacion fallo: el directorio rechazo las credenciales, o no respondio.
 *    Eso va en ventana emergente y devuelve el foco al campo indicado.
 */
export function useAuthForm<T>(schema: ZodType<T>) {
  return useValidatedForm(schema, (error) => {
    const titulo = tituloDeError(error);

    // Solo se registran los errores que NO sabemos traducir. Los de credenciales
    // se omiten a proposito: registrar "el correo no existe" frente a "la
    // contrasena no corresponde" reintroduciria por la consola la distincion que
    // el mensaje evita con cuidado.
    if (titulo === "No se pudo completar la operación") {
      console.error("Error de autenticación sin traducir:", error);
    }

    return { titulo, mensaje: mensajeDeError(error) };
  });
}

/** Errores conocidos del directorio de usuarios, traducidos al español. */
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

    // El mismo mensaje tanto si el correo no existe como si la contraseña no
    // corresponde: distinguirlos permitiria averiguar que correos estan dados
    // de alta probando uno a uno.
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
