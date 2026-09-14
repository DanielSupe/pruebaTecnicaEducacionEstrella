import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "../lib/session.js";
import { confirmar } from "../lib/dialogs.js";
import { Sidebar } from "./Sidebar.js";

/**
 * Estructura comun de las pantallas privadas: solo cambia el contenido.
 * La marca aparece una sola vez, en el lateral.
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
      <Sidebar onCerrarSesion={() => void cerrarSesion()} />

      {/* El hueco del lateral se reserva con relleno en un envoltorio, no con
          margen en el contenido: con margen izquierdo fijo, el mx-auto del
          contenido deja de centrarlo y en pantallas anchas queda pegado al
          lateral. Por debajo de ese ancho la barra va arriba y no hay hueco
          que reservar. */}
      <div className="lg:pl-64">
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
