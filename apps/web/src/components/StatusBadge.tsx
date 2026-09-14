import { distintivoDeEstado } from "../features/applications/format.js";

/**
 * Distintivo de estado de una solicitud.
 *
 * Lleva TEXTO, no solo color: quien no distinga los tonos tiene que poder leer
 * en que estado esta. Y el texto es el del dominio en espanol, nunca el
 * identificador interno.
 *
 * La traduccion vive en format.ts, con la de la fecha y el monto: son la misma
 * clase de decision y ademas asi se puede probar sin montar React.
 */
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
