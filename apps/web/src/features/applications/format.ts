/**
 * Formato de los datos de una solicitud para mostrarlos.
 *
 * Los formateadores se crean UNA vez, fuera de las funciones: construir un
 * Intl.DateTimeFormat es caro y aqui se llama una vez por fila.
 */

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const MONTO = new Intl.NumberFormat("es-CO");

/**
 * Fecha legible a partir del instante que devuelve la API.
 *
 * Solo la fecha, sin hora: en un listado de solicitudes el minuto exacto no
 * ayuda a nadie a distinguir una de otra, y ocupa ancho que en movil hace falta.
 */
export function fechaLegible(iso: string): string {
  const fecha = new Date(iso);

  // Un instante que no se puede interpretar no debe romper la fila entera: se
  // muestra un hueco y el resto de la solicitud se sigue viendo.
  return Number.isNaN(fecha.getTime()) ? "—" : FECHA.format(fecha);
}

/**
 * Monto agrupado y SIN simbolo de moneda.
 *
 * No se persiste ninguna moneda, asi que pintar un simbolo afirmaria algo que
 * el dato no contiene. La unidad va en la cabecera de la columna.
 */
export function montoLegible(valor: number): string {
  return Number.isFinite(valor) ? MONTO.format(valor) : "—";
}

/**
 * Estados, tal y como se le muestran a una persona.
 *
 * Los dos colores no son decorativos. El ambar marca lo que espera algo del
 * usuario; el de marca, lo que sigue su curso sin que tenga que hacer nada. Es
 * la diferencia que determina si hay que actuar.
 */
const ESTADOS: Record<string, { texto: string; clases: string }> = {
  PENDING_VIDEO: { texto: "Video pendiente", clases: "bg-warning-bg text-warning" },
  UNDER_REVIEW: { texto: "En revisión", clases: "bg-brand-subtle text-brand" },
};

const DESCONOCIDO = { texto: "Estado desconocido", clases: "bg-slate-100 text-slate-600" };

/**
 * Texto y color de un estado.
 *
 * Un estado que esta version no conocia NO debe romper la fila: la solicitud se
 * sigue viendo con el resto de sus datos. Una API que anada estados no deberia
 * dejar al usuario ante una pantalla rota.
 */
export function distintivoDeEstado(estado: string): { texto: string; clases: string } {
  return ESTADOS[estado] ?? DESCONOCIDO;
}
