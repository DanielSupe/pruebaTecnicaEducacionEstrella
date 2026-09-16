import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signIn } from "aws-amplify/auth";
import { AuthLayout } from "../features/auth/AuthLayout.js";
import { loginSchema, type LoginInput } from "../features/auth/schemas.js";
import { useAuthForm } from "../features/auth/useAuthForm.js";
import { refreshSession } from "../lib/session.js";
import { Field } from "../components/Field.js";
import { Button } from "../components/Button.js";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { errores, enviando, enviar, campoDeVuelta } = useAuthForm(loginSchema);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  function onSubmit(evento: FormEvent) {
    evento.preventDefault();

    void enviar({ email, password }, async (datos: LoginInput) => {
      await signIn({
        username: datos.email,
        password: datos.password,
        // Explicit on purpose: the library default changes between versions, and
        // the App Client only authorises this flow.
        options: { authFlowType: "USER_SRP_AUTH" },
      });
      await refreshSession(queryClient);
      await navigate({ to: "/" });
    });
  }

  return (
    <AuthLayout
      titulo="Iniciar sesión"
      descripcion="Entra para registrar y consultar tus solicitudes."
      pie={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link to="/registro" className="font-medium text-brand hover:underline">
            Crea una
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
          autoComplete="current-password"
          ref={campoDeVuelta}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />

        <Button type="submit" className="w-full" cargando={enviando ? "Entrando…" : undefined}>
          Iniciar sesión
        </Button>
      </form>
    </AuthLayout>
  );
}
