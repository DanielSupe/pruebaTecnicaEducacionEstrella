## Purpose

Define los recursos de nube que sostienen la aplicación y las garantías que deben cumplir:
qué se almacena y con qué clave, cómo se protege el video de entrevista, cómo se autentica un
solicitante y qué se hace con los archivos que nadie llegó a confirmar.

## ADDED Requirements

### Requirement: Almacenamiento de solicitudes

Las solicitudes MUST almacenarse en una tabla con clave compuesta por usuario y solicitud, de
modo que recuperar las solicitudes de un usuario sea una consulta por clave. La tabla MUST NOT
recorrerse por completo para atender esa consulta.

#### Scenario: Consulta de las solicitudes de un usuario

- **WHEN** se recuperan las solicitudes de un usuario concreto
- **THEN** se resuelve con una consulta por clave de partición, sin recorrer la tabla entera

#### Scenario: Solicitud abandonada antes de subir el video

- **WHEN** una solicitud queda pendiente de video y su marca de expiración se cumple
- **THEN** la tabla la elimina automáticamente, sin intervención de la aplicación

### Requirement: El bucket de videos no es público

El bucket que almacena los videos MUST bloquear todo acceso público y MUST cifrar los objetos
en reposo. Las peticiones sin cifrado en tránsito MUST rechazarse.

#### Scenario: Intento de acceso anónimo a un video

- **WHEN** alguien sin credenciales solicita un objeto del bucket
- **THEN** el acceso es denegado

#### Scenario: Petición por un canal sin cifrar

- **WHEN** una petición al bucket llega sin cifrado en tránsito
- **THEN** la política del bucket la rechaza

#### Scenario: Subida desde el navegador

- **WHEN** el navegador sube un video desde un origen autorizado
- **THEN** la configuración de intercambio de recursos entre orígenes lo permite, y lo rechaza
  desde cualquier otro origen

### Requirement: Limpieza de videos huérfanos

Los videos que nunca llegaron a confirmarse MUST eliminarse automáticamente. Como las reglas de
ciclo de vida del almacenamiento no pueden consultar la base de datos, el estado MUST viajar en
el propio objeto: se sube marcado como pendiente y la confirmación lo remarca, lo que lo saca
del alcance de la regla de limpieza.

#### Scenario: Video subido y nunca confirmado

- **WHEN** un video permanece marcado como pendiente más allá del plazo de retención
- **THEN** la regla de ciclo de vida lo elimina

#### Scenario: Video confirmado

- **WHEN** un video fue confirmado y por tanto remarcado
- **THEN** la regla de limpieza de pendientes ya no lo alcanza

#### Scenario: Tope de coste

- **WHEN** cualquier objeto del bucket supera el plazo máximo de retención del entorno de
  demostración
- **THEN** se elimina, para acotar el consumo de la capa gratuita

### Requirement: Registro e inicio de sesión de solicitantes

El directorio de usuarios MUST permitir que un solicitante se registre con correo y contraseña
y que inicie sesión de inmediato. El correo MUST ser el nombre de usuario, no un alias, porque
un alias solo se resuelve cuando está verificado y aquí no se verifica.

#### Scenario: Registro de un solicitante

- **WHEN** una persona se registra con un correo y una contraseña válidos
- **THEN** queda confirmada y puede iniciar sesión sin pasar por un código de verificación

#### Scenario: Correo sin verificar

- **WHEN** se registra un solicitante
- **THEN** su correo NO queda marcado como verificado, porque nadie lo comprobó

#### Scenario: Contraseña que no cumple la política

- **WHEN** la contraseña no alcanza la longitud mínima o carece de mayúscula, minúscula o dígito
- **THEN** el registro es rechazado

### Requirement: Cliente de aplicación sin secreto

El cliente de aplicación que usa el navegador MUST NOT tener secreto asociado: un secreto
incrustado en una aplicación de página única no es secreto. El token de acceso MUST tener una
vigencia corta, y la sesión MUST poder renovarse para satisfacer la persistencia que pide el
enunciado.

#### Scenario: Cliente pensado para el navegador

- **WHEN** el frontend se autentica contra el directorio de usuarios
- **THEN** lo hace sin presentar ningún secreto de cliente

### Requirement: Permisos mínimos y trazas acotadas

Cada función MUST recibir solo los permisos que necesita. Los registros de ejecución MUST tener
un plazo de retención explícito, porque la retención indefinida por omisión crece sin control y
acaba costando dinero.

#### Scenario: Permisos de la función de pre-registro

- **WHEN** se revisan los permisos de la función que confirma a los solicitantes
- **THEN** solo puede escribir sus propios registros de ejecución

#### Scenario: Retención de registros

- **WHEN** se crea el grupo de registros de una función
- **THEN** tiene un plazo de retención definido y no indefinido

### Requirement: Identificadores emitidos como salidas

Los identificadores de la infraestructura (nombres de tabla y de bucket, identificadores del
directorio de usuarios y de su cliente, región) MUST emitirse como salidas de la
infraestructura como código. MUST NOT transcribirse a mano al código de las
aplicaciones.

#### Scenario: Configuración de las aplicaciones

- **WHEN** una aplicación necesita conocer un identificador de infraestructura
- **THEN** lo obtiene de la configuración generada a partir de las salidas, no de un valor
  escrito en el código
