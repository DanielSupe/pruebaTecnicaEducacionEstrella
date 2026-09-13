---
name: web-design-system
description: Sistema de diseño de apps/web (React + Vite + TypeScript + Tailwind v4). Úsala SIEMPRE que vayas a crear o modificar una pantalla, un componente, un formulario, un estado de carga o error, o cualquier estilo del frontend. También antes de instalar cualquier librería de UI.
---

# Diseño del frontend

El objetivo es que la aplicación parezca un producto real: sobria, legible y coherente.
El riesgo que hay que evitar no es que quede fea, es que quede **genérica** — la estética de
plantilla que se reconoce al instante.

## Antes de escribir una sola línea

1. **Mira qué existe ya.** `apps/web/src/components/`, `apps/web/src/index.css` y la pantalla
   más parecida a la que vas a hacer.
2. **Reutiliza.** Si hay un componente que resuelve el 80% del caso, úsalo y extiéndelo por
   props. Crear un segundo botón es como empieza la incoherencia.
3. **Consulta los tokens.** En esta misma carpeta: `design-system.md` tiene los valores y
   `patterns.md` las recetas por componente y por estado. No inventes un color ni un espaciado
   que no estén ahí.

No refactorices lo que no estás tocando. No cambies la arquitectura. No instales una librería de
UI sin plantearlo antes y explicar qué problema concreto resuelve que no resuelva Tailwind.

## Cinco principios

**Un acento, todo lo demás neutro.** El color de marca se reserva para la acción primaria, el
foco y el elemento activo de la navegación. Si en una pantalla hay dos cosas compitiendo por ser
lo importante, no hay ninguna importante.

**El espacio en blanco es parte del diseño.** Antes de añadir un separador, un borde o una caja,
prueba si el espacio ya separa lo suficiente. Casi siempre sí.

**Jerarquía por tamaño y peso, no por color.** Un título es un título porque es más grande, no
porque sea azul.

**La marca se pone donde identifica, no donde decora.** Hay logotipos en `apps/web/src/assets/`:
cabecera, pantallas de acceso y favicon. Una interfaz sin marca parece una maqueta; con el logo
repetido tres veces, parece una plantilla. Ver `design-system.md`.

**Cada pantalla responde una pregunta.** Si no sabes cuál es la pregunta de la pantalla, no
sabes qué quitar.

**Ante la duda, la opción más simple y más parecida a lo que ya existe.** Una decisión visual
nueva necesita una razón; repetir una existente no necesita ninguna.

## Cuándo crear un componente nuevo

Créalo cuando el patrón **ya aparece dos veces** y va a aparecer una tercera. No antes.

| Situación | Qué hacer |
|---|---|
| Ya existe y encaja | Úsalo tal cual |
| Ya existe pero le falta una variante | Añade la variante por props |
| Ya existe pero necesitarías 4+ props nuevas | Es otro componente |
| Aparece una sola vez | Déjalo en la página, sin extraer |

Un componente que solo se usa en un sitio no es una abstracción, es un archivo de más.

## Lo que no se hace

- Gradientes, glassmorphism, sombras de colores, animaciones decorativas.
- Emojis como iconos en la interfaz.
- Un color, un tamaño de fuente o un radio que no esté en `design-system.md`.
- Más de un botón primario visible a la vez.
- Tarjetas dentro de tarjetas.
- Texto sobre imágenes o fondos de bajo contraste.
- Rellenar una pantalla con métricas, gráficas o widgets que nadie pidió.

## Antes de darlo por hecho

- [ ] Funciona a 375 px de ancho sin scroll horizontal.
- [ ] Todo estado existe: carga, vacío, error, éxito y deshabilitado.
- [ ] Se puede recorrer con el teclado y el foco se ve.
- [ ] Cada input tiene `<label>`, y su error se anuncia con `aria-describedby`.
- [ ] Los colores y espaciados salen del sistema, ninguno es improvisado.
- [ ] Si has creado un componente nuevo, había al menos dos usos.

## Referencias

Ambas en `.claude/skills/web-design-system/`. Léelas antes de maquetar, no después:

- **`design-system.md`** — colores, tipografía, espaciado, radios, sombras, breakpoints.
- **`patterns.md`** — recetas de botón, input, select, card, modal, tabla, formularios, estados
  y accesibilidad.
