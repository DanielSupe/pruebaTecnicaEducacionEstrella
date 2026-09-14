## Why

La API no se entera de la subida: el vídeo va del navegador al almacenamiento sin pasarle por
delante. Alguien tiene que avisar de que terminó, y ese aviso es lo que falta para que una
solicitud llegue a existir de verdad.

Es además la última barrera del tamaño. El navegador comprueba antes de subir y la autorización
firmada acota lo que el almacenamiento acepta, pero **solo aquí se mira el tamaño realmente
almacenado**. Sin este paso el circuito queda abierto.

## What Changes

- `POST /api/v1/applications/:id/complete-upload`: verifica el objeto, lo remarca como
  confirmado y da la solicitud por enviada.
- `POST /api/v1/applications/:id/video-url`: vuelve a autorizar la subida de una solicitud propia
  que sigue pendiente, para reintentar sin rellenar el formulario otra vez.
- Nueva clase de error para el conflicto con el estado actual (409).
- Lectura y actualización condicional de solicitudes.
- Se amplía la política de permisos con lo que estas operaciones necesitan.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: describía cómo se registra una solicitud y cómo se autoriza la subida. Se
  añade cómo se cierra el ciclo, qué se verifica del objeto almacenado y cómo se reintenta.

## Alternativas descartadas

- **Llamar al endpoint `confirm`.** "Confirmar una solicitud" se lee como aprobar el crédito, que
  está explícitamente fuera de alcance. El nombre llegó a confundir durante la planificación del
  propio change; confundiría también a quien lea la lista de endpoints. `complete-upload` dice lo
  que hace.
- **Responder con conflicto si el aviso llega dos veces.** No es aprobar dos veces: es que el
  mismo "ya subí" llegue repetido, algo habitual con una red poco fiable y sobre todo cuando
  alguien cierra la pestaña tras subir y vuelve más tarde. Avisar dos veces produce el mismo
  resultado que avisar una, y así el navegador puede reintentar sin tratar casos especiales.
- **Actualizar la solicitud antes de remarcar el objeto.** Si fallara entre medias, la solicitud
  quedaría enviada con el objeto aún marcado como pendiente, y la limpieza automática borraría el
  vídeo de una solicitud válida. En el orden elegido, un fallo intermedio se repara reintentando.
- **Fiarse de que la autorización firmada garantiza el tipo de contenido.** Lo garantiza, pero el
  dato llega en la misma respuesta que el tamaño, así que comprobarlo no cuesta nada y detectaría
  una autorización mal construida o un cambio futuro que la aflojara.
- **Dejar que el navegador vuelva a crear la solicitud para reintentar.** Obligaría a rellenar el
  formulario de nuevo y dejaría una solicitud huérfana por cada intento fallido.
- **Borrar el objeto cuando la verificación falla.** La limpieza automática ya se encarga, y
  borrar desde el camino de error añade una operación que también puede fallar.

## Requisitos del enunciado que cubre

- **3.2**: "al finalizar, la solicitud queda registrada con su estado y una referencia al vídeo
  almacenado" — este change es el que hace que eso ocurra.
- **3.2**: "manejo explícito del caso de error: la subida falla, la conexión se corta".
- **Sección 7, "Backend y manejo de archivos"**: verificación del lado servidor de lo que
  realmente se almacenó.

## Impact

- `apps/api/`: una clase de error, lectura y actualización de solicitudes, verificación y
  reetiquetado del objeto, y dos rutas.
- `infra/`: permisos adicionales en la política ya existente, que sigue sin adjuntarse a un rol.
- Desbloquea el formulario del navegador, que necesita ambos endpoints.
