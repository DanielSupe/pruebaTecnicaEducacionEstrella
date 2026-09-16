import { useEffect, useId, useRef, useState } from "react";
import { coincidencias } from "./filtrar.js";

/**
 * Campo de texto con sugerencias que se filtran al escribir.
 *
 * SUGIERE, no obliga: lo escrito se acepta aunque no esté en la lista. Es
 * deliberado — el listado solo cubre instituciones colombianas de educación
 * superior, y exigir que el valor figure en él dejaría fuera a quien estudie en
 * el extranjero.
 *
 * Sigue la forma de Field.tsx (etiqueta, error bajo el campo, aria-invalid y
 * aria-describedby) para que el formulario no tenga dos estilos de campo.
 *
 * Se construye a mano en lugar de usar <datalist> porque el desplegable nativo lo
 * dibuja el navegador y se ve distinto en cada uno. El precio es tener que poner
 * a mano los roles ARIA y el teclado, que es justo lo que el nativo regala.
 */
export function Combobox({
  id,
  label,
  opciones,
  value,
  onChange,
  error,
  disabled,
  ayuda,
}: {
  id: string;
  label: string;
  opciones: readonly string[];
  value: string;
  onChange: (valor: string) => void;
  error?: string;
  disabled?: boolean;
  /** Texto bajo el campo cuando no hay error. */
  ayuda?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // Índice de la opción resaltada, o -1 si ninguna. No es lo mismo que el foco:
  // el foco se queda SIEMPRE en el campo para que se pueda seguir escribiendo.
  const [resaltada, setResaltada] = useState(-1);

  const campo = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const idLista = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  const { visibles, total } = coincidencias(opciones, value);
  const hayOpciones = visibles.length > 0;

  // Clic fuera: cierra sin tocar lo escrito.
  useEffect(() => {
    if (!abierto) return;

    const alPulsar = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };

    document.addEventListener("mousedown", alPulsar);
    return () => document.removeEventListener("mousedown", alPulsar);
  }, [abierto]);

  function elegir(opcion: string) {
    onChange(opcion);
    setAbierto(false);
    setResaltada(-1);
    // El foco vuelve al campo: quien navega con teclado no debe quedarse sin
    // punto de partida al cerrarse la lista.
    campo.current?.focus();
  }

  function alEscribir(valor: string) {
    onChange(valor);
    setAbierto(true);
    setResaltada(-1);
  }

  function alPulsarTecla(evento: React.KeyboardEvent<HTMLInputElement>) {
    // Tabulador NO se intercepta: sale del campo conservando lo escrito, que es
    // lo que espera quien no quiere ninguna sugerencia.
    if (evento.key === "Escape") {
      setAbierto(false);
      setResaltada(-1);
      return;
    }

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
      evento.preventDefault();

      if (!abierto) {
        setAbierto(true);
        return;
      }

      if (!hayOpciones) return;

      const paso = evento.key === "ArrowDown" ? 1 : -1;
      // Da la vuelta por los dos extremos: llegar al final y quedarse atascado
      // obliga a recorrer la lista entera para volver arriba.
      setResaltada((actual) => (actual + paso + visibles.length) % visibles.length);
      return;
    }

    if (evento.key === "Enter" && abierto && resaltada >= 0) {
      // Solo se intercepta si hay algo resaltado: si no, Enter debe enviar el
      // formulario como en cualquier otro campo.
      evento.preventDefault();
      const opcion = visibles[resaltada];
      if (opcion) elegir(opcion);
    }
  }

  const idOpcionResaltada = resaltada >= 0 ? `${idLista}-${String(resaltada)}` : undefined;

  return (
    <div ref={contenedor} className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        ref={campo}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={idOpcionResaltada}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : ayuda ? idAyuda : undefined}
        disabled={disabled}
        value={value}
        onChange={(e) => alEscribir(e.target.value)}
        onFocus={() => setAbierto(true)}
        onKeyDown={alPulsarTecla}
        className={[
          "mt-2 block w-full rounded-md border px-3 py-3 text-sm text-slate-900",
          "placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:bg-slate-50 disabled:text-slate-400",
          error
            ? "border-danger focus-visible:ring-danger"
            : "border-slate-300 focus-visible:ring-brand",
        ].join(" ")}
      />

      {/* Cuántas opciones hay, para quien no las ve. Se anuncia sin robar el
          foco, que sigue en el campo mientras se escribe. */}
      <p className="sr-only" aria-live="polite">
        {abierto
          ? total === 0
            ? "Ninguna institución coincide"
            : `${String(total)} instituciones disponibles`
          : ""}
      </p>

      {abierto && (
        <ul
          id={idLista}
          role="listbox"
          aria-label={label}
          className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
        >
          {/* Sin coincidencias se dice que no hay. Ofrecer el listado entero le
              diría al usuario que su búsqueda encontró algo. */}
          {!hayOpciones && (
            <li className="px-3 py-3 text-sm text-slate-600">
              Ninguna institución coincide. Puedes escribir el nombre completo.
            </li>
          )}

          {visibles.map((opcion, indice) => (
            <li
              key={opcion}
              id={`${idLista}-${String(indice)}`}
              role="option"
              aria-selected={indice === resaltada}
              // El ratón resalta lo mismo que las flechas, para que no haya dos
              // nociones distintas de "la opción actual".
              onMouseEnter={() => setResaltada(indice)}
              // mousedown y no click: el click llega después de que el campo
              // pierda el foco, y para entonces la lista ya se cerró.
              onMouseDown={(e) => {
                e.preventDefault();
                elegir(opcion);
              }}
              className={[
                "cursor-pointer px-3 py-3 text-sm",
                indice === resaltada ? "bg-brand-subtle text-brand" : "text-slate-700",
              ].join(" ")}
            >
              {opcion}
            </li>
          ))}

          {total > visibles.length && (
            <li className="px-3 py-2 text-xs text-slate-500">
              {String(total - visibles.length)} más. Sigue escribiendo para acotar.
            </li>
          )}
        </ul>
      )}

      {error ? (
        <p id={idError} className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : ayuda ? (
        <p id={idAyuda} className="mt-2 text-xs text-slate-500">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
