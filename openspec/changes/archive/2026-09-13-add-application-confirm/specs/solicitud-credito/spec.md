## ADDED Requirements

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
