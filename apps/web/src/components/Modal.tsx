import { useEffect, useRef, type ReactNode } from "react";

// Built on the browser's <dialog>, not on SweetAlert2. That library takes HTML,
// not components, so live state inside it would need a React portal and two
// lifecycles kept in sync. See lib/dialogs.ts for the alerts.
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
  onCerrar: () => void;
  children: ReactNode;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);
  // Whoever had focus when it opened, to hand it back on close.
  const focoPrevio = useRef<HTMLElement | null>(null);

  // The reference is NOT cleared afterwards. Clearing it looks prudent "so focus
  // is not restored twice", but React mounts, unmounts and remounts on purpose in
  // development: that cleanup took the reference on the fake unmount, and on
  // remount the dialog was already open so it was never recaptured. Focusing the
  // same element twice does nothing; losing the reference does.
  function devolverFoco() {
    focoPrevio.current?.focus();
  }

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    if (abierto) {
      // Captured only if nothing was stored: the opener is who had focus the
      // FIRST time, not on a remount.
      focoPrevio.current ??= document.activeElement as HTMLElement | null;

      // showModal, not the open attribute: only it makes the dialog truly modal
      // (inert background, trapped focus).
      if (!elemento.open) elemento.showModal();
    }

    if (!abierto && elemento.open) {
      elemento.close();
      devolverFoco();
    }
  }, [abierto]);

  // Also on UNMOUNT, not only on closing. Callers may stop rendering this to
  // close it, and then the effect above never runs: React has already removed the
  // dialog and focus falls to the body.
  useEffect(() => devolverFoco, []);

  useEffect(() => {
    const elemento = dialogo.current;
    if (!elemento) return;

    // The browser closes on Escape by itself. Intercepted so the caller always
    // decides: during an upload it must confirm first.
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
      // The <dialog> box is only the card, so a click targeting it landed outside
      // the content.
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
