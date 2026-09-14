## ADDED Requirements

### Requirement: El archivo se rechaza antes de transferirlo

Si el vídeo elegido no es de un formato aceptado o supera el tamaño máximo, la interfaz MUST
avisar **sin iniciar ninguna transferencia**. El enunciado lo pide de forma explícita: validar
tipo y tamaño antes de consumir ancho de banda innecesario.

La comprobación MUST usar los mismos límites que aplica el servidor, no una copia. Y NO sustituye
a la del servidor: sigue existiendo, porque el cliente no es una frontera de confianza.

#### Scenario: Formato no aceptado

- **WHEN** el solicitante elige un archivo que no es de los formatos permitidos
- **THEN** se le avisa junto al selector y no se transfiere ni un byte

#### Scenario: Archivo por encima del límite

- **WHEN** el archivo elegido supera el tamaño máximo
- **THEN** se le avisa indicando el límite, y no se transfiere nada

#### Scenario: Archivo aceptable

- **WHEN** el archivo cumple formato y tamaño
- **THEN** queda listo para enviarse junto al formulario

### Requirement: El progreso de la subida es visible

Durante la transferencia la interfaz MUST mostrar cuánto lleva subido. Una subida de hasta
200 MB puede tardar minutos: sin indicación, el usuario no distingue "está subiendo" de "se
colgó", y lo normal es que recargue y lo estropee.

Mientras la subida está en curso, el formulario MUST impedir que se envíe de nuevo.

#### Scenario: Subida en curso

- **WHEN** el vídeo se está transfiriendo
- **THEN** se muestra el progreso y avanza conforme se envía el archivo

#### Scenario: Intento de reenviar durante la subida

- **WHEN** el solicitante intenta enviar otra vez mientras sube
- **THEN** no se inicia una segunda subida

### Requirement: La subida se puede cancelar

El solicitante MUST poder cancelar una subida en curso, y la cancelación MUST detener la
transferencia de verdad, no solo dejar de mostrarla. Cancelar MUST pedir confirmación: perder una
subida casi terminada por un clic accidental es peor que el clic de más.

#### Scenario: Cancelación confirmada

- **WHEN** el solicitante cancela y lo confirma
- **THEN** la transferencia se detiene y la interfaz vuelve a permitir elegir y enviar

#### Scenario: Cancelación descartada

- **WHEN** el solicitante cancela y no lo confirma
- **THEN** la subida continúa sin interrupción

### Requirement: Cada fallo del envío tiene salida

El envío atraviesa varios pasos y puede fallar en cualquiera. En todos los casos la interfaz MUST
explicar qué ocurrió en español y ofrecer una salida. MUST NOT quedarse indefinidamente en estado
de carga, ni mostrar el error técnico, ni perder lo que el solicitante ya había escrito.

#### Scenario: Falla el registro de la solicitud

- **WHEN** la API rechaza el registro o no responde
- **THEN** se avisa y el formulario conserva los datos introducidos

#### Scenario: Falla la transferencia del vídeo

- **WHEN** la subida se interrumpe o el almacenamiento la rechaza
- **THEN** se avisa y se ofrece reintentar **sin volver a rellenar el formulario**

#### Scenario: Falla el aviso posterior

- **WHEN** el vídeo sube pero el aviso a la API no llega
- **THEN** se avisa y se ofrece reintentar

### Requirement: Reintentar no duplica solicitudes

Un reintento tras una subida fallida MUST reutilizar la solicitud ya registrada y pedir una
autorización nueva, porque la anterior puede haber caducado. MUST NOT crearse una solicitud
nueva: cada intento fallido dejaría una huérfana.

#### Scenario: Reintento tras una subida fallida

- **WHEN** el solicitante reintenta después de que falle la subida
- **THEN** se reutiliza la misma solicitud y se obtiene una autorización nueva

#### Scenario: La autorización había caducado

- **WHEN** el reintento ocurre después de que la autorización original caduque
- **THEN** la nueva autorización permite completar la subida

### Requirement: Envío completado

Cuando el vídeo queda confirmado, el solicitante MUST saber que su solicitud se envió, y MUST
llegar a un lugar donde pueda verla. Quedarse en un formulario vacío no dice si funcionó.

#### Scenario: Solicitud enviada

- **WHEN** el flujo termina correctamente
- **THEN** se confirma al solicitante y se le lleva a donde figuran sus solicitudes
