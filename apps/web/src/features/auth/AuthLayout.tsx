import type { ReactNode } from "react";
import logotipo from "../../assets/Logo-educacion.png";

/**
 * Estructura comun de las pantallas de acceso.
 *
 * La marca aparece aqui y no en una cabecera: estas pantallas no la tienen, asi
 * que el logotipo es lo que identifica de quien es la aplicacion. Ancho acotado
 * porque un formulario a lo ancho de un monitor es un formulario que cansa.
 */
export function AuthLayout({
  titulo,
  descripcion,
  children,
  pie,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
  pie: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <img
          src={logotipo}
          alt="Educación Estrella"
          width={700}
          height={143}
          className="mx-auto h-8 w-auto"
        />

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">{descripcion}</p>

          <div className="mt-6">{children}</div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">{pie}</p>
      </div>
    </div>
  );
}
