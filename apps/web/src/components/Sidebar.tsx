import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logotipo from "../assets/Logo-educacion.png";
import { Button } from "./Button.js";

// On narrow screens it stops being a sidebar and becomes a top bar with the tabs
// in a row. That is the alternative to a drawer: no JavaScript, no focus trap and
// no overlay to close. With two tabs, a drawer would be machinery for nothing.
export function Sidebar({ onCerrarSesion }: { onCerrarSesion: () => void }) {
  return (
    <aside className="flex flex-col border-b border-white/10 bg-ink lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link
          to="/"
          // The FIRST tab stop on the screen: without a ring, keyboard users
          // start out not knowing where they are.
          className="inline-flex items-center rounded-md focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
          aria-label="Educación Estrella, inicio"
        >
          <img
            src={logotipo}
            alt="Educación Estrella"
            width={700}
            height={143}
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        {/* Duplicated on purpose: on mobile the exit lives at the top, since at
            the bottom it would push the content instead of anchoring. */}
        <Button variante="sutil-oscuro" onClick={onCerrarSesion} className="lg:hidden">
          Salir
        </Button>
      </div>

      <nav aria-label="Secciones" className="px-4 pb-3 lg:px-3 lg:pb-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          <li>
            {/* exact: without it the root would also look active from the form,
                because every path starts with "/". */}
            <Pestana to="/" exacta>
              Mis solicitudes
            </Pestana>
          </li>
          <li>
            <Pestana to="/solicitudes/nueva">Crear solicitud</Pestana>
          </li>
        </ul>
      </nav>

      {/* mt-auto anchors it to the foot of the sidebar, not to the last tab. */}
      <div className="mt-auto hidden border-t border-white/10 p-3 lg:block">
        <Button variante="sutil-oscuro" onClick={onCerrarSesion} className="w-full justify-start">
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

// The active state is resolved by the router, not by the component.
function Pestana({
  to,
  exacta = false,
  children,
}: {
  to: string;
  exacta?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: exacta }}
      // The base class carries NO colour. Active classes are appended to the base
      // ones, and between two utilities of the same kind the winner is whichever
      // Tailwind emits later in the sheet, not whichever is written later in the
      // attribute. Leaving a resting colour here made the active state invisible.
      className="inline-flex w-full items-center rounded-md px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
      // Colour is not the only marker: aria-current announces it to whoever
      // cannot see it.
      activeProps={{
        className: "bg-white/10 text-brand-accent",
        "aria-current": "page",
      }}
      inactiveProps={{ className: "text-slate-300 hover:bg-white/10 hover:text-white" }}
    >
      {children}
    </Link>
  );
}
