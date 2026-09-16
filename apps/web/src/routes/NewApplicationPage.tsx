import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { UploadAuthorization, VideoContentType } from "@educacion-estrella/shared";
import { useValidatedForm } from "../lib/useValidatedForm.js";
import { confirmar, avisarExito } from "../lib/dialogs.js";
import { Field } from "../components/Field.js";
import { Combobox } from "../components/Combobox.js";
import instituciones from "../features/applications/institutions.json";
import { FileField } from "../components/FileField.js";
import { Button } from "../components/Button.js";
import { ProgressBar } from "../components/ProgressBar.js";
import {
  applicationFormSchema,
  montoATexto,
  type ApplicationFormInput,
} from "../features/applications/schema.js";
import {
  registrarSolicitud,
  transferirVideo,
  avisarSubidaCompletada,
  renovarAutorizacion,
  esCancelacion,
  UploadError,
} from "../features/applications/upload.js";

/** An application already registered whose upload did not finish. */
type Pendiente = {
  applicationId: string;
  upload: UploadAuthorization;
  archivo: File;
};

export function NewApplicationPage() {
  const [fullName, setFullName] = useState("");
  const [idDocument, setIdDocument] = useState("");
  const [institution, setInstitution] = useState("");
  const [program, setProgram] = useState("");
  const [amount, setAmount] = useState("");
  const [video, setVideo] = useState<File | null>(null);

  const [progreso, setProgreso] = useState<number | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const cancelacion = useRef<AbortController | null>(null);

  const navigate = useNavigate();

  const { errores, enviando, enviar, campoDeVuelta } = useValidatedForm(
    applicationFormSchema,
    (error) => ({
      titulo: tituloSegunPaso(error),
      mensaje: error instanceof Error ? error.message : "Inténtalo de nuevo en unos momentos.",
    }),
  );

  const subiendo = progreso !== null;

  async function ejecutarSubida(applicationId: string, upload: UploadAuthorization, archivo: File) {
    const control = new AbortController();
    cancelacion.current = control;
    setProgreso(0);

    try {
      await transferirVideo(upload, archivo, {
        onProgreso: setProgreso,
        signal: control.signal,
      });

      await avisarSubidaCompletada(applicationId);
    } catch (error) {
      // Cancelling is deliberate, not a failure to report.
      if (esCancelacion(error)) return;
      throw error;
    } finally {
      cancelacion.current = null;
      setProgreso(null);
    }

    setPendiente(null);

    await avisarExito({
      titulo: "Solicitud enviada",
      mensaje: "Recibimos tu solicitud y tu video de entrevista.",
    });

    await navigate({ to: "/" });
  }

  function datosDelFormulario(archivo: File | null) {
    return {
      fullName,
      idDocument,
      institution,
      program,
      amount: montoATexto(amount),
      video: archivo,
    };
  }

  function onSubmit(evento: FormEvent) {
    evento.preventDefault();

    void enviar(datosDelFormulario(video), async (valido: ApplicationFormInput) => {
      const { applicationId, upload } = await registrarSolicitud({
        fullName: valido.fullName,
        idDocument: valido.idDocument,
        institution: valido.institution,
        program: valido.program,
        amount: valido.amount,
        videoContentType: valido.video.type as VideoContentType,
      });

      // Stored before transferring so a retry reuses this application instead of
      // creating another.
      setPendiente({ applicationId, upload, archivo: valido.video });

      await ejecutarSubida(applicationId, upload, valido.video);
    });
  }

  function reintentar() {
    if (!pendiente) return;
    const enCurso = pendiente;

    void enviar(datosDelFormulario(enCurso.archivo), async () => {
      // The previous authorization may have expired: a new one over the SAME
      // application.
      const upload = await renovarAutorizacion(enCurso.applicationId);
      await ejecutarSubida(enCurso.applicationId, upload, enCurso.archivo);
    });
  }

  async function cancelar() {
    const confirmado = await confirmar({
      titulo: "¿Cancelar la subida?",
      mensaje: "Se detendrá la transferencia y tendrás que volver a subir el video.",
      textoConfirmar: "Cancelar subida",
      destructiva: true,
    });

    if (!confirmado) return;

    // Aborts the request for real, not just hides the progress.
    cancelacion.current?.abort();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Nueva solicitud</h1>
      <p className="mt-2 text-sm text-slate-600">
        Completa tus datos y adjunta el video de la entrevista.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        <Field
          id="fullName"
          label="Nombre completo"
          autoComplete="name"
          ref={campoDeVuelta}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errores.fullName}
          disabled={subiendo}
        />

        <Field
          id="idDocument"
          label="Documento de identidad"
          inputMode="numeric"
          value={idDocument}
          onChange={(e) => setIdDocument(e.target.value)}
          error={errores.idDocument}
          disabled={subiendo}
        />

        {/* Suggests, does not restrict: the list only covers Colombian higher
            education, so another institution can be typed. */}
        <Combobox
          id="institution"
          label="Institución educativa"
          opciones={instituciones}
          value={institution}
          onChange={setInstitution}
          error={errores.institution}
          disabled={subiendo}
          ayuda="Escribe para buscar. Si no aparece, puedes escribirla completa."
        />

        <Field
          id="program"
          label="Programa académico"
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          error={errores.program}
          disabled={subiendo}
        />

        <Field
          id="amount"
          label="Monto solicitado (COP)"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errores.amount}
          disabled={subiendo}
        />

        <FileField
          id="video"
          label="Video de la entrevista"
          archivo={video ?? pendiente?.archivo ?? null}
          error={errores.video}
          disabled={subiendo}
          onChange={setVideo}
        />

        {subiendo && (
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <ProgressBar porcentaje={progreso} etiqueta="Subiendo el video" />
            <p className="mt-3 text-xs text-slate-500">No cierres esta página hasta que termine.</p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          {subiendo && (
            <Button type="button" variante="secundario" onClick={() => void cancelar()}>
              Cancelar subida
            </Button>
          )}

          {!subiendo && pendiente && (
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={reintentar}
              cargando={enviando ? "Reintentando…" : undefined}
            >
              Reintentar subida
            </Button>
          )}

          {!subiendo && !pendiente && (
            <Button
              type="submit"
              className="w-full sm:w-auto"
              cargando={enviando ? "Enviando…" : undefined}
            >
              Enviar solicitud
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

// The title says which step failed, which determines what the user can do next.
function tituloSegunPaso(error: unknown): string {
  if (!(error instanceof UploadError)) return "No se pudo enviar la solicitud";

  switch (error.paso) {
    case "registro":
      return "No se pudo registrar la solicitud";
    case "transferencia":
      return "No se pudo subir el video";
    case "aviso":
      return "El video se subió pero no pudimos confirmarlo";
  }
}
