import { describe, it, expect } from "vitest";
import { tituloDeError, mensajeDeError } from "./useAuthForm.js";

function errorDeCognito(name: string): Error {
  const error = new Error("mensaje interno de la libreria");
  error.name = name;
  return error;
}

describe("traduccion de errores del directorio de usuarios", () => {
  it("avisa de que el correo ya está registrado y hacia dónde ir", () => {
    const error = errorDeCognito("UsernameExistsException");
    expect(tituloDeError(error)).toBe("Ese correo ya está registrado");
    expect(mensajeDeError(error)).toMatch(/Inicia sesión/);
  });

  it("da el MISMO mensaje si el correo no existe que si la contraseña no corresponde", () => {
    // Telling them apart would let someone discover which addresses are
    // registered by trying them one by one.
    const noAutorizado = mensajeDeError(errorDeCognito("NotAuthorizedException"));
    const noEncontrado = mensajeDeError(errorDeCognito("UserNotFoundException"));

    expect(noAutorizado).toBe(noEncontrado);
    expect(noAutorizado).not.toMatch(/no existe|no encontrado|no registrado/i);
  });

  it("nunca propaga el mensaje interno de la librería", () => {
    const mensaje = mensajeDeError(errorDeCognito("AlgoRaroException"));
    expect(mensaje).not.toContain("mensaje interno");
    expect(mensaje).toBe("Inténtalo de nuevo en unos momentos.");
  });
});
