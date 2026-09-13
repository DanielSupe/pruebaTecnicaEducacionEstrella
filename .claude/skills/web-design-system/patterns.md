# Recetas

Clases listas para usar. Si una pantalla necesita algo que no está aquí, constrúyelo con los
tokens de `design-system.md` — no improvises valores.

Todo control interactivo lleva el mismo anillo de foco:

```
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2
```

## Botón

Base común, más una variante:

```
inline-flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium
transition-colors disabled:cursor-not-allowed disabled:opacity-50
```

| Variante | Cuándo | Clases |
|---|---|---|
| Primario | La acción de la pantalla. **Uno solo visible** | `bg-brand text-white hover:bg-brand-hover` |
| Secundario | Acción alternativa | `bg-white text-slate-700 border border-slate-300 hover:bg-slate-50` |
| Sutil | Terciaria, cancelar | `text-slate-600 hover:bg-slate-100` |
| Destructivo | Borrar, algo irreversible | `bg-danger text-white hover:brightness-90` |

Cargando: el botón se deshabilita, muestra un spinner y **conserva su ancho** para que el
layout no dé un salto. El texto cambia a la acción en curso ("Enviando…"), no desaparece.

## Input y select

```
Etiqueta:  block text-sm font-medium text-slate-700
Control:   mt-2 block w-full rounded-md border border-slate-300 px-3 py-3 text-sm
           text-slate-900 placeholder:text-slate-400
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand
           disabled:bg-slate-50 disabled:text-slate-400
Con error: border-danger focus-visible:ring-danger
Ayuda:     mt-2 text-xs text-slate-500
Error:     mt-2 text-xs text-danger
```

El `<select>` usa las mismas clases que el input. No se sustituye por un desplegable propio sin
una razón funcional; el nativo funciona mejor en móvil y es accesible por defecto.

## Card

```
rounded-lg border border-slate-200 bg-white p-6
```

Con cabecera, el separador es un borde, no una línea de color:

```
Cabecera: border-b border-slate-200 px-6 py-4
Cuerpo:   p-6
```

Sin sombra salvo que la card flote sobre contenido (menú, popover). Nunca una card dentro de
otra: si necesitas agrupar dentro, usa espacio y un título.

## Modal

```
Fondo:   fixed inset-0 bg-slate-900/50
Panel:   w-full max-w-lg rounded-lg bg-white p-6 shadow-lg
```

Requisitos, no adornos: cierra con `Esc`, el foco queda atrapado dentro mientras está abierto y
vuelve al elemento que lo abrió al cerrarse. Si un modal no cumple eso, es una trampa para quien
navegue con teclado. Úsalo solo para confirmar algo destructivo o para una tarea corta; para un
formulario largo, una página.

## Tabla

```
Contenedor: overflow-x-auto rounded-lg border border-slate-200
Tabla:      w-full text-left text-sm
Cabecera:   bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500
Celdas:     px-4 py-3
Filas:      border-t border-slate-200
```

Las filas no se rayan en cebra: el borde superior ya las separa. En móvil (< 768 px) una tabla
de más de tres columnas se convierte en una lista de cards; forzar el scroll horizontal es la
salida perezosa.

## Distintivo de estado

Para el estado de una solicitud en listados y detalle.

```
inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
```

| Estado | Clases |
|---|---|
| En curso, requiere acción del usuario | `bg-warning-bg text-warning` |
| En proceso, nada que hacer | `bg-brand-subtle text-brand` |
| Completado | `bg-success-bg text-success` |
| Fallido | `bg-danger-bg text-danger` |

El distintivo lleva **texto**, no solo color: quien no distinga los tonos tiene que poder leer el
estado. Y el texto es el del dominio en español ("Video pendiente"), no el identificador interno.

## Estados

Los cuatro son obligatorios en cualquier vista que cargue datos. Una vista que solo contempla el
caso feliz está a medio hacer.

**Cargando.** Esqueletos (`animate-pulse bg-slate-200 rounded`) con la forma del contenido que
va a llegar, no un spinner centrado: así no salta el layout. Para una acción puntual, el spinner
va dentro del botón.

**Vacío.** Centrado, con `py-12`: un título en `text-base font-medium text-slate-900`, una línea
en `text-sm text-slate-600` que explique **qué hacer**, y si procede un botón primario. Nunca
una tabla vacía sin explicación.

**Error.** Explica qué falló y ofrece una salida: `rounded-md border border-danger bg-danger-bg
p-4 text-sm`, con un botón de reintentar si la acción se puede repetir. Nunca se muestra el
error técnico crudo.

**Éxito.** Breve y no bloqueante: `border border-success bg-success-bg`. Si la acción cambia de
pantalla, la propia pantalla nueva es la confirmación — no hace falta un cartel además.

**Deshabilitado.** `disabled:opacity-50 disabled:cursor-not-allowed`. Si un botón está
deshabilitado, algo cerca tiene que decir por qué.

## Formularios

Estructura: título, campos en `space-y-4`, y las acciones al final alineadas a la derecha
(`flex justify-end gap-3`, con `flex-col-reverse sm:flex-row` en móvil para que la primaria
quede arriba).

Reglas de validación:

- Se valida al salir del campo (`onBlur`), no en cada tecla. Marcar en rojo mientras alguien
  escribe su primera letra es hostil.
- Tras el primer intento de envío, el campo ya sí valida en cada cambio.
- El error se muestra **bajo su campo**, nunca solo en un resumen arriba.
- Al fallar el envío, el foco va al primer campo con error.
- El botón de envío **no se deshabilita** por tener el formulario incompleto: se envía, se
  valida y se señalan los errores. Un botón deshabilitado sin explicación deja al usuario sin
  saber qué le falta.
- Durante el envío sí se deshabilita, para evitar el doble envío.
- Los esquemas de validación salen de `packages/shared`. No se reescriben reglas en el cliente.

## Accesibilidad

El mínimo que no es negociable:

- Todo input tiene su `<label>` asociado por `htmlFor` / `id`. Un `placeholder` no es una
  etiqueta: desaparece justo cuando hace falta.
- El error se enlaza con `aria-describedby` y el campo lleva `aria-invalid`.
- Contraste mínimo 4.5:1 en texto. `text-slate-400` solo para texto deshabilitado, nunca para
  información que haga falta leer.
- El foco siempre se ve. No se elimina el `outline` sin poner un `ring` en su lugar.
- Los iconos que actúan como botón llevan `aria-label`.
- Un elemento clicable es un `<button>` o un `<a>`, nunca un `<div>` con `onClick`.
- El orden del DOM sigue el orden visual: es el orden en que se tabula.
