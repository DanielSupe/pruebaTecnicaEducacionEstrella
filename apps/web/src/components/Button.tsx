import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "primario" | "secundario" | "sutil" | "sutil-oscuro";
  /** Text replacing the content while the action is in flight. */
  cargando?: string;
};

// Each variant brings ITS OWN focus ring colour. It lives here and not in the base
// classes because between two utilities of the same kind the winner is whichever
// Tailwind emits later in the sheet, not whichever is written later.
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
      {/* The text changes but does not disappear, so the button keeps its width
          and the surrounding content does not jump. */}
      {cargando ?? children}
    </button>
  );
}
