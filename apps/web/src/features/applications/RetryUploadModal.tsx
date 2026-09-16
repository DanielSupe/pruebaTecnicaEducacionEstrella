import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { videoFileSchema } from "@educacion-estrella/shared";
import { Modal } from "../../components/Modal.js";
import { Button } from "../../components/Button.js";
import { FileField } from "../../components/FileField.js";
import { ProgressBar } from "../../components/ProgressBar.js";
import { confirmar } from "../../lib/dialogs.js";
import { applicationsQueryKey } from "./list.js";
import {
  renovarAutorizacion,
  transferirVideo,
  avisarSubidaCompletada,
  esCancelacion,
} from "./upload.js";

// Deliberately NOT called resuming, neither in the code nor in the interface: a
// File does not survive a reload, so the browser no longer has it. Promising to
// resume and then asking for the video again reads as a failure.
//
// What IS reused is the APPLICATION: a new authorization over the same one, rather
// than registering another.
export function RetryUploadModal({
  applicationId,
  abierto,
  onCerrar,
}: {
  applicationId: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | undefined>();
  const [errorSubida, setErrorSubida] = useState<string | undefined>();
  const [progreso, setProgreso] = useState<number | null>(null);

  const cancelacion = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const subiendo = progreso !== null;

  function elegir(nuevo: File | null) {
    setArchivo(nuevo);
    setErrorArchivo(undefined);
    setErrorSubida(undefined);
  }

  async function subir() {
    if (!archivo) {
      setErrorArchivo("Selecciona el video de la entrevista");
      return;
    }

    // Validated BEFORE transferring, with the same schema the server applies.
    const valido = videoFileSchema.safeParse({
      contentType: archivo.type,
      sizeBytes: archivo.size,
    });

    if (!valido.success) {
      setErrorArchivo(valido.error.issues[0]?.message ?? "El video no es válido");
      return;
    }

    const control = new AbortController();
    cancelacion.current = control;
    setErrorSubida(undefined);
    setProgreso(0);

    try {
      // The previous authorization may have expired: a new one over the SAME
      // application.
      const autorizacion = await renovarAutorizacion(applicationId);

      await transferirVideo(autorizacion, archivo, {
        onProgreso: setProgreso,
        signal: control.signal,
      });

      await avisarSubidaCompletada(applicationId);
    } catch (error) {
      // Cancelling is deliberate: without this distinction the user would get an
      // error for something they just asked for.
      if (esCancelacion(error)) return;

      setErrorSubida(
        error instanceof Error ? error.message : "No pudimos subir el video. Inténtalo de nuevo.",
      );
      return;
    } finally {
      cancelacion.current = null;
      setProgreso(null);
    }

    // The row changes state without anyone reloading.
    await queryClient.invalidateQueries({ queryKey: applicationsQueryKey });
    cerrarYLimpiar();
  }

  function cerrarYLimpiar() {
    setArchivo(null);
    setErrorArchivo(undefined);
    setErrorSubida(undefined);
    onCerrar();
  }

  async function intentarCerrar() {
    if (!subiendo) {
      cerrarYLimpiar();
      return;
    }

    // Losing an almost-finished upload to a stray click is worse than one extra
    // click.
    const confirmado = await confirmar({
      titulo: "¿Cancelar la subida?",
      mensaje: "Se detendrá la transferencia y tendrás que volver a subir el video.",
      textoConfirmar: "Cancelar subida",
      destructiva: true,
    });

    if (!confirmado) return;

    // Aborts the request for real, not just hides the progress.
    cancelacion.current?.abort();
    cerrarYLimpiar();
  }

  return (
    <Modal
      abierto={abierto}
      titulo="Subir el video de la entrevista"
      descripcion="Esta solicitud ya está registrada. Solo falta su video."
      onCerrar={() => void intentarCerrar()}
    >
      <div className="space-y-6">
        <FileField
          id={`video-${applicationId}`}
          label="Video de la entrevista"
          archivo={archivo}
          error={errorArchivo}
          disabled={subiendo}
          onChange={elegir}
        />

        {subiendo && (
          <div>
            <ProgressBar porcentaje={progreso} etiqueta="Subiendo el video" />
            <p className="mt-3 text-xs text-slate-500">
              No cierres esta ventana hasta que termine.
            </p>
          </div>
        )}

        {/* Explained in here with the retry one click away: forcing a close
            and a hunt for the button meets the letter and not the intent. */}
        {errorSubida && (
          <div
            role="alert"
            className="rounded-md border border-danger bg-danger-bg p-4 text-sm text-slate-700"
          >
            <p className="font-medium text-danger">No se pudo subir el video</p>
            <p className="mt-1">{errorSubida}</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variante="secundario" onClick={() => void intentarCerrar()}>
            {subiendo ? "Cancelar subida" : "Cerrar"}
          </Button>

          {!subiendo && (
            <Button type="button" onClick={() => void subir()}>
              {errorSubida ? "Reintentar" : "Subir video"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
