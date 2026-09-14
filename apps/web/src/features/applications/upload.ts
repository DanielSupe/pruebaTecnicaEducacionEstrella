import axios from "axios";
import type { Application, UploadAuthorization } from "@educacion-estrella/shared";
import { http, ApiError } from "../../lib/http.js";

/**
 * Cliente para el almacenamiento, SIN interceptores.
 *
 * Deliberadamente no es el cliente de la aplicacion: ese adjunta el token de
 * acceso a cada peticion, y mandarlo al almacenamiento entregaria nuestras
 * credenciales a un tercero que no las necesita ni debe verlas.
 *
 * Es un error facil de cometer precisamente porque el otro cliente ya esta ahi
 * y la subida "parece funcionar" igual.
 */
const almacenamiento = axios.create();

/**
 * Distingue una cancelacion deliberada de un fallo.
 *
 * Importa porque no son lo mismo de cara al usuario: cancelar es algo que acaba
 * de hacer a proposito, y avisarle de ello con una ventana de error es ruido.
 */
export function esCancelacion(error: unknown): boolean {
  return axios.isCancel(error);
}

/** En que paso del flujo se quedo, para poder decir que hacer a continuacion. */
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

/** Paso 1: registra la solicitud y obtiene la autorizacion de subida. */
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

/** Paso 2: transfiere el archivo al almacenamiento. */
export async function transferirVideo(
  autorizacion: UploadAuthorization,
  archivo: File,
  opciones: { onProgreso: (porcentaje: number) => void; signal: AbortSignal },
): Promise<void> {
  const formulario = new FormData();

  for (const [campo, valor] of Object.entries(autorizacion.fields)) {
    formulario.append(campo, valor);
  }

  // El archivo SIEMPRE al final: el almacenamiento ignora todo lo que venga
  // despues de el en el formulario.
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

/** Paso 3: avisa a la API de que la subida termino, para que verifique. */
export async function avisarSubidaCompletada(applicationId: string): Promise<Application> {
  try {
    const { data } = await http.post<Application>(`/applications/${applicationId}/complete-upload`);
    return data;
  } catch (error) {
    throw new UploadError("aviso", mensajeDe(error, "No pudimos confirmar tu video."), error);
  }
}

/**
 * Pide una autorizacion nueva para reintentar.
 *
 * Se reutiliza la solicitud ya registrada: crear otra dejaria una huerfana por
 * cada intento fallido y obligaria a rellenar el formulario de nuevo. La
 * anterior autorizacion pudo caducar, por eso hace falta una nueva.
 */
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

/** Los errores de la API ya traen un mensaje pensado para leerse. */
function mensajeDe(error: unknown, porOmision: string): string {
  return error instanceof ApiError ? error.message : porOmision;
}
