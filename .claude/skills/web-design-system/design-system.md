# Sistema de diseño

Tailwind v4 se configura en CSS, no en `tailwind.config.js`. Todo esto vive en
`apps/web/src/index.css` dentro de `@theme`.

## Color

La paleta tiene **una sola voz de marca** y todo lo demás es neutro. Esa contención es lo que
separa un producto de una plantilla: en una plantilla todo es de color; aquí el color significa
"esto es la acción" o "esto requiere atención".

```css
@import "tailwindcss";

@theme {
  /* Colores tomados del logo, no inventados.
     El turquesa de marca es demasiado claro para llevar texto blanco encima
     (1.64:1), asi que la accion primaria usa una version oscurecida. */
  --color-brand: #0f6b66; /* accion primaria. Blanco encima: 6.33:1 */
  --color-brand-hover: #0b5551;
  --color-brand-accent: #40e0d0; /* turquesa exacto del logo */
  --color-brand-subtle: #effbf9; /* fondos muy tenues, badges */

  /* Azul petroleo del logo. Superficies oscuras: cabecera, pie, panel lateral. */
  --color-ink: #092f42;

  /* Semanticos. Un tono por estado, no una escala entera. */
  --color-success: #15803d;
  --color-success-bg: #f0fdf4;
  --color-warning: #b45309;
  --color-warning-bg: #fffbeb;
  --color-danger: #b91c1c;
  --color-danger-bg: #fef2f2;
}
```

Seis tokens de marca, no una escala de diez: solo existen los que se usan. Añadir un tono
intermedio "por si acaso" es la misma sobre-ingenieria que la skill prohibe en los componentes.

**Regla que no se negocia:** `brand-accent` (el turquesa) **nunca** lleva texto blanco encima.
Sobre `ink` da 8.82:1 y es la combinacion del propio logo; sobre blanco, como texto, es
ilegible. Para acciones, `brand`.

Los neutros salen de la escala `slate` de Tailwind, que es más fría y más institucional que
`gray`. No hace falta redefinirla.

### Dónde va cada color

| Uso | Clase |
|---|---|
| Fondo de la página | `bg-slate-50` |
| Superficie (card, panel, modal) | `bg-white` |
| Borde por omisión | `border-slate-200` |
| Borde de un input | `border-slate-300` |
| Separador | `border-slate-200` |
| Texto principal | `text-slate-900` |
| Texto secundario | `text-slate-600` |
| Texto de apoyo (ayudas, marcas de tiempo) | `text-slate-500` |
| Texto deshabilitado | `text-slate-400` |
| Acción primaria | `bg-brand` + `text-white` |
| Enlace | `text-brand` |
| Anillo de foco | `ring-brand` |
| Superficie oscura (cabecera, pie) | `bg-ink` + `text-white` |
| Acento sobre superficie oscura | `text-brand-accent` |

**Nunca** uses el color de marca como fondo de una sección entera, ni para texto largo, ni para
más de un botón por pantalla.

## Tipografía

Una sola familia. La del sistema es rápida, no pide descarga y no parece una plantilla:

```css
@theme {
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
    sans-serif;
}
```

| Uso | Clases |
|---|---|
| Título de página | `text-2xl font-semibold text-slate-900 tracking-tight` |
| Título de sección | `text-lg font-semibold text-slate-900` |
| Título de card | `text-base font-semibold text-slate-900` |
| Cuerpo | `text-sm text-slate-700` |
| Etiqueta de campo | `text-sm font-medium text-slate-700` |
| Ayuda y errores | `text-xs text-slate-500` / `text-xs text-danger` |
| Cabecera de tabla | `text-xs font-medium uppercase tracking-wide text-slate-500` |

Tres reglas: el peso máximo es `font-semibold` (nunca `font-bold`, que en pantalla grita); nunca
más de tres tamaños distintos en una misma pantalla; y `tracking-tight` solo en textos grandes.

## Espaciado

Escala de 4 px. Usa **solo** estos pasos: `1, 2, 3, 4, 6, 8, 12, 16`. Nada de medios pasos: si
necesitas `2.5` o `7`, el problema es otro.

**Todo control interactivo mide 44 px de alto** (`py-3` con `text-sm`). Una sola altura para
botones, inputs y selects: la interfaz queda alineada sola y el objetivo táctil es correcto en
móvil sin reglas aparte.

| Distancia | Valor |
|---|---|
| Alto de todo control interactivo | `py-3` (44 px con `text-sm`) |
| Entre etiqueta y su input | `mt-2` |
| Entre campos de un formulario | `space-y-4` |
| Padding de una card | `p-6` (`p-4` en móvil) |
| Entre secciones de una página | `space-y-8` |
| Ancho máximo de contenido | `max-w-3xl` (formularios), `max-w-6xl` (listados) |

Los formularios se leen mejor estrechos. Un formulario a todo lo ancho de un monitor es un
formulario que nadie termina.

## Radios y sombras

| Elemento | Radio |
|---|---|
| Botón, input, select, badge | `rounded-md` |
| Card, modal, panel | `rounded-lg` |
| Avatar | `rounded-full` |

Sombras: **solo dos**, y ambas escasas.

| Uso | Clase |
|---|---|
| Card sobre el fondo | `shadow-sm` (o solo `border-slate-200`) |
| Modal y menú desplegable | `shadow-lg` |

Una card con borde **o** con sombra, no las dos. Nada de `shadow-xl` ni sombras de color.

## Imágenes de marca

Hay tres archivos en `apps/web/src/assets/`. Úsalos: una interfaz con la marca puesta se lee como
producto, y sin ella como maqueta. Pero cada uno tiene su sitio, y ponerlos donde no toca se
nota más que no ponerlos.

| Archivo | Qué es | Dónde va |
|---|---|---|
| `Logo-educacion.png` (700×143) | Logotipo horizontal con el nombre | Cabecera de la aplicación y pantallas de acceso. Es la marca completa |
| `logo.png` (200×200) | Isotipo cuadrado, sin texto | Favicon, y donde el horizontal no cabe: móvil, barra estrecha, avatar |
| `images.jpg` (447×447) | Logotipo sobre fondo petróleo | Panel lateral de la pantalla de acceso, o imagen para compartir el enlace |

**Los tres lugares que sí valen la pena:**

1. **Cabecera**: el logotipo horizontal a la izquierda, `h-8`, enlazando al inicio. En móvil se
   cambia por el isotipo.
2. **Acceso (login y registro)**: el logotipo sobre el formulario, centrado. En pantallas
   anchas, `images.jpg` puede ocupar un panel lateral (`hidden lg:block lg:w-1/2`) con fondo
   `bg-ink`; en móvil ese panel desaparece.
3. **Favicon y pestaña**: el isotipo.

**Dónde no ponerlos:**

- Dos veces en la misma pantalla. Si está en la cabecera, no va también sobre el formulario.
- Estirando `images.jpg` como fondo de página: mide 447 px y se pixelaría.
- Decorando un estado vacío. Un estado vacío necesita decir qué hacer, no enseñar el logo.
- Como marca de agua o repetido de fondo.

**Al insertarlos:**

- Se importan como módulo (`import logo from "..."`), no se referencian por una ruta escrita a
  mano en el `src` de la etiqueta: así Vite los versiona, los optimiza y el build falla si el
  archivo no existe. Requiere `/// <reference types="vite/client" />` para que TypeScript
  reconozca el import de una imagen. La única excepción es el favicon, que vive en `public/`
  porque lo referencia el `index.html`.
- Llevan `width` y `height` explícitos, o reservan espacio con `aspect-ratio`: si no, la página
  da un salto al cargar.
- `alt` con el nombre de la organización cuando el logo **es** la identificación de la página.
  `alt=""` cuando va acompañado del nombre en texto: repetirlo hace que un lector de pantalla lo
  diga dos veces.

## Responsive

Móvil primero: escribe el diseño de móvil sin prefijo y amplía con `sm:` `md:` `lg:`.

| Rango | Prefijo | Qué cambia |
|---|---|---|
| < 640 px | (ninguno) | Una columna, navegación colapsada, tablas como lista de cards |
| ≥ 640 px | `sm:` | Los botones dejan de ocupar el ancho completo |
| ≥ 768 px | `md:` | Dos columnas donde tenga sentido, tablas como tabla |
| ≥ 1024 px | `lg:` | Ancho máximo del contenido y navegación lateral si la hay |

Reglas que se cumplen siempre:

- En móvil los botones de acción principal son `w-full sm:w-auto`.
- Ninguna página tiene scroll horizontal. Si una tabla no cabe, se envuelve en
  `overflow-x-auto` o se convierte en cards.
- El padding lateral del contenido es `px-4 sm:px-6 lg:px-8`.
