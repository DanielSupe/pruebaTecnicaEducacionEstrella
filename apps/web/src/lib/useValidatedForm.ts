import { useRef, useState } from "react";
import type { ZodType } from "zod";
import { avisarError } from "./dialogs.js";

type Errores = Record<string, string>;

/** Como se traduce un fallo de la operacion a algo que se le puede enseñar a alguien. */
export type TraductorDeError = (error: unknown) => { titulo: string; mensaje: string };

/**
 * Logica comun a los formularios de la aplicacion.
 *
 * Separa dos tipos de fallo que se confunden con facilidad:
 *  - El formato de lo escrito: se valida con Zod y se muestra BAJO cada campo.
 *  - La operacion fallo: eso va en ventana emergente y devuelve el foco al campo
 *    indicado, para que cerrar y corregir cueste lo menos posible.
 *
 * La traduccion del error se inyecta porque depende de con quien se hable: los
 * formularios de acceso traducen errores del directorio de usuarios; el de
 * solicitud, errores de nuestra propia API.
 */
export function useValidatedForm<T>(schema: ZodType<T>, traducir: TraductorDeError) {
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const campoDeVuelta = useRef<HTMLInputElement>(null);

  async function enviar(datos: unknown, accion: (valido: T) => Promise<void>) {
    const resultado = schema.safeParse(datos);

    if (!resultado.success) {
      const nuevos: Errores = {};
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0];
        if (typeof campo === "string" && !(campo in nuevos)) {
          nuevos[campo] = issue.message;
        }
      }
      setErrores(nuevos);
      return;
    }

    setErrores({});
    setEnviando(true);

    let fallo: unknown = null;

    try {
      await accion(resultado.data);
    } catch (error) {
      fallo = error;
    }

    // El estado se limpia ANTES de abrir la ventana: si se hiciera despues, el
    // boton seguiria diciendo "Enviando..." mientras el aviso dice que fallo.
    setEnviando(false);

    if (fallo) {
      const { titulo, mensaje } = traducir(fallo);
      await avisarError({ titulo, mensaje, devolverFocoA: campoDeVuelta.current });
    }
  }

  return { errores, enviando, enviar, campoDeVuelta, setErrores };
}
