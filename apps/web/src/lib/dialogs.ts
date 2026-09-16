import Swal from "sweetalert2";

const BOTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors";

const estilos = {
  popup: "rounded-lg bg-white p-6 shadow-lg",
  title: "text-base font-semibold text-slate-900",
  htmlContainer: "text-sm text-slate-600",
  actions: "flex justify-end gap-3 w-full",
  confirmButton: `${BOTON_BASE} bg-brand text-white hover:bg-brand-hover`,
  denyButton: `${BOTON_BASE} bg-danger text-white hover:brightness-90`,
  cancelButton: `${BOTON_BASE} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`,
};

// This is NOT a z-index problem, however much it looks like one. A dialog opened
// with showModal() lives in the browser's top layer, above the whole document,
// where z-index does not reach: an element with z-index 2147483647 still renders
// behind it. Rendering the alert INSIDE the dialog is the only thing that puts it
// in that same layer.
//
// Resolved automatically, with no parameter: if every screen had to remember to
// pass it, forgetting would reproduce this exact bug with no symptom until someone
// opens that particular dialog.
function destino(): HTMLElement | undefined {
  return document.querySelector<HTMLDialogElement>("dialog[open]") ?? undefined;
}

const base = {
  buttonsStyling: false,
  showClass: { popup: "" },
  hideClass: { popup: "" },
  customClass: estilos,
} as const;

export type OpcionesConfirmacion = {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  /** Destructive action: changes the colour of the confirm button. */
  destructiva?: boolean;
};

// Focus starts on cancel on purpose: Enter must not trigger something the user
// has not read yet.
export async function confirmar({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  destructiva = false,
}: OpcionesConfirmacion): Promise<boolean> {
  const resultado = await Swal.fire({
    ...base,
    target: destino(),
    title: titulo,
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: textoConfirmar,
    cancelButtonText: "Cancelar",
    focusCancel: true,
    customClass: destructiva ? { ...estilos, confirmButton: estilos.denyButton } : estilos,
  });

  return resultado.isConfirmed;
}

export type OpcionesAviso = {
  titulo: string;
  mensaje: string;
  /** Where focus goes on close, so the user lands back on the field to fix. */
  devolverFocoA?: HTMLElement | null;
};

export async function avisarError({
  titulo,
  mensaje,
  devolverFocoA,
}: OpcionesAviso): Promise<void> {
  await Swal.fire({
    ...base,
    target: destino(),
    title: titulo,
    text: mensaje,
    confirmButtonText: "Entendido",
  });

  devolverFocoA?.focus();
}

export async function avisarExito({ titulo, mensaje }: OpcionesAviso): Promise<void> {
  await Swal.fire({
    ...base,
    target: destino(),
    title: titulo,
    text: mensaje,
    confirmButtonText: "Continuar",
  });
}
