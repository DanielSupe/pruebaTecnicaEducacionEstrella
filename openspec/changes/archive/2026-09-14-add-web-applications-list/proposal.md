## Why

El requisito 3.3 del enunciado es lo único del alcance obligatorio que sigue sin construirse:
*"una vista donde el usuario autenticado ve las solicitudes que ha enviado, con su estado y
fecha"*. La API la sirve entera desde los changes 11 y 12; falta la pantalla que la consuma.

Y cierra un agujero funcional que dejó el formulario. Una solicitud cuya subida se canceló o
falló queda pendiente de vídeo, y **hoy no hay forma de volver a ella**: el reintento solo existe
mientras la pestaña siga abierta. Al recargar, esa solicitud desaparece de la vista para siempre
y su vídeo nunca llega.

## What Changes

- Pantalla de solicitudes propias con estado y fecha, en lugar de la comprobación de servicio que
  ocupaba la raíz como andamio.
- Los cuatro estados de carga de datos: cargando, vacío, error y con contenido.
- Paginación por cursor, asomada como un botón de cargar más.
- Reintento de la subida desde el propio listado, en una ventana emergente.
- Reproducción del vídeo ya enviado, con el enlace temporal que firma la API.
- Un componente de ventana emergente para contenido con estado, distinto de los avisos.
- La skill `web-design-system` gana la regla que separa los dos tipos de ventana emergente.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: describe cómo se envía una solicitud y qué hace la API con ella. Se añade
  qué ve el solicitante después: sus solicitudes, en qué estado están y qué puede hacer con cada
  una.

## Decisiones

**Reintentar no es reanudar.** Un `File` no sobrevive a una recarga: cuando alguien vuelve al
listado, el navegador ya no tiene el archivo. Así que el botón de una solicitud pendiente no
continúa una transferencia interrumpida, pide elegir el vídeo otra vez y lo sube con una
autorización nueva sobre la **misma** solicitud. Decirlo así en la interfaz importa: prometer
"reanudar" y pedir el archivo de nuevo se lee como un fallo.

**Las ventanas emergentes con contenido van sobre el `<dialog>` del navegador.** SweetAlert2
sigue siendo el único camino para confirmar, avisar de un error y avisar de un éxito. Pero recibe
HTML, no componentes, y estas dos llevan estado vivo: una barra que avanza, un selector de
archivo, un botón que aborta una petición en curso y un reproductor. El elemento nativo da
exactamente lo que se le agradece a la librería —trampa de foco, cierre con `Esc`, `aria-modal`,
fondo inerte— sin montar React dentro de su contenedor ni sincronizar dos ciclos de vida.

**Una acción por fila, la que corresponde al estado.** Pendiente de vídeo ofrece subirlo;
enviada, verlo. Mostrar ambas siempre y desactivar la que no aplica obligaría a explicar por qué
está desactivada.

**El monto se muestra agrupado y sin símbolo de moneda.** La moneda no se persiste —se decidió
al modelar—, así que pintar un `$` afirmaría algo que el dato no contiene. La unidad va en la
cabecera de la columna.

**En móvil la tabla se convierte en lista de tarjetas.** Son cinco columnas: forzar
desplazamiento horizontal es la salida perezosa. Lo que se duplica es la disposición, no la
lógica.

## Alternativas descartadas

- **Mantener la comprobación de servicio en la raíz y poner el listado en otra ruta.** Esa
  pantalla era andamio del change 6 para ver que el navegador hablaba con la API. Conservarla
  ocuparía el destino principal con información que no le importa a un solicitante. Borrar
  código es progreso.
- **Un endpoint de detalle por solicitud.** El listado ya devuelve todos los campos que la
  interfaz necesita: nadie lo consumiría.
- **Refrescar el listado periódicamente.** El estado solo cambia por una acción del propio
  usuario. Consultar en bucle gastaría capacidad para no enterarse de nada nuevo.
- **Desplazamiento infinito en lugar de un botón.** Roba el control y complica volver a donde
  estabas. Con un botón, quien no necesita más no pide más.
- **Reintentar creando una solicitud nueva.** Dejaría una huérfana por cada intento y obligaría
  a rellenar el formulario entero otra vez.
- **Resolver las dos ventanas emergentes con SweetAlert2 igualmente.** Mantendría una sola
  tecnología, al precio de un portal de React dentro del contenedor de la librería y dos ciclos
  de vida que sincronizar, justo en la parte que más costó afinar.

## Requisitos del enunciado que cubre

- **3.3**: la vista de solicitudes enviadas con su estado y su fecha.
- **Sección 7, "Frontend"**: estados de carga y error visibles, y un flujo que no deja al usuario
  sin salida.

## Impact

- `apps/web/`: la pantalla nueva, dos ventanas emergentes, tres componentes y la consulta
  paginada. Se borra la pantalla de comprobación de servicio.
- `.claude/skills/web-design-system/`: la regla que separa aviso de ventana con contenido. Se
  commitea con este change porque nace de él.
- **Sin cambios en la API ni en la infraestructura**: los tres endpoints que consume existen y
  están verificados contra AWS.
- Cierra el tercer ciclo del roadmap: el flujo completo funcionando en local. Después solo quedan
  despliegue y documentación.
