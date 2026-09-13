## 1. Andamiaje de Vite

- [x] 1.1 Dependencias de producción: `react`, `react-dom`, `@tanstack/react-router`, `@tanstack/react-query`, `axios`, `zod` y el paquete `shared` del workspace
- [x] 1.2 Dependencias de desarrollo: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`
- [x] 1.3 `index.html` con idioma `es`, título y el favicon desde `public/`
- [x] 1.4 `vite.config.ts` con los complementos de React y Tailwind, y el puerto de desarrollo fijado al que espera el CORS de la API
- [x] 1.5 `tsconfig.json` de `apps/web` con `jsx: react-jsx`, `lib` de DOM y la referencia a los tipos de Vite, necesaria para importar imágenes
- [x] 1.6 Scripts `dev`, `build` y `preview`; el `lint` y el `typecheck` ya existen
- [x] 1.7 Comprobar que `pnpm peers check` sigue limpio

## 2. Estilos y tokens de marca

- [x] 2.1 `src/index.css` con `@import "tailwindcss"` y el bloque `@theme` **copiado del sistema de diseño**, no inventado: los seis tokens de marca y los semánticos
- [x] 2.2 Verificar que las clases generadas existen de verdad (`bg-brand`, `text-brand-accent`, `bg-ink`) y no fallan en silencio
- [x] 2.3 Comprobar el contraste real del botón primario sobre blanco: debe superar 4.5:1, que es la razón de que el turquesa del logo no sea el color de acción

## 3. Configuración

- [x] 3.1 `src/config/env.ts`: esquema Zod sobre `import.meta.env` con la dirección de la API. Las variables de Cognito llegan en `add-web-auth`
- [x] 3.2 La validación se ejecuta al importarse y falla ruidosamente: en una aplicación de página única los valores se incrustan al construir, así que este es el último momento para detectar una ausencia
- [x] 3.3 `apps/web/.env.example` con la variable y una nota apuntando a `scripts/gen-env.sh`
- [x] 3.4 Ampliar `scripts/gen-env.sh` para que emita la dirección de la API, con el valor de desarrollo local
- [x] 3.5 Verificar que `import.meta.env` no aparece fuera de `src/config/env.ts`

## 4. Cliente HTTP

- [x] 4.1 `src/lib/http.ts`: instancia de axios con la dirección base de la configuración
- [x] 4.2 Traducir el error de la API al mensaje en español que verá el usuario, leyendo el formato de error que la API ya define. **Sin interceptor de credenciales**: llega en `add-web-auth`, cuando exista un token que adjuntar
- [x] 4.3 Distinguir tres casos, porque al usuario le importan distinto: la API respondió con error, la API no respondió, y la petición se canceló
- [x] 4.4 Nunca propagar a la interfaz el mensaje técnico crudo ni un código de estado a secas

## 5. Navegación y datos

- [x] 5.1 `src/routes/`: árbol de rutas **escrito a mano**, sin generación de código
- [x] 5.2 Ruta raíz que renderiza la estructura común y una ruta de inicio
- [x] 5.3 Proveedor de consultas con valores por omisión sensatos: sin reintento infinito ante un 4xx, que solo hace esperar al usuario ante un error que no se va a arreglar solo
- [x] 5.4 `src/main.tsx` monta React, el router y el proveedor

## 6. Estructura visual

- [x] 6.1 `src/components/AppShell.tsx`: cabecera con el logotipo horizontal enlazando al inicio, y contenedor de contenido con el ancho máximo y el relleno lateral del sistema de diseño
- [x] 6.2 En móvil la cabecera usa el isotipo cuadrado; el logotipo horizontal no cabe
- [x] 6.3 Seguir la skill `web-design-system`: ningún color, espaciado ni radio fuera de los tokens
- [x] 6.4 Mover el favicon a `public/` y dejar en `src/assets/` solo lo que se importa

## 7. Pantalla de estado de la API

- [x] 7.1 Pantalla de inicio que consulta la comprobación de vida de la API
- [x] 7.2 Estado de carga con esqueleto, no con un indicador centrado que desplace el contenido
- [x] 7.3 Estado de error con mensaje en español y botón de reintentar
- [x] 7.4 Estado de éxito que muestra que la API responde

## 8. Pruebas

- [x] 8.1 El esquema de configuración falla si falta la dirección de la API
- [x] 8.2 El esquema rechaza una dirección que no es una URL válida
- [x] 8.3 La traducción de errores de la API produce mensajes en español para los tres casos, sin filtrar el detalle técnico
- [x] 8.4 Verificar que Vitest informa de más de cero pruebas

## 9. Verificación

- [x] 9.1 `pnpm turbo lint typecheck test` en verde en los cuatro paquetes
- [x] 9.2 `pnpm --filter web build` produce un artefacto sin errores
- [x] 9.3 Comprobar que construir **sin** la variable de la API falla, y que el mensaje dice cuál falta
- [x] 9.4 **Arrancar la API y el frontend a la vez y comprobar en el navegador que la pantalla de inicio obtiene el estado de la API.** Es la verificación que cierra el riesgo de CORS de esta capa
- [x] 9.5 Apagar la API y comprobar que la pantalla muestra el error con opción de reintentar, no una pantalla en blanco
- [x] 9.6 Estructura revisada: el contenido usa el contenedor y los márgenes laterales del sistema de diseño, sin anchos fijos que puedan desbordar. **La comprobación real a 375 px queda pendiente**: la herramienta de navegador disponible no expone emulación de viewport. Se hará en `add-web-application-form`, que es donde el riesgo de desbordamiento es real

## 10. Cierre del change

- [x] 10.1 Escáner de secretos limpio, con atención a que no se cuele `apps/web/.env`
- [x] 10.2 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 10.3 Archivar el change y sincronizar la capability `aplicacion-web`
- [x] 10.4 Cerrar con un único commit: `✨ feat(web): base del frontend con vite y tailwind`
