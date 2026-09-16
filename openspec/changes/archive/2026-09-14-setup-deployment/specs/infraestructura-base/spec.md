## ADDED Requirements

### Requirement: La aplicación es alcanzable en internet

El frontend MUST servirse desde una dirección pública sobre HTTPS, y la API MUST ser alcanzable
desde ese frontend. El enunciado pide una URL desplegada y funcionando: una aplicación que solo
corre en la máquina de quien la escribió no está entregada.

El bucket que guarda el frontend MUST seguir siendo privado. Solo la distribución MUST poder
leerlo, mediante un acceso de origen restringido.

#### Scenario: Alguien abre la dirección pública

- **WHEN** se visita la dirección del frontend
- **THEN** la aplicación carga sobre HTTPS

#### Scenario: Se intenta leer el bucket del frontend directamente

- **WHEN** se pide un archivo al bucket sin pasar por la distribución
- **THEN** el almacenamiento lo rechaza

### Requirement: El frontend y la API comparten un único origen

La API MUST servirse bajo un camino de la misma distribución que el frontend. Así el navegador
habla con un solo origen y entre él y nuestra API no hay intercambio de recursos entre orígenes
que configurar.

Esto NO elimina el CORS del sistema: el bucket de vídeos lo sigue necesitando para la subida
firmada, y el directorio de usuarios se llama directamente desde el navegador.

El comportamiento que atiende a la API MUST NOT cachear respuestas: son respuestas autenticadas y
distintas para cada solicitante. MUST reenviar las cabeceras del visitante —la de autorización
incluida, sin la cual ninguna petición funcionaría— y MUST NOT reenviar la cabecera de anfitrión,
porque la puerta de enlace rechaza las peticiones cuyo anfitrión no es el suyo.

#### Scenario: Comprobación de vida a través del dominio público

- **WHEN** se pide la ruta de comprobación de vida de la API en el dominio del frontend
- **THEN** responde la API

#### Scenario: Petición autenticada a través del dominio público

- **WHEN** el frontend pide sus solicitudes con una sesión válida
- **THEN** la API las devuelve, porque la cabecera de autorización llegó hasta ella

#### Scenario: Dos solicitantes distintos

- **WHEN** dos personas distintas piden sus solicitudes
- **THEN** cada una recibe las suyas, sin que una respuesta cacheada alcance a la otra

### Requirement: Las respuestas llevan cabeceras de seguridad

Las respuestas del frontend MUST incluir una política de seguridad de contenido. Es la
contrapartida concreta de guardar los tokens en el almacenamiento del navegador, que es lo que
implica una sesión persistente en una aplicación de página única: lo que hace aceptable ese riesgo
es que no haya forma de ejecutar script ajeno.

La política MUST prohibir el script en línea. MUST permitir únicamente los orígenes que la
aplicación necesita de verdad: el propio, el directorio de usuarios y el almacenamiento de vídeos.

La política MUST verificarse con la aplicación en marcha y sin violaciones en la consola del
navegador. Declararla no es cumplirla.

#### Scenario: La aplicación funciona con la política puesta

- **WHEN** se recorre el flujo completo con la política activa
- **THEN** no se registra ninguna violación de la política

#### Scenario: Script inyectado

- **WHEN** se intenta ejecutar script que no viene del origen propio
- **THEN** el navegador lo bloquea

### Requirement: Recargar en una ruta del cliente devuelve la aplicación

El enrutado lo resuelve el navegador, así que en el almacenamiento no existe ningún archivo para
las rutas del cliente. Recargar en una de ellas MUST devolver la aplicación, no un error.

#### Scenario: Recarga en una ruta interna

- **WHEN** alguien recarga estando en una ruta que solo conoce el cliente
- **THEN** la aplicación carga y muestra esa misma pantalla

### Requirement: El gasto de la API tiene un tope

Las ejecuciones simultáneas de la API MUST estar acotadas. Es una función que cualquiera puede
invocar: sin tope, un abuso se traduce en factura y en agotar la capacidad de la cuenta.

El despliegue MUST ofrecer el tope por función como valor configurable, porque es el que de verdad
aísla: sin él, un abuso de la API consume también la capacidad del resto de funciones. Cuando el
límite total de la cuenta sea tan bajo que reservar resulte imposible, ese límite MUST hacer de
tope y la situación MUST quedar documentada, en lugar de declarar un valor que el proveedor
rechaza.

#### Scenario: Ráfaga de peticiones

- **WHEN** llegan más peticiones simultáneas de las que el tope permite
- **THEN** el exceso se rechaza en lugar de escalar sin freno

#### Scenario: La cuenta no permite reservar

- **WHEN** el límite total de la cuenta impide reservar capacidad para una función
- **THEN** el despliegue funciona apoyándose en el límite de la cuenta, y lo deja documentado

### Requirement: La destrucción del bucket de vídeos es una decisión declarada

El bucket de vídeos MUST declarar por configuración si puede destruirse conteniendo objetos, y el
valor por omisión MUST ser que no. Un entorno desechable puede optar por salirse; el valor por
omisión tiene que ser el que no destruye datos por descuido.

#### Scenario: Valor por omisión

- **WHEN** no se indica nada
- **THEN** el bucket no puede destruirse mientras conserve objetos
