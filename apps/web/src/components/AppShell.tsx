import { Link, Outlet } from "@tanstack/react-router";
import logotipo from "../assets/Logo-educacion.png";

/**
 * Estructura comun a todas las pantallas: solo cambia el contenido.
 *
 * La marca aparece una sola vez, en la cabecera. En movil el logotipo horizontal
 * no cabe, asi que se recorta a su altura y se deja que el contenedor lo acote.
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center" aria-label="Educación Estrella, inicio">
            <img
              src={logotipo}
              alt="Educación Estrella"
              width={700}
              height={143}
              className="h-7 w-auto sm:h-8"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
