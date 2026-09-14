# autenticacion Specification

## Purpose

Define quién puede llamar a los recursos protegidos de la API, qué tiene que presentar para
demostrar su identidad y de dónde sale el identificador con el que el servidor decide a qué
datos puede acceder.

## Requirements

### Requirement: Los recursos protegidos exigen credenciales

Una petición a un recurso protegido MUST presentar un token de acceso válido. Sin él, o con uno
que no supere la verificación, la respuesta MUST ser 401 y MUST usar el formato de error común
de la API.

#### Scenario: Petición sin credenciales

- **WHEN** se llama a un recurso protegido sin cabecera de autorización
- **THEN** la respuesta es 401 con el formato de error común, y el manejador del recurso no llega
  a ejecutarse

#### Scenario: Cabecera con formato incorrecto

- **WHEN** la cabecera de autorización existe pero no sigue el esquema esperado
- **THEN** la respuesta es 401

#### Scenario: Token que no supera la verificación

- **WHEN** el token está manipulado, caducado o firmado por otra entidad
- **THEN** la respuesta es 401 y el motivo concreto NO se revela al cliente

#### Scenario: Token válido

- **WHEN** el token supera la verificación
- **THEN** la petición continúa hasta el manejador del recurso

### Requirement: El token debe estar emitido para esta aplicación

La verificación MUST comprobar, además de la firma, que el token fue emitido para el cliente de
esta aplicación y que es un token de **acceso**. Comprobar únicamente la firma responde si el
token es auténtico, no si va dirigido a este servicio: un token emitido por el mismo directorio
de usuarios para otro cliente es criptográficamente válido y MUST rechazarse.

#### Scenario: Token emitido para otro cliente

- **WHEN** llega un token firmado por el mismo directorio de usuarios pero emitido para un
  cliente distinto
- **THEN** se rechaza con 401

#### Scenario: Token de identidad en lugar de token de acceso

- **WHEN** llega un token de identidad válido en lugar de uno de acceso
- **THEN** se rechaza con 401

### Requirement: La identidad procede del token, nunca de la petición

El identificador del usuario MUST obtenerse del token ya verificado y MUST NOT leerse del cuerpo,
de la ruta ni de la cadena de consulta. Aceptarlo de la petición permitiría a cualquiera actuar
en nombre de otro.

#### Scenario: Identidad disponible tras la verificación

- **WHEN** un token supera la verificación
- **THEN** el manejador dispone del identificador del usuario extraído de ese token

#### Scenario: La petición intenta declarar una identidad

- **WHEN** la petición incluye un identificador de usuario en su contenido
- **THEN** ese valor se ignora por completo a efectos de identidad

### Requirement: La comprobación de vida permanece pública

La comprobación de vida MUST seguir siendo accesible sin credenciales. Exigirle autenticación la
inutilizaría para su propósito, que es responder si el proceso está en pie.

#### Scenario: Comprobación de vida sin credenciales

- **WHEN** se consulta la comprobación de vida sin cabecera de autorización
- **THEN** responde con éxito

### Requirement: Las claves de verificación se obtienen al arrancar

Las claves públicas necesarias para verificar los tokens MUST obtenerse durante el arranque. Si
no pueden obtenerse, el proceso MUST NOT quedarse aceptando peticiones que está condenado a
rechazar.

#### Scenario: Directorio de usuarios accesible

- **WHEN** el proceso arranca y el directorio de usuarios responde
- **THEN** las claves quedan disponibles antes de atender la primera petición

#### Scenario: Directorio de usuarios mal configurado

- **WHEN** el identificador del directorio de usuarios es incorrecto o inaccesible
- **THEN** el arranque falla indicando el problema, en lugar de descubrirse en la primera
  petición de un usuario real

### Requirement: Registro de un solicitante

Un solicitante MUST poder crear una cuenta con correo y contraseña y quedar dentro de la
aplicación sin pasos adicionales. Si la cuenta se crea pero no se consigue iniciar la sesión, el
mensaje MUST decir precisamente eso, porque el usuario ya tiene cuenta y repetir el registro
fallaría.

#### Scenario: Registro correcto

- **WHEN** alguien se registra con un correo libre y una contraseña que cumple la política
- **THEN** queda con la sesión iniciada y en la zona privada de la aplicación

#### Scenario: El correo ya está registrado

- **WHEN** el correo pertenece a una cuenta existente
- **THEN** se explica que ya existe y se ofrece ir a iniciar sesión

#### Scenario: La contraseña no cumple la política

- **WHEN** la contraseña no alcanza lo que exige el directorio de usuarios
- **THEN** se indica qué falta **antes** de enviar nada

#### Scenario: La cuenta se crea pero la sesión no

- **WHEN** el registro tiene éxito y el inicio de sesión posterior falla
- **THEN** el mensaje aclara que la cuenta existe y que debe iniciar sesión, en lugar de sugerir
  que el registro falló

### Requirement: Inicio de sesión

Un solicitante registrado MUST poder iniciar sesión con su correo y su contraseña. Un fallo de
credenciales MUST NOT revelar si el correo existe: distinguirlo permite averiguar qué correos
están dados de alta.

#### Scenario: Credenciales correctas

- **WHEN** el correo y la contraseña son correctos
- **THEN** la sesión queda iniciada y se llega a la zona privada

#### Scenario: Credenciales incorrectas

- **WHEN** la contraseña no corresponde, o el correo no está registrado
- **THEN** se muestra el mismo mensaje en ambos casos, y el usuario puede corregir sin perder lo
  que ya había escrito

### Requirement: La sesión persiste entre visitas

La sesión MUST sobrevivir a recargar la página y a cerrar y reabrir el navegador, mientras siga
siendo válida. El requisito 3.1 del enunciado pide sesión persistente de forma explícita.

#### Scenario: Recargar la página

- **WHEN** alguien con la sesión iniciada recarga
- **THEN** sigue dentro, sin volver a introducir credenciales

#### Scenario: Volver más tarde

- **WHEN** alguien cierra el navegador y vuelve antes de que la sesión caduque
- **THEN** sigue dentro

### Requirement: Las zonas privadas exigen sesión

Las rutas privadas MUST exigir una sesión válida. Quien no la tenga MUST ser llevado a iniciar
sesión. La comprobación MUST resolverse **antes** de pintar la pantalla privada: mostrarla y
retirarla después deja ver, aunque sea un instante, algo que no debía verse.

#### Scenario: Acceso sin sesión

- **WHEN** alguien sin sesión abre una ruta privada, o la escribe directamente en la barra
- **THEN** se le lleva a iniciar sesión sin que la pantalla privada llegue a pintarse

#### Scenario: Acceso con sesión

- **WHEN** alguien con sesión válida abre una ruta privada
- **THEN** la pantalla se muestra

#### Scenario: Ya hay sesión al abrir el acceso

- **WHEN** alguien con sesión iniciada abre la pantalla de inicio de sesión o la de registro
- **THEN** se le lleva a la zona privada, en lugar de ofrecerle entrar de nuevo

### Requirement: Cada petición a la API viaja identificada

Toda petición a la API desde una zona privada MUST adjuntar el token de acceso vigente. El token
MUST obtenerse en el momento de la petición, NO de una copia guardada: es la librería de
autenticación quien decide cuándo renovarlo, y una copia propia acaba enviando tokens caducados.

#### Scenario: Petición con sesión iniciada

- **WHEN** la aplicación llama a la API con la sesión iniciada
- **THEN** la petición lleva el token de acceso vigente

#### Scenario: El token estaba a punto de caducar

- **WHEN** el token vigente está próximo a caducar y la sesión sigue siendo renovable
- **THEN** la petición viaja con un token renovado, sin que el usuario note nada

### Requirement: Cierre de sesión

Un solicitante MUST poder cerrar sesión desde cualquier pantalla privada, y MUST confirmarlo
antes: es una acción con consecuencia que conviene no disparar por un clic accidental. Tras
cerrarla, los datos de la sesión anterior MUST NOT seguir accesibles.

#### Scenario: Cerrar sesión

- **WHEN** el solicitante cierra sesión y lo confirma
- **THEN** la sesión termina y se le lleva a la pantalla de acceso

#### Scenario: Cancelar el cierre

- **WHEN** el solicitante cancela la confirmación
- **THEN** la sesión continúa y no se pierde nada

#### Scenario: Volver atrás tras cerrar sesión

- **WHEN** tras cerrar sesión se intenta volver a una pantalla privada
- **THEN** se exige iniciar sesión de nuevo

### Requirement: Sesión caducada durante el uso

Si la API rechaza una petición por credenciales no válidas, la aplicación MUST avisar de que la
sesión caducó y llevar a iniciar sesión. MUST NOT dejarse al usuario ante una pantalla que ya no
va a funcionar, ni redirigir en silencio sin explicar por qué.

#### Scenario: La API rechaza la sesión

- **WHEN** una petición recibe una respuesta de credenciales no válidas
- **THEN** se avisa de que la sesión caducó y se lleva a iniciar sesión

#### Scenario: Sin bucles de redirección

- **WHEN** el rechazo ocurre estando ya en una pantalla pública
- **THEN** no se produce ninguna redirección adicional
