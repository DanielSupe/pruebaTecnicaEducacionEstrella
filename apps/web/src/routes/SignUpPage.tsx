import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signUp, signIn } from "aws-amplify/auth";
import { AuthLayout } from "../features/auth/AuthLayout.js";
import { signUpSchema, type SignUpInput } from "../features/auth/schemas.js";
import { useAuthForm } from "../features/auth/useAuthForm.js";
import { refreshSession } from "../lib/session.js";
import { avisarError } from "../lib/dialogs.js";
import { Field } from "../components/Field.js";
import { Button } from "../components/Button.js";

export function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { errores, enviando, enviar, campoDeVuelta } = useAuthForm(signUpSchema);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function onSubmit(evento: FormEvent) {
    evento.preventDefault();

    void enviar({ email, password, confirmPassword }, async (datos: SignUpInput) => {
      await signUp({
        username: datos.email,
        password: datos.password,
        options: { userAttributes: { email: datos.email } },
      });

      // Se llama al MISMO inicio de sesion que usa la pantalla de acceso, en
      // lugar del automatico de la libreria: un solo camino ya probado en vez
      // de dos con comportamientos distintos ante errores.
      //
      // Si esto falla, la cuenta YA existe. Decir "error al registrarse" haria
      // que el usuario lo reintentara y chocara con un correo ya ocupado.
      try {
        await signIn({
          username: datos.email,
          password: datos.password,
          options: { authFlowType: "USER_SRP_AUTH" },
        });
      } catch {
        await avisarError({
          titulo: "Tu cuenta se creó correctamente",
          mensaje: "No pudimos iniciar la sesión automáticamente. Entra con tus credenciales.",
        });
        await navigate({ to: "/login" });
        return;
      }

      await refreshSession(queryClient);
      await navigate({ to: "/" });
    });
  }

  return (
    <AuthLayout
      titulo="Crear cuenta"
      descripcion="Regístrate para enviar tu solicitud de crédito educativo."
      pie={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field
          id="email"
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errores.email}
        />

        <Field
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          ref={campoDeVuelta}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />

        <Field
          id="confirmPassword"
          label="Confirma la contraseña"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errores.confirmPassword}
        />

        <p className="text-xs text-slate-500">
          Debe tener al menos 8 caracteres, con una mayúscula, una minúscula y un número.
        </p>

        <Button
          type="submit"
          className="w-full"
          cargando={enviando ? "Creando cuenta…" : undefined}
        >
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
