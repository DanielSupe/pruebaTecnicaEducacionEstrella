## ADDED Requirements

### Requirement: El solicitante ve sus solicitudes con estado y fecha

La aplicación MUST ofrecer una pantalla donde el solicitante autenticado vea las solicitudes que
ha enviado. Cada una MUST mostrar al menos su estado y la fecha en que se creó, y MUST aparecer
de más reciente a más antigua.

El estado MUST mostrarse con el texto del dominio en español y MUST NOT mostrarse con el
identificador interno. El color MUST NOT ser el único indicio: quien no distinga los tonos tiene
que poder leerlo.

#### Scenario: El solicitante tiene solicitudes

- **WHEN** entra en la pantalla de sus solicitudes
- **THEN** las ve con su estado y su fecha, la más reciente primero

#### Scenario: Solicitudes de otras personas

- **WHEN** se dibuja el listado
- **THEN** solo aparecen las del solicitante autenticado

### Requirement: La vista contempla los cuatro estados de carga

La pantalla MUST distinguir cargando, sin resultados, error y con contenido. Una vista que solo
contempla el caso feliz está a medio hacer.

No tener solicitudes MUST tratarse como un estado normal y MUST NOT presentarse como un error:
es la situación de quien acaba de registrarse. El estado vacío MUST decir qué hacer a
continuación, no limitarse a informar de que no hay nada.

Si el listado no llega, el aviso MUST mostrarse **en línea**, donde iría el contenido, y MUST
ofrecer reintentar. MUST NOT usarse una ventana emergente: obligaría a cerrarla para mirar una
pantalla vacía. El mensaje técnico crudo MUST NOT llegar a la interfaz.

#### Scenario: Todavía no llegan los datos

- **WHEN** la consulta está en curso
- **THEN** se muestra una indicación de carga con la forma del contenido que va a llegar

#### Scenario: Sin ninguna solicitud

- **WHEN** el solicitante no ha enviado ninguna
- **THEN** se le explica que aún no tiene solicitudes y cómo crear la primera

#### Scenario: El listado no se puede cargar

- **WHEN** la consulta falla
- **THEN** se avisa en línea, en español, con la opción de reintentar

### Requirement: El listado se pide por páginas

El listado MUST pedirse en páginas y MUST permitir traer la siguiente sin perder las ya
mostradas. El puntero de continuación MUST devolverse tal y como lo entregó la API, sin
interpretarlo ni reconstruirlo: es opaco a propósito.

Cuando no queden más, la opción de traer más MUST NOT ofrecerse.

#### Scenario: Hay más solicitudes de las que caben en una página

- **WHEN** el solicitante pide ver más
- **THEN** se añaden las siguientes a las que ya estaban, sin repetir ninguna

#### Scenario: No quedan más solicitudes

- **WHEN** la última página ya se mostró
- **THEN** no se ofrece traer más

### Requirement: Una solicitud pendiente de vídeo se puede completar desde el listado

Una solicitud que quedó pendiente de vídeo MUST poder completarse desde el listado. Sin esto, una
subida cancelada o fallida deja una solicitud inalcanzable en cuanto se recarga la página.

La interfaz MUST pedir el archivo otra vez y MUST NOT presentar la operación como reanudar una
transferencia: el navegador ya no conserva el archivo tras una recarga. La subida MUST
reutilizar la solicitud existente con una autorización nueva, y MUST NOT crear otra solicitud.

Durante la transferencia MUST mostrarse el progreso y MUST poder cancelarse, deteniendo la
transferencia de verdad. Al terminar, la solicitud MUST reflejar su nuevo estado sin que el
solicitante tenga que recargar.

#### Scenario: Se completa la subida pendiente

- **WHEN** el solicitante elige el vídeo desde el listado y la subida termina
- **THEN** esa solicitud pasa a figurar como enviada, en el sitio donde estaba

#### Scenario: Falla la subida desde el listado

- **WHEN** la transferencia se interrumpe
- **THEN** se explica qué pasó y se puede reintentar sin abandonar el listado

#### Scenario: Se cancela la subida desde el listado

- **WHEN** el solicitante cancela la transferencia en curso
- **THEN** se detiene, no se avisa de ningún error y la solicitud sigue pendiente

### Requirement: El vídeo enviado se puede ver desde el listado

Una solicitud con el vídeo ya confirmado MUST permitir reproducirlo, usando el enlace temporal
que firma la API. El enlace MUST pedirse en el momento de abrir la reproducción y MUST NOT
guardarse para reutilizarlo más tarde: caduca, y es una credencial.

Si el enlace no se puede obtener, MUST explicarse dentro de la misma ventana desde la que se
pidió, que es donde está mirando quien lo pidió.

#### Scenario: Reproducir el vídeo de una solicitud enviada

- **WHEN** el solicitante abre el vídeo de una solicitud suya ya enviada
- **THEN** puede reproducirlo, y avanzar dentro de él funciona

#### Scenario: Solicitud todavía sin vídeo confirmado

- **WHEN** la solicitud sigue pendiente de vídeo
- **THEN** no se ofrece reproducir nada, se ofrece completar la subida

#### Scenario: No se puede obtener el enlace

- **WHEN** la API no devuelve el enlace
- **THEN** se explica en la propia ventana, en español y sin detalle técnico

### Requirement: Las ventanas emergentes con contenido se pueden cerrar y devuelven el foco

Una ventana emergente que lleve contenido con estado MUST atrapar el foco mientras está abierta,
MUST cerrarse con la tecla de escape y MUST devolver el foco al elemento que la abrió. Quien
navega con teclado se queda perdido en la página de detrás si no.

Cerrarla mientras hay una transferencia en curso MUST pedir confirmación: perder una subida casi
terminada por un clic accidental es peor que el clic de más.

#### Scenario: Cierre con teclado

- **WHEN** se pulsa escape con la ventana abierta y sin transferencia en curso
- **THEN** se cierra y el foco vuelve al botón que la abrió

#### Scenario: Cierre durante una transferencia

- **WHEN** se intenta cerrar mientras el vídeo se está subiendo
- **THEN** se pide confirmación antes de detenerla
