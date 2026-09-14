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

### Requirement: El aviso de subida completada verifica lo almacenado

Cuando el solicitante avisa de que terminó de subir, el servidor MUST comprobar el objeto
realmente almacenado antes de dar la solicitud por enviada: que existe, que no supera el tamaño
máximo y que es del tipo esperado.

Esta MUST ser la única comprobación que mira el tamaño **real**. La del navegador evita gastar
ancho de banda y la de la autorización firmada acota lo que el almacenamiento acepta, pero solo
aquí se observa lo que de verdad quedó guardado.

El servidor MUST NOT dar por buena la palabra del cliente: recibir el aviso no es prueba de que
haya subido nada.

#### Scenario: El vídeo está donde debía

- **WHEN** el solicitante avisa y el objeto existe, dentro del tamaño y del tipo esperados
- **THEN** la solicitud pasa a estar enviada y se devuelve su estado

#### Scenario: Aviso sin haber subido nada

- **WHEN** el solicitante avisa pero no hay ningún objeto en la ubicación esperada
- **THEN** se rechaza por conflicto con el estado actual y la solicitud sigue pendiente

#### Scenario: El objeto no coincide con lo autorizado

- **WHEN** el objeto almacenado supera el tamaño máximo o no es del tipo esperado
- **THEN** se rechaza y la solicitud sigue pendiente

### Requirement: Avisar dos veces produce el mismo resultado

El aviso MUST poder repetirse sin efectos distintos. Es un caso corriente, no una anomalía: la
red se corta antes de recibir la respuesta, o alguien cierra la pestaña tras subir y vuelve más
tarde.

En ese segundo caso el servidor MUST reparar el estado a partir de lo que encuentra almacenado,
en lugar de pedir que se suba el vídeo otra vez.

#### Scenario: El aviso llega repetido

- **WHEN** se avisa de nuevo sobre una solicitud ya enviada
- **THEN** se responde con éxito y el mismo estado, sin cambiar nada

#### Scenario: Se subió el vídeo pero nunca se avisó

- **WHEN** el solicitante vuelve a una solicitud pendiente cuyo vídeo ya está almacenado y avisa
- **THEN** la solicitud pasa a enviada sin necesidad de volver a subir

### Requirement: El vídeo confirmado queda fuera de la limpieza automática

Al dar la solicitud por enviada, el objeto MUST remarcarse como confirmado, de modo que la
limpieza de huérfanos deje de alcanzarlo. Ese remarcado MUST ocurrir **antes** de actualizar la
solicitud.

El orden importa: si se actualizara primero y fallara el remarcado, quedaría una solicitud
enviada con su vídeo aún marcado como pendiente, y la limpieza automática lo borraría. En el
orden inverso, un fallo intermedio deja la solicitud pendiente con el vídeo a salvo, y se repara
al reintentar.

#### Scenario: Solicitud enviada

- **WHEN** una solicitud pasa a estar enviada
- **THEN** su vídeo queda marcado como confirmado y la limpieza de huérfanos ya no lo alcanza

#### Scenario: La expiración se retira

- **WHEN** una solicitud pasa a estar enviada
- **THEN** deja de tener plazo de expiración, porque solo expiran las que nunca se completaron

### Requirement: Reintentar la subida sin rehacer el formulario

El solicitante MUST poder obtener una nueva autorización de subida para una solicitud propia que
siga pendiente, sin volver a introducir sus datos. Es lo que permite recuperarse de una subida
interrumpida o de una autorización caducada.

Una solicitud ya enviada MUST NOT poder volver a autorizarse: su vídeo ya está confirmado.

#### Scenario: Reintento sobre una solicitud pendiente

- **WHEN** se pide una nueva autorización para una solicitud propia pendiente de vídeo
- **THEN** se devuelve una autorización nueva, equivalente a la original

#### Scenario: Reintento sobre una solicitud ya enviada

- **WHEN** se pide una nueva autorización para una solicitud que ya está enviada
- **THEN** se rechaza por conflicto con el estado actual

### Requirement: Solo se opera sobre solicitudes propias

Las operaciones sobre una solicitud concreta MUST limitarse a las del solicitante autenticado.
Una solicitud ajena MUST comportarse como inexistente: distinguir "no existe" de "no es tuya"
revela qué identificadores están en uso.

#### Scenario: Solicitud de otro solicitante

- **WHEN** se avisa o se pide autorización sobre una solicitud que pertenece a otro
- **THEN** la respuesta es la misma que para una solicitud inexistente

#### Scenario: Solicitud inexistente

- **WHEN** el identificador no corresponde a ninguna solicitud
- **THEN** se responde que no existe

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

### Requirement: Consulta de las solicitudes propias

Un solicitante autenticado MUST poder obtener las solicitudes que ha registrado. La respuesta
MUST incluir, de cada una, su estado y la fecha en que se creó, que es lo que el enunciado pide
mostrar.

Las solicitudes MUST devolverse de más reciente a más antigua: quien entra a consultar viene casi
siempre a ver la última.

#### Scenario: Solicitante con solicitudes

- **WHEN** un solicitante autenticado consulta sus solicitudes
- **THEN** las recibe ordenadas de más reciente a más antigua, con su estado y su fecha

#### Scenario: Solicitante sin solicitudes

- **WHEN** consulta alguien que no ha registrado ninguna
- **THEN** recibe una lista vacía, no un error: no tener solicitudes es un estado normal

#### Scenario: Sin autenticar

- **WHEN** la consulta llega sin credenciales válidas
- **THEN** se rechaza

### Requirement: Solo se devuelven las solicitudes propias

La consulta MUST devolver únicamente las solicitudes del solicitante autenticado. La identidad
MUST formar parte de la clave con la que se consulta, NO ser un filtro aplicado después de leer:
lo primero hace imposible devolver datos ajenos, lo segundo depende de acordarse de filtrar en
cada sitio.

#### Scenario: Dos solicitantes distintos

- **WHEN** dos solicitantes con solicitudes propias consultan cada uno las suyas
- **THEN** ninguno ve ni una sola solicitud del otro

#### Scenario: La petición intenta indicar de quién son

- **WHEN** la petición incluye un identificador de usuario
- **THEN** se ignora: la identidad sale del token verificado

### Requirement: Resultados paginados

La respuesta MUST estar acotada y MUST indicar si quedan más resultados, ofreciendo la forma de
pedirlos. El almacenamiento corta por sí solo al alcanzar un tamaño máximo, así que sin una
paginación explícita el corte ocurre igualmente pero de forma invisible y sin manera de continuar.

Un puntero de continuación MUST NOT permitir leer solicitudes de otro solicitante, aunque se
manipule: la identidad con la que se consulta se fija en el servidor, no se toma del puntero.

#### Scenario: Hay más resultados de los que caben

- **WHEN** un solicitante tiene más solicitudes de las que devuelve una página
- **THEN** recibe la primera página junto con un puntero para pedir la siguiente

#### Scenario: Se pide la página siguiente

- **WHEN** se consulta usando el puntero recibido
- **THEN** se obtienen las siguientes, **sin repetir** ninguna de la página anterior

#### Scenario: No quedan más resultados

- **WHEN** la página devuelta es la última
- **THEN** no se ofrece puntero de continuación

#### Scenario: Puntero manipulado

- **WHEN** se consulta con un puntero alterado o perteneciente a otro solicitante
- **THEN** NO se devuelven solicitudes ajenas

### Requirement: La ubicación del vídeo no se expone

La respuesta MUST NOT incluir la ruta del objeto en el almacenamiento. Es un detalle interno: el
solicitante no la necesita, y publicarla revela cómo está organizado el almacenamiento.

#### Scenario: Contenido de cada solicitud devuelta

- **WHEN** se consultan las solicitudes
- **THEN** cada una trae sus datos, su estado y sus fechas, pero no la ruta del objeto

### Requirement: Enlace temporal para ver el vídeo

El solicitante MUST poder obtener un enlace con el que reproducir el vídeo de una solicitud suya.
El enlace MUST estar firmado y MUST caducar: el almacenamiento es privado y no se abre para esto.

La respuesta MUST incluir el instante en que el enlace deja de servir, para que quien lo use sepa
cuándo pedir otro en lugar de descubrirlo con un fallo.

El enlace firmado es una credencial: MUST NOT persistirse en la base de datos ni escribirse en
los registros de la aplicación.

#### Scenario: Solicitud propia con el vídeo confirmado

- **WHEN** el solicitante pide el enlace del vídeo de una solicitud suya ya enviada
- **THEN** recibe un enlace firmado con el que puede reproducir el vídeo, y el instante en que
  caduca

#### Scenario: Enlace caducado

- **WHEN** se usa el enlace después del instante de caducidad
- **THEN** el almacenamiento lo rechaza, y obtener uno nuevo vuelve a permitir la reproducción

#### Scenario: Sin autenticar

- **WHEN** se pide el enlace sin una sesión válida
- **THEN** se responde con no autorizado y no se firma nada

### Requirement: No hay enlace para un vídeo sin confirmar

Si la solicitud sigue pendiente de vídeo, la API MUST NOT firmar un enlace. Puede no haber objeto
almacenado, o haber uno que nunca se verificó. Firmar hacia algo que quizá no existe traslada al
usuario un fallo del almacenamiento que no puede interpretar.

#### Scenario: Solicitud pendiente de vídeo

- **WHEN** el solicitante pide el enlace de una solicitud que aún no tiene el vídeo confirmado
- **THEN** se responde con un conflicto que explica que todavía no hay vídeo que ver

### Requirement: El enlace solo alcanza al vídeo propio

Un enlace MUST firmarse únicamente sobre la ubicación registrada en la solicitud del solicitante
autenticado. Una solicitud ajena MUST comportarse como inexistente, igual que en el resto de
operaciones: distinguir "no existe" de "no es tuya" permitiría averiguar qué identificadores
están en uso.

La ubicación del objeto MUST seguir sin aparecer en ninguna respuesta: el enlace la contiene
firmada, pero no se devuelve como dato aparte.

#### Scenario: Identificador de otro solicitante

- **WHEN** alguien pide el enlace de una solicitud que no es suya
- **THEN** se responde como si no existiera y no se firma nada

#### Scenario: Identificador inexistente

- **WHEN** el identificador no corresponde a ninguna solicitud
- **THEN** se responde como si no existiera

