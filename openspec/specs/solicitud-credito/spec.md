# solicitud-credito Specification

## Purpose

Define qué constituye una solicitud de crédito educativo válida: los campos que el solicitante
debe aportar y sus restricciones, las restricciones del video de entrevista, y los estados por
los que pasa la solicitud. Estas reglas son un contrato único que validan tanto el navegador
como la API, para que no puedan divergir.

## Requirements

### Requirement: Campos de la solicitud

Una solicitud de crédito MUST incluir nombre completo, documento de identidad, institución
educativa, programa académico y monto solicitado. Todos son obligatorios y se validan con las
mismas reglas en el cliente y en el servidor.

#### Scenario: Solicitud con todos los campos válidos

- **WHEN** se validan unos datos con los cinco campos dentro de sus restricciones
- **THEN** la validación tiene éxito y devuelve los datos ya tipados

#### Scenario: Falta un campo obligatorio

- **WHEN** se validan unos datos a los que les falta cualquiera de los cinco campos
- **THEN** la validación falla e indica qué campo falta

#### Scenario: El documento de identidad contiene caracteres no numéricos

- **WHEN** el documento de identidad incluye letras, espacios o signos de puntuación
- **THEN** la validación falla con un mensaje en español

#### Scenario: El documento de identidad tiene una longitud fuera de rango

- **WHEN** el documento tiene menos de 5 o más de 20 dígitos
- **THEN** la validación falla

### Requirement: Monto solicitado

El monto MUST ser un número entero positivo. No existe un máximo de negocio: el enunciado no lo
fija y no se inventa uno. El único límite superior es técnico — el mayor entero que JavaScript
representa con exactitud — para que el valor no pierda precisión al ir y volver de la base de
datos.

#### Scenario: Monto entero positivo

- **WHEN** el monto es un entero mayor que cero dentro del rango seguro
- **THEN** la validación tiene éxito

#### Scenario: Monto cero o negativo

- **WHEN** el monto es cero o negativo
- **THEN** la validación falla

#### Scenario: Monto con decimales

- **WHEN** el monto tiene parte decimal
- **THEN** la validación falla

#### Scenario: Monto fuera del rango de enteros seguros

- **WHEN** el monto supera el mayor entero representable con exactitud
- **THEN** la validación falla, porque el valor no sobreviviría intacto al almacenamiento

### Requirement: Restricciones del video de entrevista

El video MUST tener formato `.mp4` o `.webm` y MUST NOT superar los 200 MB. El tamaño máximo se expresa en
mebibytes (200 × 1024 × 1024 = 209.715.200 bytes) y es un único valor compartido por la
validación del navegador, la política de subida firmada y la verificación posterior del objeto
almacenado. Los tres MUST usar exactamente el mismo número.

#### Scenario: Tipo de contenido permitido

- **WHEN** el tipo de contenido es `video/mp4` o `video/webm`
- **THEN** la validación tiene éxito

#### Scenario: Tipo de contenido no permitido

- **WHEN** el tipo de contenido es cualquier otro, por ejemplo `video/avi` o `application/pdf`
- **THEN** la validación falla con un mensaje en español que indica los formatos aceptados

#### Scenario: Video exactamente en el límite de tamaño

- **WHEN** el video pesa exactamente 209.715.200 bytes
- **THEN** la validación tiene éxito, porque el límite es inclusivo

#### Scenario: Video por encima del límite

- **WHEN** el video pesa un solo byte más que el límite
- **THEN** la validación falla

#### Scenario: Video vacío

- **WHEN** el video pesa cero bytes
- **THEN** la validación falla

### Requirement: Extensión derivada del tipo de contenido

La extensión del archivo almacenado MUST derivarse del tipo de contenido, y MUST NOT derivarse
del nombre de archivo que aporta el usuario. El nombre original no cruza la frontera hacia el almacenamiento,
lo que elimina por construcción la posibilidad de manipular la ruta del objeto.

#### Scenario: Extensión de cada tipo permitido

- **WHEN** se solicita la extensión de `video/mp4` o de `video/webm`
- **THEN** se obtiene `mp4` y `webm` respectivamente

### Requirement: Rechazo de campos desconocidos

La entrada de creación de una solicitud MUST NOT aceptar claves que no formen parte del
contrato.
Un campo desconocido es un error explícito, no algo que se descarte en silencio, para que un
cliente no pueda intentar fijar valores que corresponden al servidor.

#### Scenario: La entrada incluye un campo que el servidor controla

- **WHEN** la entrada incluye `status`, `userId` o cualquier otra clave ajena al contrato
- **THEN** la validación falla en lugar de ignorar el campo

### Requirement: Estados de la solicitud

Una solicitud MUST encontrarse en uno de dos estados: pendiente de video, cuando se registraron
los datos pero el video aún no está confirmado en el almacenamiento; y en revisión, cuando el
video quedó confirmado. El ciclo de vida del crédito (aprobación o rechazo) queda fuera de
alcance según la sección 6 del enunciado, por lo que no se modela.

#### Scenario: Estado reconocido

- **WHEN** se valida un estado que es pendiente de video o en revisión
- **THEN** la validación tiene éxito

#### Scenario: Estado no reconocido

- **WHEN** se valida cualquier otro estado
- **THEN** la validación falla

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
