// Without an indicator the user cannot tell "uploading" from "hung", and the
// natural reaction is to reload and ruin it.
export function ProgressBar({ porcentaje, etiqueta }: { porcentaje: number; etiqueta: string }) {
  const valor = Math.min(100, Math.max(0, Math.round(porcentaje)));

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-700">{etiqueta}</p>
        <p className="text-sm tabular-nums text-slate-600" aria-live="polite">
          {valor}%
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuenow={valor}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={etiqueta}
        className="mt-2 h-2 w-full overflow-hidden rounded-md bg-slate-200"
      >
        <div
          className="h-full rounded-md bg-brand transition-[width] duration-200"
          style={{ width: `${String(valor)}%` }}
        />
      </div>
    </div>
  );
}
