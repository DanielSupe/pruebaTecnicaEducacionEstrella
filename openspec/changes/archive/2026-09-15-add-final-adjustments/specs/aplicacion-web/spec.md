## ADDED Requirements

### Requirement: Un aviso nunca queda tapado por la ventana que lo pidió

Cuando un aviso se lanza desde dentro de una ventana modal, MUST mostrarse por encima de ella. Una
ventana que pide confirmación y no se ve deja la aplicación aparentemente bloqueada: el usuario ve
un fondo que no responde y no sabe qué se le está preguntando.

El destino del aviso MUST resolverse solo. Las pantallas MUST NOT tener que indicar dónde
renderizarlo: olvidarlo reproduce este mismo fallo, y es un olvido que no da ningún síntoma hasta
que alguien abre esa ventana concreta.

#### Scenario: Confirmación pedida desde dentro de una ventana modal

- **WHEN** se intenta cerrar una ventana modal con una operación en curso
- **THEN** la confirmación se ve por encima de esa ventana y se puede responder

#### Scenario: Aviso pedido desde una pantalla normal

- **WHEN** se lanza un aviso sin ninguna ventana modal abierta
- **THEN** se muestra con normalidad, como antes

### Requirement: La institución se elige de un listado real

El campo de institución educativa MUST ofrecer los nombres del registro público de instituciones de
educación superior, y MUST filtrarlos conforme se escribe.

El listado MUST estar deduplicado: el registro incluye una fila por sede, y un mismo nombre
repetido nueve veces en un desplegable no ayuda a elegir.

El filtrado MUST ignorar mayúsculas y tildes. Quien escribe "antioquia" busca "ANTIOQUIA", y quien
escribe "aeronautica" busca "AERONÁUTICOS": exigir la tilde exacta convierte la ayuda en un
obstáculo.

#### Scenario: Se escribe parte de un nombre

- **WHEN** el solicitante escribe parte del nombre de su institución
- **THEN** se le ofrecen las que coinciden, cada una una sola vez

#### Scenario: Se escribe sin tildes y en minúscula

- **WHEN** el texto escrito no coincide en mayúsculas ni en tildes con el nombre registrado
- **THEN** la institución aparece igualmente entre las opciones

#### Scenario: Ninguna institución coincide

- **WHEN** lo escrito no corresponde a ninguna del listado
- **THEN** se indica que no hay coincidencias, en lugar de ofrecer el listado entero

### Requirement: El listado sugiere, no obliga

El campo MUST seguir admitiendo un nombre que no esté en el listado. El registro solo cubre
instituciones colombianas de educación superior: exigir que el valor figure en él impediría
solicitar a quien estudie en el extranjero o en una institución que el registro no recoja.

Las reglas de validación del campo MUST NOT cambiar, ni en el navegador ni en el servidor.

#### Scenario: Institución que no está en el listado

- **WHEN** el solicitante escribe un nombre que no figura y envía el formulario
- **THEN** la solicitud se acepta igual que cualquier otra

### Requirement: El listado no depende de un servicio externo en ejecución

Los nombres MUST viajar en la propia aplicación. Al usar el campo MUST NOT hacerse ninguna petición
a un servicio de terceros.

Así el formulario sigue funcionando aunque el origen de los datos no responda, y la política de
seguridad de contenido no tiene que autorizar ningún origen más.

Actualizar el listado MUST ser una acción explícita y su resultado MUST quedar versionado, para que
lo que se despliega sea siempre lo que alguien revisó.

#### Scenario: El servicio de datos abiertos no responde

- **WHEN** el origen de los datos está caído
- **THEN** el campo sigue ofreciendo el listado con normalidad

### Requirement: El selector se maneja con teclado

El selector MUST poder usarse sin ratón: recorrer las opciones, elegir una, y cerrar sin elegir
conservando lo escrito. MUST anunciar cuántas opciones hay a quien no las ve, y al cerrarse MUST
devolver el foco al campo.

#### Scenario: Recorrido y elección con teclado

- **WHEN** se recorren las opciones con el teclado y se confirma una
- **THEN** el campo toma ese valor y la lista se cierra

#### Scenario: Cerrar sin elegir

- **WHEN** se cierra la lista sin confirmar ninguna opción
- **THEN** se conserva lo que el solicitante había escrito
