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

/**
 * Completa la subida de una solicitud que quedo pendiente de video.
 *
 * Deliberadamente NO se llama reanudar, ni en el codigo ni en la interfaz. Un
 * File no sobrevive a una recarga: cuando alguien vuelve al listado, el
 * navegador ya no tiene el archivo. Prometer "reanudar" y acto seguido pedir el
 * video otra vez se lee como un fallo de la aplicacion.
 *
 * Lo que si se reutiliza es la SOLICITUD: se pide una autorizacion nueva sobre
 * la misma, en lugar de registrar otra. Crear una por intento fallido dejaria
 * huerfanas y obligaria a rellenar el formulario entero.
 */
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

    // Se valida ANTES de transferir, con el mismo esquema que aplica el
    // servidor. Rechazar aqui evita gastar ancho de banda en algo que el
    // almacenamiento va a rechazar de todos modos.
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
      // La autorizacion anterior pudo caducar: se pide una nueva sobre la MISMA
      // solicitud.
      const autorizacion = await renovarAutorizacion(applicationId);

      await transferirVideo(autorizacion, archivo, {
        onProgreso: setProgreso,
        signal: control.signal,
      });

      await avisarSubidaCompletada(applicationId);
    } catch (error) {
      // Cancelar es deliberado: no hay nada que reportar. Sin esta distincion,
      // al usuario le saldria un error por algo que acaba de pedir el mismo.
      if (esCancelacion(error)) return;

      setErrorSubida(
        error instanceof Error ? error.message : "No pudimos subir el video. Inténtalo de nuevo.",
      );
      return;
    } finally {
      cancelacion.current = null;
      setProgreso(null);
    }

    // La fila cambia de estado sin que nadie tenga que recargar.
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

    // Perder una subida casi terminada por un descuido es peor que el clic de mas.
    const confirmado = await confirmar({
      titulo: "¿Cancelar la subida?",
      mensaje: "Se detendrá la transferencia y tendrás que volver a subir el video.",
      textoConfirmar: "Cancelar subida",
      destructiva: true,
    });

    if (!confirmado) return;

    // Aborta la peticion de verdad, no solo deja de mostrar el progreso.
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

        {/* El fallo se explica aqui dentro, con el reintento a un clic: obligar
            a cerrar y buscar el boton otra vez cumple la letra y no la
            intencion. */}
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
