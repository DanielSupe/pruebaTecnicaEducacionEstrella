/**
 * Descarga el listado de instituciones de educacion superior de Colombia.
 *
 * El resultado SE VERSIONA. La aplicacion no consulta este servicio en ejecucion:
 * son 300 nombres que caben en el paquete, y hornearlos evita dos cosas. Una,
 * autorizar un origen externo en la politica de seguridad de contenido. Dos, que
 * el formulario dependa de que una API del gobierno responda — el despliegue
 * tiene que seguir funcionando aunque ese servicio se caiga.
 *
 * Actualizar es ejecutar esto a proposito y revisar el diff.
 *
 * Uso: pnpm tsx scripts/fetch-institutions.ts
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGEN = "https://www.datos.gov.co/resource/n5yy-8nav.json";

const DESTINO = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/web/src/features/applications/institutions.json",
);

type Registro = { nombre_instituci_n?: string };

async function main(): Promise<void> {
  // El limite se pide explicito: sin el, el servicio devuelve solo las primeras
  // mil filas y nadie se entera de que falta algo.
  const url = `${ORIGEN}?$limit=2000&$select=nombre_instituci_n`;

  console.warn(`Descargando de ${ORIGEN}…`);
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`El servicio respondio ${String(respuesta.status)}.`);
  }

  const registros = (await respuesta.json()) as Registro[];

  // El registro trae una fila por SEDE, no por institucion: 361 filas para 300
  // nombres. Sin deduplicar, "UNIVERSIDAD NACIONAL DE COLOMBIA" apareceria nueve
  // veces seguidas en el desplegable.
  const nombres = [
    ...new Set(
      registros
        .map((r) => r.nombre_instituci_n?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0)),
    ),
  ].sort((a, b) => a.localeCompare(b, "es"));

  if (nombres.length === 0) {
    throw new Error("El servicio no devolvio ningun nombre. No se sobrescribe el listado.");
  }

  // Se dejan EN MAYUSCULAS, como en el registro oficial. Pasarlos a formato
  // titulo romperia las siglas, que son muchas: SENA, CESA, CEA.
  writeFileSync(DESTINO, JSON.stringify(nombres, null, 2) + "\n", "utf8");

  console.warn(`${String(registros.length)} filas → ${String(nombres.length)} nombres unicos.`);
  console.warn(`Escrito en ${DESTINO}`);
  console.warn("Revisa el diff antes de commitear.");
}

await main();
