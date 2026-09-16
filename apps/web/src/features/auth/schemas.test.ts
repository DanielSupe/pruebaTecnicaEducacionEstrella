import { describe, it, expect } from "vitest";
import { loginSchema, signUpSchema } from "./schemas.js";

const registroValido = {
  email: "ana@ejemplo.com",
  password: "Segura2026",
  confirmPassword: "Segura2026",
};

describe("loginSchema", () => {
  it("acepta unas credenciales con formato correcto", () => {
    expect(loginSchema.safeParse({ email: "ana@ejemplo.com", password: "x" }).success).toBe(true);
  });

  it.each(["sin-arroba", "ana@", "@ejemplo.com", "", "ana ejemplo.com"])(
    "rechaza el correo mal formado %s",
    (email) => {
      expect(loginSchema.safeParse({ email, password: "x" }).success).toBe(false);
    },
  );

  it("explica en español por qué rechaza el correo", () => {
    const resultado = loginSchema.safeParse({ email: "nope", password: "x" });
    expect(resultado.error?.issues[0]?.message).toBe("Escribe un correo electrónico válido");
  });
});

describe("signUpSchema: politica de contraseña", () => {
  it("acepta una contraseña que cumple la politica del directorio", () => {
    expect(signUpSchema.safeParse(registroValido).success).toBe(true);
  });

  it.each([
    ["demasiado corta", "Corta1"],
    ["sin mayuscula", "segura2026"],
    ["sin minuscula", "SEGURA2026"],
    ["sin numero", "SeguraSegura"],
  ])("rechaza una contraseña %s", (_caso, password) => {
    const resultado = signUpSchema.safeParse({
      ...registroValido,
      password,
      confirmPassword: password,
    });
    expect(resultado.success).toBe(false);
  });
});

describe("signUpSchema: confirmacion", () => {
  it("detecta que las contraseñas no coinciden", () => {
    const resultado = signUpSchema.safeParse({
      ...registroValido,
      confirmPassword: "Distinta1",
    });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]?.message).toBe("Las contraseñas no coinciden");
  });

  it("señala el error en el campo de confirmacion, no en el de contraseña", () => {
    // The error must appear under the field the user has to fix.
    const resultado = signUpSchema.safeParse({
      ...registroValido,
      confirmPassword: "Distinta1",
    });

    expect(resultado.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });
});
