import type { InputHTMLAttributes, Ref } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Campo de formulario con su etiqueta y su error.
 *
 * El error se enlaza con aria-describedby y el campo se marca con aria-invalid:
 * sin eso, quien use un lector de pantalla oye el campo pero no por que esta mal.
 * El placeholder no sustituye a la etiqueta, porque desaparece justo cuando hace
 * falta leerla.
 */
export function Field({ id, label, error, ref, className, ...props }: FieldProps) {
  const idError = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input
        {...props}
        id={id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? idError : undefined}
        className={[
          "mt-2 block w-full rounded-md border px-3 py-3 text-sm text-slate-900",
          "placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
          "disabled:bg-slate-50 disabled:text-slate-400",
          error
            ? "border-danger focus-visible:ring-danger"
            : "border-slate-300 focus-visible:ring-brand",
          className ?? "",
        ].join(" ")}
      />

      {error && (
        <p id={idError} className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
