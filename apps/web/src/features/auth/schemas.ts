import { z } from "zod";

/**
 * Validacion de los formularios de acceso.
 *
 * Esto valida el FORMATO de lo que se escribe, y sus errores van bajo cada campo.
 * Que el directorio rechace unas credenciales es otra cosa: eso es un fallo de la
 * operacion y se avisa en ventana emergente.
 *
 * La politica de contrasenas replica la del User Pool (8 caracteres, mayuscula,
 * minuscula y digito). Comprobarla aqui evita un viaje de ida y vuelta para
 * decirle a alguien algo que ya sabiamos antes de salir.
 */
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
