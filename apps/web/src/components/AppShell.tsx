import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import logotipo from "../assets/Logo-educacion.png";
import { signOut } from "../lib/session.js";
import { confirmar } from "../lib/dialogs.js";
import { Button } from "./Button.js";

/**
 * Estructura comun de las pantallas privadas: solo cambia el contenido.
 * La marca aparece una sola vez, en la cabecera.
 */
export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function cerrarSesion() {
    // Accion con consecuencia: se confirma para que un clic accidental no
    // eche a nadie fuera a mitad de un formulario.
    const confirmado = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje: "Tendrás que volver a entrar para consultar tus solicitudes.",
      textoConfirmar: "Cerrar sesión",
      destructiva: true,
    });

    if (!confirmado) return;

    await signOut(queryClient);
    await navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center" aria-label="Educación Estrella, inicio">
            <img
              src={logotipo}
              alt="Educación Estrella"
              width={700}
              height={143}
              className="h-7 w-auto sm:h-8"
            />
          </Link>

          <Button variante="sutil" onClick={() => void cerrarSesion()}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
