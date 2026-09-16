import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "../lib/session.js";
import { confirmar } from "../lib/dialogs.js";
import { Sidebar } from "./Sidebar.js";

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function cerrarSesion() {
    // Confirmed so a stray click does not throw someone out mid-form.
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
      <Sidebar onCerrarSesion={() => void cerrarSesion()} />

      {/* The sidebar gap is reserved with padding on a wrapper, not a margin on the
          content: with a fixed left margin, mx-auto stops centring it and on wide
          screens it sticks to the sidebar. */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
