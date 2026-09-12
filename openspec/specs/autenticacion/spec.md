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
