import { useRef } from "react";
import { VIDEO_CONTENT_TYPES } from "@educacion-estrella/shared";
import { tamanoLegible } from "../features/applications/schema.js";
import { Button } from "./Button.js";

const ACEPTADOS = Object.keys(VIDEO_CONTENT_TYPES).join(",");

/**
 * Selector del video.
 *
 * El atributo accept filtra lo que ofrece el dialogo del sistema, pero es una
 * ayuda, NO una validacion: se puede elegir cualquier archivo arrastrandolo o
 * cambiando el filtro. La comprobacion real la hace el esquema.
 */
export function FileField({
  id,
  label,
  archivo,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  archivo: File | null;
  error?: string;
  disabled?: boolean;
  onChange: (archivo: File | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const idError = `${id}-error`;

  return (
    <div>
      <span id={`${id}-label`} className="block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button
          type="button"
          variante="secundario"
          disabled={disabled}
          onClick={() => input.current?.click()}
          aria-describedby={error ? idError : undefined}
        >
          {archivo ? "Cambiar video" : "Seleccionar video"}
        </Button>

        <p className="min-w-0 text-sm text-slate-600">
          {archivo ? (
            <span className="block truncate">
              {archivo.name} · {tamanoLegible(archivo.size)}
            </span>
          ) : (
            <span className="text-slate-500">Ningún archivo seleccionado</span>
          )}
        </p>
      </div>

      <input
        ref={input}
        id={id}
        type="file"
        accept={ACEPTADOS}
        className="sr-only"
        aria-labelledby={`${id}-label`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {error ? (
        <p id={idError} className="mt-2 text-xs text-danger">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Formatos .mp4 o .webm, hasta 200 MB.</p>
      )}
    </div>
  );
}
