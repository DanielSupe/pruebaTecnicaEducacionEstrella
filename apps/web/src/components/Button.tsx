import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "sutil";
  /** Texto que sustituye al contenido mientras la accion esta en curso. */
  cargando?: string;
};

const VARIANTES = {
  primario: "bg-brand text-white hover:bg-brand-hover",
  secundario: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  sutil: "text-slate-600 hover:bg-slate-100",
} as const;

export function Button({
  variante = "primario",
  cargando,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const enCurso = Boolean(cargando);

  return (
    <button
      {...props}
      disabled={disabled ?? enCurso}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium",
        "transition-colors focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTES[variante],
        className ?? "",
      ].join(" ")}
    >
      {/* Al cargar cambia el texto pero no desaparece: asi el boton conserva su
          ancho y el contenido de alrededor no da un salto. */}
      {cargando ?? children}
    </button>
  );
}
