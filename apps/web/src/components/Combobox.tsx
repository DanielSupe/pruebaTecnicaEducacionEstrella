import { useEffect, useId, useRef, useState } from "react";
import { coincidencias } from "./filtrar.js";

// SUGGESTS, it does not restrict: typed text is accepted even when absent from the
// list. The dataset only covers Colombian higher education, so requiring a match
// would shut out anyone studying abroad.
//
// Hand-built instead of <datalist> because the native dropdown is drawn by the
// browser and looks different in each one.
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
  /** Help text shown below the field when there is no error. */
  ayuda?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  // Highlighted option, or -1. Not the same as focus: focus stays ALWAYS on the
  // input so typing can continue.
  const [resaltada, setResaltada] = useState(-1);

  const campo = useRef<HTMLInputElement>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const idLista = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;

  const { visibles, total } = coincidencias(opciones, value);
  const hayOpciones = visibles.length > 0;

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
    // Focus returns to the input so keyboard users keep a starting point.
    campo.current?.focus();
  }

  function alEscribir(valor: string) {
    onChange(valor);
    setAbierto(true);
    setResaltada(-1);
  }

  function alPulsarTecla(evento: React.KeyboardEvent<HTMLInputElement>) {
    // Tab is NOT intercepted: it leaves the field keeping what was typed.
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
      setResaltada((actual) => (actual + paso + visibles.length) % visibles.length);
      return;
    }

    if (evento.key === "Enter" && abierto && resaltada >= 0) {
      // Only intercepted when something is highlighted: otherwise Enter must
      // submit the form as in any other field.
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
          {/* Offering the whole list here would tell the user their search
              matched something. */}
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
              // The mouse highlights the same thing as the arrows.
              onMouseEnter={() => setResaltada(indice)}
              // mousedown, not click: click arrives after the input loses focus,
              // and by then the list has already closed.
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
