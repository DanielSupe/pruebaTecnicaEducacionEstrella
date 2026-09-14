import { useEffect, useRef, type ReactNode } from "react";

/**
 * Ventana emergente con contenido.
 *
 * Se apoya en el <dialog> del navegador y NO en SweetAlert2. La libreria sigue
 * siendo el unico camino para confirmar, avisar de un error y avisar de un
 * exito (ver lib/dialogs.ts), pero recibe HTML, no componentes: una barra de
 * progreso que avanza o un reproductor dentro de Swal obligarian a montar React
 * en su contenedor con un portal y a sincronizar dos ciclos de vida.
 *
 * El elemento nativo da justo lo que se le agradece a la libreria —trampa de
 * foco, cierre con Escape, aria-modal y fondo inerte— sin nada de eso. No es
 * meter otra libreria de interfaz: es la plataforma.
 */
export function Modal({
  abierto,
  titulo,
  descripcion,
  onCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  descripcion?: string;
  /** Se invoca ante cualquier intento de cierre: boton, Escape o clic fuera. */
  onCerrar: () => void;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  // Elemento que tenia el foco al abrir, para devolverselo al cerrar. Sin esto
  // quien navega con teclado reaparece al principio de la pagina.
  const focoPrevio = useRef<HTMLElement | null>(null);

  /**
   * Devuelve el foco a quien abrio la ventana.
   *
   * NO se limpia la referencia despues. Parece prudente hacerlo "para no
   * devolver el foco dos veces", pero en desarrollo React monta, desmonta y
   * vuelve a montar cada componente a proposito: esa limpieza se llevaba la
   * referencia en el desmontaje de mentira, y al volver a montar el dialogo ya
   * estaba abierto, asi que no se recapturaba y el foco no volvia nunca.
   * Enfocar dos veces el mismo elemento no hace nada; perder la referencia, si.
   */
  function devolverFoco() {
    focoPrevio.current?.focus();
  }

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (abierto) {
      // Se captura al abrir y solo si no habia nada guardado: quien abrio la
      // ventana es quien tenia el foco la PRIMERA vez, no en un remontaje.
      focoPrevio.current ??= document.activeElement as HTMLElement | null;

      // showModal y no el atributo open: es lo que hace la ventana modal de
      // verdad (fondo inerte y foco atrapado). Con el atributo, la pagina de
      // detras sigue siendo navegable con el tabulador.
      if (!elemento.open) elemento.showModal();
    }

    if (!abierto && elemento.open) {
      elemento.close();
      devolverFoco();
    }
  }, [abierto]);

  // Devolver el foco al DESMONTAR, no solo al pasar a cerrado. Quien usa este
  // componente puede dejar de renderizarlo para cerrarlo, que es lo natural
  // cuando el contenido tiene que empezar de cero la proxima vez. En ese caso
  // el efecto de arriba no llega a correr: React ya quito el dialogo del
  // documento y el foco cae al body, dejando a quien navega con teclado al
  // principio de la pagina.
  useEffect(() => devolverFoco, []);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    // El navegador cierra con Escape por su cuenta. Se intercepta para que la
    // decision la tome siempre quien usa el componente: durante una subida hay
    // que confirmar antes de perderla.
    const alCancelar = (evento: Event) => {
      evento.preventDefault();
      onCerrar();
    };

    elemento.addEventListener("cancel", alCancelar);
    return () => elemento.removeEventListener("cancel", alCancelar);
  }, [onCerrar]);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="titulo-modal"
      className="m-auto w-[calc(100vw-2rem)] max-w-lg rounded-lg bg-white p-6 shadow-lg backdrop:bg-ink/60"
      // Clic sobre el fondo: el <dialog> ocupa solo la tarjeta, asi que un clic
      // cuyo destino es el propio dialogo cayo fuera del contenido.
      onClick={(evento) => {
        if (evento.target === dialogo.current) onCerrar();
      }}
    >
      <h2 id="titulo-modal" className="text-base font-semibold text-slate-900">
        {titulo}
      </h2>

      {descripcion && <p className="mt-2 text-sm text-slate-600">{descripcion}</p>}

      <div className="mt-6">{children}</div>
    </dialog>
  );
}
