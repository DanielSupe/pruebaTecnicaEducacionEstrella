import { useRef, useState } from "react";
import type { ZodType } from "zod";
import { avisarError } from "./dialogs.js";

type Errores = Record<string, string>;

/** How an operation failure becomes something you can show a person. */
export type TraductorDeError = (error: unknown) => { titulo: string; mensaje: string };

// Separates two kinds of failure that are easy to confuse: the format of what was
// typed, shown UNDER each field, and the operation failing, which goes in a dialog
// and hands focus back to the field to fix.
//
// The error translation is injected because it depends on who we are talking to.
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

    // Cleared BEFORE opening the dialog: afterwards, the button would still say
    // "Sending…" while the alert says it failed.
    setEnviando(false);

    if (fallo) {
      const { titulo, mensaje } = traducir(fallo);
      await avisarError({ titulo, mensaje, devolverFocoA: campoDeVuelta.current });
    }
  }

  return { errores, enviando, enviar, campoDeVuelta, setErrores };
}
