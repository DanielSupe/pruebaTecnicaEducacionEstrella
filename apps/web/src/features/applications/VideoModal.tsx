import { useQuery } from "@tanstack/react-query";
import type { VideoLink } from "@educacion-estrella/shared";
import { Modal } from "../../components/Modal.js";
import { Button } from "../../components/Button.js";
import { http } from "../../lib/http.js";

// The link is requested ON OPEN and never kept: it expires in fifteen minutes and
// carries the signature inside, so it is a credential. Caching it "for next time"
// would produce a baffling failure later and extend the life of something meant to
// be short.
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

        {/* Explained in the same dialog it was asked from, which is where whoever
            asked is looking. */}
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
