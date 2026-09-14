## ADDED Requirements

### Requirement: La aplicación se sirve en un dominio propio

La aplicación MUST poder servirse en un subdominio del dominio de la organización, sobre HTTPS y
con un certificado emitido para ese nombre. El navegador MUST NOT advertir de ningún problema con
el certificado.

El dominio generado por la distribución MUST seguir funcionando: el nombre propio se suma como
alias, no sustituye al anterior. Así queda una dirección de reserva si la propagación del DNS
tarda.

El certificado MUST validarse por DNS y MUST NOT depender de un buzón de correo del dominio: la
validación tiene que poder comprobarse desde fuera y repetirse.

#### Scenario: Alguien abre el dominio propio

- **WHEN** se visita el subdominio
- **THEN** la aplicación carga sobre HTTPS, sin advertencias de certificado

#### Scenario: El dominio generado sigue en pie

- **WHEN** se visita la dirección original de la distribución
- **THEN** la aplicación sigue cargando

#### Scenario: Un nombre que el certificado no ampara

- **WHEN** se llega a la distribución con un nombre que no está declarado como alias
- **THEN** la petición se rechaza en lugar de servirse con un certificado que no corresponde

### Requirement: El flujo completo funciona desde el dominio propio

Cambiar el nombre por el que se llega no MUST cambiar nada del comportamiento. En particular, la
subida del vídeo va directa al almacenamiento desde el navegador, así que el almacenamiento MUST
aceptar el nuevo origen. Olvidarlo rompería solo esa operación y solo desde el dominio nuevo,
mientras el resto de la aplicación aparenta estar bien.

#### Scenario: Envío de una solicitud desde el dominio propio

- **WHEN** se registra una solicitud y se sube su vídeo desde el subdominio
- **THEN** la subida se completa igual que desde la dirección original

#### Scenario: Reproducción desde el dominio propio

- **WHEN** se reproduce el vídeo de una solicitud enviada
- **THEN** se reproduce, sin que la política de seguridad de contenido lo impida
