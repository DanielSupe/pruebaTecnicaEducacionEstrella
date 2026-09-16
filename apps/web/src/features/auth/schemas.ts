import { z } from "zod";

// The password policy mirrors the User Pool's. Checking it here saves a round trip
// to tell someone what we already knew before leaving.
export const loginSchema = z.object({
  email: z.email({ error: "Escribe un correo electrónico válido" }),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = z
  .object({
    email: z.email({ error: "Escribe un correo electrónico válido" }),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[a-z]/, "La contraseña debe incluir una letra minúscula")
      .regex(/[A-Z]/, "La contraseña debe incluir una letra mayúscula")
      .regex(/\d/, "La contraseña debe incluir un número"),
    confirmPassword: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((datos) => datos.password === datos.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
