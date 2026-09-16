import { distintivoDeEstado } from "../features/applications/format.js";

// Carries TEXT, not only colour: whoever cannot tell the shades apart must still
// be able to read the state.
export function StatusBadge({ estado }: { estado: string }) {
  const { texto, clases } = distintivoDeEstado(estado);

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap ${clases}`}
    >
      {texto}
    </span>
  );
}
