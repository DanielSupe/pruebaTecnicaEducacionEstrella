/**
 * Filtrado del selector, aparte del componente y sin estado.
 *
 * Vive fuera de Combobox.tsx para poder probarlo sin montar React, que es lo que
 * hace el resto del proyecto: se prueban funciones puras, no componentes.
 */

/** Cuantas opciones se pintan como mucho. */
export const MAX_OPCIONES = 50;

/**
 * Quita tildes y pasa a minusculas.
 *
 * Sin esto, quien escribe "aeronautica" no encuentra "AERONÁUTICOS" y quien
 * escribe "antioquia" no encuentra "ANTIOQUIA". Exigir la tilde exacta convierte
 * la ayuda en un obstaculo, y en un teclado movil es peor todavia.
 *
 * NFD separa cada letra de su tilde, y el rango que se borra son justo esas
 * marcas sueltas.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export type Coincidencias = {
  /** Lo que se pinta: como mucho MAX_OPCIONES. */
  visibles: string[];
  /** Cuantas coinciden en total, que puede ser mas que las visibles. */
  total: number;
};

/**
 * Opciones que coinciden con lo escrito.
 *
 * Sin texto se ofrece el principio del listado, para que el selector sirva
 * tambien a quien no sabe como se escribe exactamente lo que busca.
 *
 * Con texto que no coincide con nada se devuelve VACIO, no el listado entero:
 * devolver todo le diria al usuario que su busqueda encontro algo.
 */
export function coincidencias(opciones: readonly string[], texto: string): Coincidencias {
  const buscado = normalizar(texto);

  if (buscado === "") {
    return { visibles: opciones.slice(0, MAX_OPCIONES), total: opciones.length };
  }

  const encontradas = opciones.filter((opcion) => normalizar(opcion).includes(buscado));

  return { visibles: encontradas.slice(0, MAX_OPCIONES), total: encontradas.length };
}
