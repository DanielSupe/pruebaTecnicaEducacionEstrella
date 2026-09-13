import { useQuery } from "@tanstack/react-query";
import { http, type ApiError } from "../lib/http.js";

type EstadoApi = {
  status: string;
  timestamp: string;
};

async function consultarEstado(): Promise<EstadoApi> {
  const { data } = await http.get<EstadoApi>("/health");
  return data;
}

export function HomePage() {
  const consulta = useQuery({ queryKey: ["health"], queryFn: consultarEstado });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Solicitud de crédito educativo
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Registra tu solicitud y adjunta el video de entrevista.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">Estado del servicio</h2>

        {consulta.isPending && <EsqueletoEstado />}

        {consulta.isError && (
          <ErrorEstado error={consulta.error} onReintentar={() => void consulta.refetch()} />
        )}

        {consulta.isSuccess && (
          <p className="mt-4 inline-flex items-center rounded-md bg-success-bg px-2 py-1 text-xs font-medium text-success">
            Conectado. El servicio responde correctamente.
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Esqueleto con la forma del contenido que va a llegar, no un indicador centrado:
 * asi el contenido no da un salto cuando la respuesta aterriza.
 */
function EsqueletoEstado() {
  return (
    <div className="mt-4 animate-pulse" aria-live="polite" aria-busy="true">
      <span className="sr-only">Consultando el estado del servicio…</span>
      <div className="h-6 w-64 rounded bg-slate-200" />
    </div>
  );
}

/**
 * Error al CARGAR una vista: va en linea, donde iria el contenido. Un modal sobre
 * una pantalla vacia deja al usuario cerrando una ventana para mirar la nada.
 */
function ErrorEstado({ error, onReintentar }: { error: ApiError; onReintentar: () => void }) {
  return (
    <div
      role="alert"
      className="mt-4 rounded-md border border-danger bg-danger-bg p-4 text-sm text-slate-700"
    >
      <p className="font-medium text-danger">No se pudo consultar el estado del servicio</p>
      <p className="mt-1">{error.message}</p>

      <button
        type="button"
        onClick={onReintentar}
        className="mt-4 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Reintentar
      </button>
    </div>
  );
}
