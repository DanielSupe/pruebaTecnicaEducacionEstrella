## Why

El requisito 3.3 del enunciado pide una vista donde el solicitante vea las solicitudes que ha
enviado, con su estado y su fecha. No existe el endpoint que las devuelva.

Hay un segundo motivo, menos visible: el change anterior dejó un hueco. Una solicitud cuya subida
se canceló o falló queda pendiente de vídeo y **no hay forma de volver a ella**. Este endpoint es
la mitad de API de esa recuperación; el listado la mostrará con su botón de reintentar.

## What Changes

- `GET /api/v1/applications` devuelve las solicitudes del solicitante autenticado, de más
  reciente a más antigua.
- La respuesta se pagina con un límite y un cursor.
- Se amplía la política de permisos con la consulta a la tabla.
- El contrato de la respuesta paginada se define en el paquete compartido.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: describía cómo se registra, se sube y se envía una solicitud. Se añade
  cómo un solicitante consulta las suyas.

## Alternativas descartadas

- **Devolver todo sin paginar.** Parece más simple, pero el límite existe igualmente: una
  consulta a la base de datos corta por sí sola al alcanzar un tamaño máximo de respuesta. Sin
  cursor ese corte es invisible, trunca en silencio y no deja forma de pedir el resto. Con él, el
  corte es explícito y continuable.
- **Construir también un endpoint de detalle.** Figuraba en el plan, pero el listado ya devuelve
  todos los datos que la interfaz necesita, así que nadie lo llamaría. Sería un endpoint muerto.
- **Ordenar en memoria tras leer.** No hace falta: el identificador de la clave de ordenación es
  ordenable por tiempo, así que la propia consulta devuelve el orden correcto.
- **Un índice secundario para ordenar por fecha.** Tampoco hace falta, por lo mismo, y añadiría
  coste de escritura en cada solicitud registrada.
- **Filtrar por propietario después de leer.** La identidad forma parte de la clave, de modo que
  las solicitudes ajenas no están en el conjunto que se consulta. Filtrar después sería depender
  de acordarse de hacerlo en cada sitio.
- **Incluir una dirección para ver el vídeo.** Exigiría firmar una autorización de lectura por
  cada solicitud del listado. La revisión del vídeo corresponde al equipo de análisis, que queda
  fuera de alcance según la sección 6 del enunciado.

## Desviación consciente del roadmap

El plan listaba `GET /applications/:id` junto al listado. No se construye: nada lo consumiría y
añadir un endpoint que nadie llama contradice la regla de no escribir código sin uso.

## Requisitos del enunciado que cubre

- **3.3**: la vista de solicitudes con su estado y su fecha — este change entrega los datos.
- **Sección 7, "Seguridad"**: no exposición de datos ajenos.

## Impact

- `apps/api/`: consulta paginada y una ruta.
- `packages/shared/`: contrato de la respuesta.
- `infra/`: una acción más en la política, que sigue sin adjuntarse a un rol.
- Desbloquea el listado en el navegador, y con él el tercer ciclo del roadmap.
