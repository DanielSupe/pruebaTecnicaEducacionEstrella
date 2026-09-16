// Downloads the list of Colombian higher education institutions.
//
// The result IS VERSIONED. The application never queries this service at runtime:
// baking the names in avoids authorising an external origin in the content security
// policy, and stops the form depending on a government API being up.
//
// Usage: pnpm tsx scripts/fetch-institutions.ts
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
  // The limit is explicit: without it the service returns only the first thousand
  // rows and nobody notices something is missing.
  const url = `${ORIGEN}?$limit=2000&$select=nombre_instituci_n`;

  console.warn(`Descargando de ${ORIGEN}…`);
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`El servicio respondio ${String(respuesta.status)}.`);
  }

  const registros = (await respuesta.json()) as Registro[];

  // The registry has one row per CAMPUS, not per institution. Without
  // deduplication the same name would appear nine times in a row.
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

  // Kept UPPERCASE, as in the official registry: title case would break the many
  // acronyms.
  writeFileSync(DESTINO, JSON.stringify(nombres, null, 2) + "\n", "utf8");

  console.warn(`${String(registros.length)} filas → ${String(nombres.length)} nombres unicos.`);
  console.warn(`Escrito en ${DESTINO}`);
  console.warn("Revisa el diff antes de commitear.");
}

await main();
