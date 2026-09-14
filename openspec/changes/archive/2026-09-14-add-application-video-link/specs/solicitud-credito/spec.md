## ADDED Requirements

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
