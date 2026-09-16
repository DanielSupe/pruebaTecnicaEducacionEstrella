import Swal from "sweetalert2";

/**
 * Ventanas emergentes de la aplicacion.
 *
 * Este es el UNICO archivo que conoce la libreria. Las pantallas llaman a
 * funciones con nombre de intencion, no a la API de SweetAlert2. Si manana se
 * cambia de libreria, se reescribe este archivo y ninguna pantalla se entera.
 *
 * El aspecto por omision de la libreria es el mas reconocible de la web
 * (tarjeta blanca con icono grande animado). Sin tematizar, delata que se uso
 * una libreria, asi que aqui hereda los tokens del sistema de diseno y los
 * iconos animados quedan desactivados.
 */

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

/**
 * Donde se dibuja el aviso.
 *
 * NO es un problema de z-index, aunque lo parezca. Una ventana abierta con
 * showModal() vive en el "top layer" del navegador: una capa por encima de todo
 * el documento a la que z-index NO llega. Se comprobo: un elemento con
 * z-index 2147483647 —el maximo posible— sigue quedando detras.
 *
 * Lo unico que situa el aviso en esa misma capa es renderizarlo DENTRO de la
 * ventana. Por eso se busca una abierta y se usa como contenedor.
 *
 * Se resuelve solo, sin parametro, a proposito: si cada pantalla tuviera que
 * acordarse de indicarlo, olvidarlo reproduciria este mismo fallo, y no da
 * ningun sintoma hasta que alguien abre esa ventana concreta.
 */
function destino(): HTMLElement | undefined {
  return document.querySelector<HTMLDialogElement>("dialog[open]") ?? undefined;
}

/** Base comun: sin estilos propios de la libreria y sin iconos animados. */
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
  /** Marca la accion como destructiva: cambia el color del boton que confirma. */
  destructiva?: boolean;
};

/**
 * Confirma una accion con consecuencia.
 *
 * El foco arranca en cancelar a proposito: la tecla Enter no debe disparar algo
 * que el usuario no ha leido todavia.
 */
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
  /**
   * Elemento al que devolver el foco al cerrar. En un formulario esto importa:
   * sin ello el usuario cierra la ventana y tiene que volver a buscar el campo
   * que debe corregir.
   */
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
