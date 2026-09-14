import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { Application } from "@educacion-estrella/shared";
import type { ApiError } from "../lib/http.js";
import { Button } from "../components/Button.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { applicationsQuery, solicitudesDe } from "../features/applications/list.js";
import { fechaLegible, montoLegible } from "../features/applications/format.js";
import { RetryUploadModal } from "../features/applications/RetryUploadModal.js";
import { VideoModal } from "../features/applications/VideoModal.js";

/** Ventana abierta sobre una solicitud concreta, o ninguna. */
type Ventana = { tipo: "subir" | "ver"; applicationId: string } | null;

export function ApplicationsPage() {
  const consulta = useInfiniteQuery(applicationsQuery);
  const [ventana, setVentana] = useState<Ventana>(null);

  const solicitudes = solicitudesDe(consulta.data?.pages);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mis solicitudes</h1>
      <p className="mt-2 text-sm text-slate-600">
        Aquí figuran las solicitudes que has enviado, con su estado y su fecha.
      </p>

      <div className="mt-8">
        {consulta.isPending && <Esqueleto />}

        {consulta.isError && (
          <ErrorDeCarga error={consulta.error} onReintentar={() => void consulta.refetch()} />
        )}

        {consulta.isSuccess && solicitudes.length === 0 && <SinSolicitudes />}

        {consulta.isSuccess && solicitudes.length > 0 && (
          <>
            <Tabla solicitudes={solicitudes} onAbrir={setVentana} />
            <Tarjetas solicitudes={solicitudes} onAbrir={setVentana} />

            {consulta.hasNextPage && (
              <div className="mt-6 flex justify-center">
                <Button
                  type="button"
                  variante="secundario"
                  onClick={() => void consulta.fetchNextPage()}
                  cargando={consulta.isFetchingNextPage ? "Cargando…" : undefined}
                >
                  Cargar más
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Las ventanas se montan con la solicitud sobre la que se abrieron. La
          clave las obliga a empezar de cero al cambiar de solicitud, en vez de
          arrastrar el archivo elegido para otra. */}
      {ventana?.tipo === "subir" && (
        <RetryUploadModal
          key={ventana.applicationId}
          applicationId={ventana.applicationId}
          abierto
          onCerrar={() => setVentana(null)}
        />
      )}

      {ventana?.tipo === "ver" && (
        <VideoModal
          key={ventana.applicationId}
          applicationId={ventana.applicationId}
          abierto
          onCerrar={() => setVentana(null)}
        />
      )}
    </div>
  );
}

/** Una accion por fila: la que corresponde al estado en que esta. */
function Accion({
  solicitud,
  onAbrir,
}: {
  solicitud: Application;
  onAbrir: (ventana: Ventana) => void;
}) {
  if (solicitud.status === "PENDING_VIDEO") {
    return (
      <Button
        type="button"
        variante="secundario"
        onClick={() => onAbrir({ tipo: "subir", applicationId: solicitud.applicationId })}
      >
        Subir video
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variante="sutil"
      onClick={() => onAbrir({ tipo: "ver", applicationId: solicitud.applicationId })}
    >
      Ver video
    </Button>
  );
}

/**
 * Tabla, a partir de 768 px.
 *
 * Lo que se duplica entre esta y las tarjetas es la DISPOSICION, no la logica:
 * el distintivo y la accion salen de los mismos componentes.
 */
function Tabla({
  solicitudes,
  onAbrir,
}: {
  solicitudes: Application[];
  onAbrir: (ventana: Ventana) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-medium tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Institución</th>
            <th className="px-4 py-3 font-medium">Programa</th>
            <th className="px-4 py-3 font-medium">Monto (COP)</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="w-px px-4 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map((solicitud) => (
            <tr key={solicitud.applicationId} className="border-t border-slate-200">
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                {fechaLegible(solicitud.createdAt)}
              </td>
              <td className="px-4 py-3 text-slate-900">{solicitud.institution}</td>
              <td className="px-4 py-3 text-slate-600">{solicitud.program}</td>
              <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-900">
                {montoLegible(solicitud.amount)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge estado={solicitud.status} />
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <Accion solicitud={solicitud} onAbrir={onAbrir} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Tarjetas, por debajo de 768 px.
 *
 * Son seis columnas: forzar desplazamiento horizontal seria la salida perezosa.
 */
function Tarjetas({
  solicitudes,
  onAbrir,
}: {
  solicitudes: Application[];
  onAbrir: (ventana: Ventana) => void;
}) {
  return (
    <ul className="space-y-3 md:hidden">
      {solicitudes.map((solicitud) => (
        <li
          key={solicitud.applicationId}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium text-slate-900">{solicitud.institution}</p>
            <StatusBadge estado={solicitud.status} />
          </div>

          <p className="mt-1 text-sm text-slate-600">{solicitud.program}</p>

          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-slate-500">Fecha</dt>
              <dd className="text-slate-700">{fechaLegible(solicitud.createdAt)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-slate-500">Monto (COP)</dt>
              <dd className="tabular-nums text-slate-700">{montoLegible(solicitud.amount)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex justify-end">
            <Accion solicitud={solicitud} onAbrir={onAbrir} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Esqueleto con la forma del contenido que va a llegar, no un indicador
 * centrado: asi la pagina no da un salto cuando la respuesta aterriza.
 */
function Esqueleto() {
  return (
    <div className="animate-pulse space-y-3" aria-live="polite" aria-busy="true">
      <span className="sr-only">Cargando tus solicitudes…</span>
      {[0, 1, 2].map((fila) => (
        <div key={fila} className="h-20 rounded-lg bg-slate-200" />
      ))}
    </div>
  );
}

/**
 * No tener solicitudes es el estado normal de quien acaba de registrarse, no un
 * error. Y dice QUE HACER: una tabla vacia sin explicacion deja al usuario
 * preguntandose si fallo algo.
 */
function SinSolicitudes() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white py-12 text-center">
      <p className="text-base font-medium text-slate-900">Todavía no has enviado ninguna</p>
      <p className="mx-auto mt-1 max-w-sm px-4 text-sm text-slate-600">
        Cuando envíes tu primera solicitud de crédito aparecerá aquí, con su estado y su fecha.
      </p>

      <Link
        to="/solicitudes/nueva"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-brand px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Crear mi primera solicitud
      </Link>
    </div>
  );
}

/**
 * Error al CARGAR la vista: va en linea, donde iria el contenido. Una ventana
 * emergente sobre una pantalla vacia deja al usuario cerrandola para mirar la
 * nada.
 */
function ErrorDeCarga({ error, onReintentar }: { error: ApiError; onReintentar: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger bg-danger-bg p-4 text-sm text-slate-700"
    >
      <p className="font-medium text-danger">No se pudieron cargar tus solicitudes</p>
      <p className="mt-1">{error.message}</p>

      <Button type="button" variante="secundario" className="mt-4" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}
