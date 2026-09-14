import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "sutil" | "sutil-oscuro";
  /** Texto que sustituye al contenido mientras la accion esta en curso. */
  cargando?: string;
};

/**
 * Cada variante trae SU color de anillo de foco, no solo sus colores de fondo.
 * El anillo de la marca es oscuro y sobre fondo petroleo no se distinguiria,
 * que es justo cuando mas falta hace. Y va aqui y no en las clases base porque
 * entre dos utilidades del mismo tipo gana la que Tailwind emite mas tarde en
 * la hoja, no la que se escriba despues: dejar un color en la base y otro en la
 * variante es una carrera que no se controla.
 */
const VARIANTES = {
  primario: "bg-brand text-white hover:bg-brand-hover focus-visible:ring-brand",
  secundario:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-brand",
  sutil: "text-slate-600 hover:bg-slate-100 focus-visible:ring-brand",
  "sutil-oscuro":
    "text-slate-300 hover:bg-white/10 hover:text-white focus-visible:ring-brand-accent focus-visible:ring-offset-ink",
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
        "transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
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
