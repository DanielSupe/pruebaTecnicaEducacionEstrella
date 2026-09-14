## Why

El listado devuelve el estado y la fecha de cada solicitud, que es lo que pide el requisito 3.3,
pero el vídeo subido queda fuera de alcance: nadie puede volver a verlo. Se pide poder hacerlo
desde el listado.

**Esto amplía el alcance por decisión del propietario del proyecto, no por recomendación mía.**
Lo dejo escrito porque el proposal es donde se sustentan las decisiones: el enunciado no pide ver
el vídeo, y señalé que era funcionalidad que nadie había pedido. La respuesta fue que sí, con un
enlace temporal. Queda anotado y se construye.

Y hay una propiedad del mecanismo que conviene tener presente antes de elegirlo: **un enlace
firmado es una credencial dentro de una URL**. Quien la obtenga —de un historial, de un registro
de proxy, de una captura compartida— puede ver el vídeo hasta que caduque. Es inherente a la
técnica, no un defecto de esta implementación. Se acota con una caducidad corta y no guardando la
URL en ningún sitio.

## What Changes

- `GET /applications/:id/video-url`: devuelve un enlace de lectura firmado y con caducidad, más
  el instante en que deja de servir.
- Solo sobre solicitudes propias y solo cuando el vídeo está confirmado.
- El contrato de la respuesta vive en `packages/shared`, como el resto.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: hasta ahora el vídeo entraba al sistema y no volvía a salir. Se añade la
  única vía de lectura, con sus límites.

## Decisiones

**El mismo camino, distinto método.** `POST /applications/:id/video-url` ya existe y autoriza
escribir el vídeo; `GET` sobre ese mismo camino autoriza leerlo. Es el mismo recurso —la URL del
vídeo de esa solicitud— y el método distingue las dos operaciones. La alternativa era inventar un
segundo camino (`/video-link`, `/video-view-url`), que se parece tanto al existente que invita a
confundirlos.

**Caducidad de 15 minutos, no de 5.** No es una cifra redonda elegida al azar. Un elemento
`<video>` no descarga el archivo de una vez: va pidiendo trozos conforme se reproduce y cada vez
que alguien adelanta. Con cinco minutos, adelantar en el minuto siete rompe la reproducción con
un error que el usuario no puede interpretar. Quince cubren una sesión de visionado completa y
siguen siendo una ventana corta. Cada apertura pide un enlace nuevo: no se reutiliza el anterior.

**Solo con el vídeo confirmado.** Una solicitud pendiente puede no tener objeto almacenado, o
tener uno a medias. Firmar un enlace hacia algo que quizá no existe produce un 403 opaco de S3 en
la cara del usuario. Con el estado se sabe de antemano y se responde con un conflicto explicable.

**La URL firmada no se persiste ni se registra.** Es una credencial de corta vida: guardarla en
la tabla o escribirla en un log la convertiría en una credencial de larga vida.

## Alternativas descartadas

- **Servir el vídeo a través de la API.** El límite de tamaño de respuesta de API Gateway y
  Lambda hace imposible devolver un archivo de hasta 200 MB. Es la misma razón por la que la
  subida no pasa por la API: la firma es lo que vuelve viable la opción serverless.
- **Exponer el bucket por CloudFront.** Daría acceso de lectura a los vídeos de todo el mundo, o
  exigiría montar cookies firmadas para acotarlo. Es mucha maquinaria para un caso de uso que ni
  siquiera estaba en el enunciado.
- **Responder con una redirección a la URL firmada.** El endpoint exige cabecera de
  autenticación, y un elemento `<video>` no puede enviarla: no llegaría a seguir la redirección.
  La respuesta tiene que ser un dato que el navegador pida y luego use.
- **Caducidad larga (una hora, como la subida).** La de subida es larga porque transferir 200 MB
  por una conexión lenta lleva minutos y está acotada a **una** operación concreta sobre **una**
  ruta. Leer no necesita esa ventana, y aquí la URL circula por la barra de direcciones del
  reproductor.

## Impact

- `apps/api/`: una función que firma la lectura y una ruta que la expone.
- `packages/shared/`: el contrato de la respuesta.
- **Sin cambios en infraestructura**: `s3:GetObject` ya está en la política del change 9, donde
  se añadió para poder consultar los metadatos del objeto almacenado. El mismo permiso autoriza
  firmar una lectura, porque firmar delega los permisos de quien firma.
- Roadmap: este change se intercala como 12 y el listado web pasa a 13, porque cada commit lleva
  un único scope y mezclar API y navegador en uno solo dejaría el historial peor de lo que está.
