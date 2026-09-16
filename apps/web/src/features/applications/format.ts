// The formatters are built ONCE, outside the functions: constructing an Intl
// formatter is expensive and this runs once per row.

const FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const MONTO = new Intl.NumberFormat("es-CO");

export function fechaLegible(iso: string): string {
  const fecha = new Date(iso);

  // An unparseable instant must not break the whole row.
  return Number.isNaN(fecha.getTime()) ? "—" : FECHA.format(fecha);
}

// No currency is persisted, so printing a symbol would assert something the data
// does not contain. The unit lives in the column header.
export function montoLegible(valor: number): string {
  return Number.isFinite(valor) ? MONTO.format(valor) : "—";
}

// The two colours are not decorative: amber means something is waiting on the
// user, brand means it is under way with nothing to do.
const ESTADOS: Record<string, { texto: string; clases: string }> = {
  PENDING_VIDEO: { texto: "Video pendiente", clases: "bg-warning-bg text-warning" },
  UNDER_REVIEW: { texto: "En revisión", clases: "bg-brand-subtle text-brand" },
};

const DESCONOCIDO = { texto: "Estado desconocido", clases: "bg-slate-100 text-slate-600" };

// A status this version does not know must NOT break the row: an API that adds
// states should not leave the user staring at a broken screen.
export function distintivoDeEstado(estado: string): { texto: string; clases: string } {
  return ESTADOS[estado] ?? DESCONOCIDO;
}
