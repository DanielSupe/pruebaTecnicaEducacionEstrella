## Why

La API sabe registrar una solicitud, autorizar la subida y verificarla, pero nadie la usa: no
existe la pantalla desde la que un solicitante haga nada de eso.

Aquí se juegan dos requisitos que el enunciado enuncia de forma explícita: validar tipo y tamaño
del archivo **antes de consumir ancho de banda innecesario**, y mostrar el progreso de la subida.
Ninguno se puede satisfacer desde el servidor.

## What Changes

- Pantalla de nueva solicitud con los cinco campos y el selector de vídeo.
- Validación en el navegador con los mismos esquemas que aplica el servidor, y rechazo del
  archivo antes de iniciar ninguna transferencia.
- Subida directa al almacenamiento con indicador de progreso, y aviso posterior a la API.
- Posibilidad de cancelar una subida en curso.
- Recuperación de cada punto de fallo del flujo, con reintento que no duplica solicitudes.
- El hook de formularios se generaliza: hasta ahora mezclaba la validación con la traducción de
  errores de autenticación, y con un segundo consumidor conviene separarlas.
- Se corrige el contexto del proyecto, que lista una librería de formularios que no se usa.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: describía las reglas del dominio y el comportamiento de la API. Se añade
  cómo un solicitante envía realmente una solicitud desde el navegador y qué ocurre cuando algo
  falla por el camino.

## Alternativas descartadas

- **Subir el vídeo con el cliente HTTP de la aplicación.** Ese cliente adjunta el token de acceso
  a cada petición: usarlo para el almacenamiento mandaría nuestras credenciales a un tercero que
  no las necesita ni debe verlas. La subida va con una llamada sin interceptores.
- **Introducir una librería de formularios.** El contexto del proyecto la menciona, pero las dos
  pantallas de acceso ya se construyeron con estado propio y un hook compartido. Tener dos formas
  de hacer formularios conviviendo es exactamente lo que se señala al revisar coherencia. Se
  mantiene el patrón existente y se corrige el contexto.
- **Validar el archivo solo en el servidor.** El enunciado pide explícitamente rechazarlo antes de
  gastar ancho de banda, y la comprobación del servidor sigue existiendo de todos modos: el
  límite lo impone la autorización firmada.
- **Volver a crear la solicitud para reintentar una subida fallida.** Dejaría una solicitud
  huérfana por cada intento y obligaría a rellenar el formulario otra vez. Se pide una
  autorización nueva sobre la misma solicitud.
- **Deshabilitar el botón de envío mientras el formulario esté incompleto.** Deja al usuario sin
  saber qué le falta. Se envía, se valida y se señalan los errores.
- **Omitir la cancelación.** Una subida de 200 MB puede tardar minutos; equivocarse de archivo a
  los diez segundos no debería obligar a esperar a que termine.

## Requisitos del enunciado que cubre

- **3.2**: el formulario completo con sus cinco campos y el vídeo.
- **3.2**: "validación de tipo y tamaño del archivo antes de consumir ancho de banda innecesario".
- **3.2**: "indicador de progreso de la subida".
- **3.2**: "manejo explícito del caso de error: la subida falla, la conexión se corta, el archivo
  excede el límite".
- **Sección 7, "Frontend"**: estados de carga y error visibles, y que el flujo funcione sin
  sorpresas.

## Impact

- `apps/web/`: la pantalla, el flujo de subida, el hook generalizado y dos componentes nuevos.
- `openspec/config.yaml`: se retira la librería de formularios que no se usa.
- Sin cambios en la API ni en la infraestructura: ambos endpoints ya existen y están verificados.
- Cierra el segundo ciclo del roadmap: el flujo de subida funcionando de extremo a extremo.
