import { useQuery } from "@tanstack/react-query";
import type { VideoLink } from "@educacion-estrella/shared";
import { Modal } from "../../components/Modal.js";
import { Button } from "../../components/Button.js";
import { http } from "../../lib/http.js";

/**
 * Reproduce el video de una solicitud ya enviada.
 *
 * El enlace se pide AL ABRIR y no se guarda para reutilizarlo: caduca a los
 * quince minutos y lleva la firma dentro, asi que es una credencial. Cachearlo
 * "para la proxima vez" produciria un fallo incomprensible mas tarde, y
 * alargaria la vida de algo pensado para durar poco.
 */
async function pedirEnlace(applicationId: string): Promise<VideoLink> {
  const { data } = await http.get<VideoLink>(`/applications/${applicationId}/video-url`);
  return data;
}

export function VideoModal({
  applicationId,
  abierto,
  onCerrar,
}: {
  applicationId: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const consulta = useQuery({
    queryKey: ["video-url", applicationId],
    queryFn: () => pedirEnlace(applicationId),
    // Solo se pide cuando la ventana esta abierta, y nunca se reutiliza el
    // anterior: el enlace caduca.
    enabled: abierto,
    gcTime: 0,
    staleTime: 0,
  });

  return (
    <Modal abierto={abierto} titulo="Video de la entrevista" onCerrar={onCerrar}>
      <div className="space-y-6">
        {consulta.isPending && (
          <div
            className="aspect-video w-full animate-pulse rounded-md bg-slate-200"
            aria-busy="true"
          >
            <span className="sr-only">Preparando el video…</span>
          </div>
        )}

        {/* El fallo se explica en la misma ventana desde la que se pidio, que es
            donde esta mirando quien lo pidio. */}
        {consulta.isError && (
          <div
            role="alert"
            className="rounded-md border border-danger bg-danger-bg p-4 text-sm text-slate-700"
          >
            <p className="font-medium text-danger">No se pudo abrir el video</p>
            <p className="mt-1">{consulta.error.message}</p>

            <Button
              type="button"
              variante="secundario"
              className="mt-4"
              onClick={() => void consulta.refetch()}
            >
              Reintentar
            </Button>
          </div>
        )}

        {consulta.isSuccess && (
          <video src={consulta.data.url} controls className="aspect-video w-full rounded-md bg-ink">
            Tu navegador no puede reproducir este video.
          </video>
        )}

        <div className="flex justify-end">
          <Button type="button" variante="secundario" onClick={onCerrar}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
