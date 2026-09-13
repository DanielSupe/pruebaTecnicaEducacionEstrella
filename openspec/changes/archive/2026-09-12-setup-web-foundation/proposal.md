## Why

El frontend es un directorio con un archivo vacío. Antes de construir pantallas hace falta el
esqueleto, y ese esqueleto decide cosas caras de cambiar después: cómo se navega, de dónde salen
los colores y qué ve el usuario cuando la API falla.

Este change además cierra el riesgo de integración de esta capa. Una pantalla que llama a la API
real prueba de golpe la URL base, el cliente y, sobre todo, que el CORS que configuramos acepta
al frontend. Descubrir un fallo de CORS con el formulario de subida a medias cuesta el triple de
diagnosticar.

## What Changes

- `apps/web` pasa de esqueleto a una aplicación que arranca en el navegador:
  - Vite con React y TypeScript.
  - Tailwind con los colores de marca del sistema de diseño, tomados del logotipo.
  - Navegación declarada de forma explícita, sin generación de código.
  - Proveedor de datos para las peticiones a la API.
  - Configuración validada, de modo que una variable ausente rompa la construcción y no la
    experiencia de un usuario.
  - Cliente HTTP con la dirección de la API y traducción de sus errores a mensajes en español.
  - Estructura visual común: cabecera con la marca y contenedor de contenido.
- Una pantalla que consulta el estado de la API y muestra el resultado, con sus estados de carga
  y de error.
- `scripts/gen-env.sh` pasa a emitir también la dirección de la API.

## Capabilities

### New Capabilities

- `aplicacion-web`: qué garantiza la aplicación al construirse, cómo trata un fallo de
  comunicación con la API y en qué dispositivos es utilizable.

### Modified Capabilities

Ninguna.

## Alternativas descartadas

- **Navegación generada a partir de archivos.** Es lo que recomienda la documentación y ahorra
  código repetido, pero añade un complemento de construcción y deja en el repositorio un archivo
  que nadie escribió. Con media docena de rutas, el ahorro no compensa tener que explicar una
  capa de magia.
- **Usar `fetch` para la API y reservar el cliente HTTP solo para la subida.** `fetch` no informa
  del progreso de una subida, así que para el vídeo hace falta otra cosa igualmente. Tener dos
  clientes significa dos caminos de manejo de errores y dos sitios donde traducir los mensajes.
- **Montar ya el entorno de pruebas de componentes.** En este change no hay ningún componente con
  lógica: son andamiaje y maquetación. Se prueba lo único que tiene comportamiento, la validación
  de la configuración. El resto entra con el formulario, que es donde por fin hay algo que probar.
- **Añadir el interceptor que adjunta las credenciales.** Hoy no hay credenciales que adjuntar.
  Montar el gancho antes que aquello que lo alimenta es escribir una abstracción sin uso; llega
  con la autenticación.
- **Entregar solo el andamiaje, sin una pantalla que llame a la API.** Sería un change que no
  demuestra nada y que deja vivo justo el riesgo que este change debería cerrar.
- **Una librería de componentes de interfaz.** El sistema de diseño ya define los patrones y
  Tailwind los cubre. Una librería traería opiniones visuales propias que habría que domar.

## Requisitos del enunciado que cubre

- **4.1**: React sin framework de servidor, por decisión sustentada: la aplicación es privada
  tras autenticación, así que no hay nada que indexar ni que renderizar en servidor.
- **Sección 7, "Frontend"**: estados de carga y de error visibles desde la primera pantalla.

## Impact

- `apps/web/`: configuración de construcción, estilos, navegación, cliente HTTP y estructura
  visual.
- `scripts/gen-env.sh`: una variable más.
- Sin cambios en la API ni en la infraestructura.
- Desbloquea `add-web-auth` y, tras él, el resto de pantallas.
