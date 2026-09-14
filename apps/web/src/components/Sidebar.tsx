import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import logotipo from "../assets/Logo-educacion.png";
import { Button } from "./Button.js";

/**
 * Navegacion lateral de las pantallas privadas.
 *
 * Son dos destinos y una salida: no hace falta un menu desplegable, ni iconos
 * inventados, ni agrupaciones. Con tan pocos elementos, esconderlos detras de un
 * boton cuesta mas de lo que ahorra.
 *
 * Va sobre el azul petroleo del logotipo (token `ink`). Eso obliga a recalcular
 * todo lo de dentro: el texto de reposo, el anillo de foco y el distintivo de
 * pestana activa estaban pensados para fondo blanco y sobre oscuro no se verian.
 *
 * En pantallas estrechas deja de ser lateral y pasa a ser una barra superior con
 * las pestanas en fila. Es la alternativa a un cajon desplegable: sin JavaScript,
 * sin atrapar el foco y sin superposicion que cerrar. Con dos pestanas, un cajon
 * seria maquinaria para nada.
 */
export function Sidebar({ onCerrarSesion }: { onCerrarSesion: () => void }) {
  return (
    <aside className="flex flex-col border-b border-white/10 bg-ink lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-6">
        <Link to="/" className="inline-flex items-center" aria-label="Educación Estrella, inicio">
          <img
            src={logotipo}
            alt="Educación Estrella"
            width={700}
            height={143}
            className="h-7 w-auto sm:h-8"
          />
        </Link>

        {/* Duplicado a proposito: en movil la salida vive arriba, porque abajo
            quedaria empujando el contenido en lugar de anclada al pie. */}
        <Button variante="sutil-oscuro" onClick={onCerrarSesion} className="lg:hidden">
          Salir
        </Button>
      </div>

      <nav aria-label="Secciones" className="px-4 pb-3 lg:px-3 lg:pb-0">
        <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
          <li>
            {/* exact: sin esto, la raiz se marcaria activa tambien estando en
                el formulario, porque toda ruta empieza por "/". */}
            <Pestana to="/" exacta>
              Mis solicitudes
            </Pestana>
          </li>
          <li>
            <Pestana to="/solicitudes/nueva">Crear solicitud</Pestana>
          </li>
        </ul>
      </nav>

      {/* mt-auto la ancla al pie del lateral, no a la ultima pestana. */}
      <div className="mt-auto hidden border-t border-white/10 p-3 lg:block">
        <Button variante="sutil-oscuro" onClick={onCerrarSesion} className="w-full justify-start">
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
}

/** Una pestana. El estado activo lo resuelve el enrutador, no el componente. */
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
      // La clase base NO lleva color. Las clases activas se anaden a las de
      // base, y entre dos utilidades del mismo tipo gana la que Tailwind emita
      // mas tarde en la hoja, no la que se escriba despues en el atributo:
      // dejar aqui un color de reposo hacia que el estado activo no se viera.
      // Cada estado aporta el suyo y no compiten.
      className="inline-flex w-full items-center rounded-md px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:outline-none"
      // El color no es lo unico que marca la pestana activa: aria-current lo
      // anuncia a quien no lo ve.
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
