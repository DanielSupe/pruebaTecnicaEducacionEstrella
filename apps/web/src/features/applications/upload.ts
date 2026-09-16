import axios from "axios";
import type { Application, UploadAuthorization } from "@educacion-estrella/shared";
import { http, ApiError } from "../../lib/http.js";

// Storage client WITHOUT interceptors. Deliberately not the app client: that one
// attaches the access token to every request, and sending it to storage would hand
// our credentials to a third party that neither needs nor should see them.
const almacenamiento = axios.create();

// Cancelling is deliberate: warning the user about something they just asked for
// is noise.
export function esCancelacion(error: unknown): boolean {
  return axios.isCancel(error);
}

/** Which step failed, so the interface can say what to do next. */
export type PasoFallido = "registro" | "transferencia" | "aviso";

export class UploadError extends Error {
  readonly paso: PasoFallido;
  readonly causa: unknown;

  constructor(paso: PasoFallido, mensaje: string, causa: unknown) {
    super(mensaje);
    this.name = "UploadError";
    this.paso = paso;
    this.causa = causa;
  }
}

export type CreatedApplication = {
  applicationId: string;
  upload: UploadAuthorization;
};

export async function registrarSolicitud(datos: {
  fullName: string;
  idDocument: string;
  institution: string;
  program: string;
  amount: number;
  videoContentType: string;
}): Promise<CreatedApplication> {
  try {
    const { data } = await http.post<CreatedApplication>("/applications", datos);
    return data;
  } catch (error) {
    throw new UploadError(
      "registro",
      mensajeDe(error, "No pudimos registrar tu solicitud."),
      error,
    );
  }
}

export async function transferirVideo(
  autorizacion: UploadAuthorization,
  archivo: File,
  opciones: { onProgreso: (porcentaje: number) => void; signal: AbortSignal },
): Promise<void> {
  const formulario = new FormData();

  for (const [campo, valor] of Object.entries(autorizacion.fields)) {
    formulario.append(campo, valor);
  }

  // The file goes ALWAYS last: storage ignores every field that comes after it.
  formulario.append("file", archivo);

  try {
    await almacenamiento.post(autorizacion.url, formulario, {
      signal: opciones.signal,
      onUploadProgress: (evento) => {
        if (evento.total) opciones.onProgreso((evento.loaded / evento.total) * 100);
      },
    });
  } catch (error) {
    if (axios.isCancel(error)) throw error;

    throw new UploadError(
      "transferencia",
      "No pudimos subir el video. Comprueba tu conexión e inténtalo de nuevo.",
      error,
    );
  }
}

export async function avisarSubidaCompletada(applicationId: string): Promise<Application> {
  try {
    const { data } = await http.post<Application>(`/applications/${applicationId}/complete-upload`);
    return data;
  } catch (error) {
    throw new UploadError("aviso", mensajeDe(error, "No pudimos confirmar tu video."), error);
  }
}

// Reuses the existing application: creating another would leave an orphan per
// failed attempt. A new authorization is needed because the previous one may have
// expired.
export async function renovarAutorizacion(applicationId: string): Promise<UploadAuthorization> {
  try {
    const { data } = await http.post<{ upload: UploadAuthorization }>(
      `/applications/${applicationId}/video-url`,
    );
    return data.upload;
  } catch (error) {
    throw new UploadError("registro", mensajeDe(error, "No pudimos reanudar la subida."), error);
  }
}

function mensajeDe(error: unknown, porOmision: string): string {
  return error instanceof ApiError ? error.message : porOmision;
}
