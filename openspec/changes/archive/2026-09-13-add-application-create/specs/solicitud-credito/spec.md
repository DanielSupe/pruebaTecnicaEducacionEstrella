## ADDED Requirements

### Requirement: Registro de una solicitud

Un solicitante autenticado MUST poder registrar una solicitud. Los datos MUST validarse en el
servidor con las mismas reglas que aplica el navegador, **aunque el navegador ya las haya
aplicado**: el cliente no es una frontera de confianza.

La solicitud MUST quedar asociada al solicitante mediante la identidad del token verificado, y
MUST NOT tomarse de ningún dato de la petición.

#### Scenario: Solicitud válida

- **WHEN** un solicitante autenticado envía unos datos válidos
- **THEN** la solicitud queda registrada como pendiente de vídeo y se devuelve su identificador

#### Scenario: Datos inválidos

- **WHEN** los datos no cumplen las reglas del contrato compartido
- **THEN** se rechaza indicando qué campo falla, sin registrar nada

#### Scenario: La petición intenta fijar a quién pertenece

- **WHEN** la petición incluye un identificador de usuario o un estado
- **THEN** se rechaza por contener campos que no forman parte del contrato

#### Scenario: Sin autenticar

- **WHEN** la petición llega sin credenciales válidas
- **THEN** se rechaza sin registrar nada

### Requirement: Autorización de subida acotada

Al registrar una solicitud, el servidor MUST devolver una autorización de subida que permita
**exactamente una** operación: escribir un objeto concreto, de un tipo concreto, dentro de un
rango de tamaño y marcado como pendiente.

La autorización MUST caducar. Y MUST NOT permitir escribir en ninguna otra ubicación del
almacenamiento, aunque quien la reciba lo intente.

#### Scenario: Subida conforme a lo autorizado

- **WHEN** se sube un vídeo del tipo autorizado y dentro del rango de tamaño
- **THEN** el almacenamiento lo acepta

#### Scenario: Intento de escribir en otra ubicación

- **WHEN** se intenta usar la autorización para escribir un objeto distinto del autorizado
- **THEN** el almacenamiento lo rechaza

#### Scenario: Archivo por encima del límite

- **WHEN** se intenta subir un archivo mayor que el máximo permitido
- **THEN** el almacenamiento lo rechaza, con independencia de lo que el cliente haya declarado

#### Scenario: Autorización caducada

- **WHEN** se intenta subir después de que la autorización caduque
- **THEN** el almacenamiento lo rechaza

### Requirement: La ubicación del vídeo la decide el servidor

La ruta del objeto MUST construirla el servidor a partir de la identidad del solicitante, del
identificador de la solicitud y del tipo de contenido. MUST NOT derivarse del nombre del archivo
que aporta el usuario ni aceptarse desde la petición: así no hay ruta que manipular, en lugar de
haber una ruta que vigilar.

#### Scenario: Vídeos de solicitantes distintos

- **WHEN** dos solicitantes registran sendas solicitudes
- **THEN** sus vídeos quedan en ubicaciones separadas por su identidad

#### Scenario: El nombre del archivo no influye

- **WHEN** el archivo del usuario tiene un nombre extraño o con caracteres de ruta
- **THEN** la ubicación resultante no se ve afectada

### Requirement: El vídeo nace marcado como pendiente

Todo vídeo MUST subirse marcado como pendiente, y esa marca MUST formar parte de la autorización
de modo que quien sube no pueda omitirla ni cambiarla. Es lo que permite distinguir después un
vídeo huérfano de uno confirmado: la limpieza automática del almacenamiento no puede consultar la
base de datos, así que el estado tiene que viajar en el propio objeto.

#### Scenario: Vídeo recién subido

- **WHEN** se sube un vídeo con la autorización recibida
- **THEN** queda marcado como pendiente

#### Scenario: Intento de subir sin la marca

- **WHEN** se intenta subir omitiendo la marca o cambiándola
- **THEN** el almacenamiento rechaza la subida

### Requirement: Las solicitudes pendientes expiran

Una solicitud que nunca llega a confirmarse MUST desaparecer por sí sola, en un plazo acorde al
de la limpieza del almacenamiento. Si ambos plazos divergen, quedan solicitudes que apuntan a
vídeos inexistentes, o vídeos sin solicitud que los reclame.

#### Scenario: Solicitud abandonada

- **WHEN** una solicitud queda pendiente de vídeo y se cumple su plazo
- **THEN** se elimina sin intervención de la aplicación
