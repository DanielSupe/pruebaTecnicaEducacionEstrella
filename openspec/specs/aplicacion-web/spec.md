# aplicacion-web Specification

## Purpose

Define lo que la aplicación web garantiza con independencia de la pantalla en la que uno esté:
que no llega a producción mal configurada, que un fallo de comunicación con la API no deja al
usuario mirando una pantalla muerta, y que funciona en el dispositivo desde el que la abran.
## Requirements
### Requirement: La configuración se valida al construir

La aplicación MUST validar su configuración durante la construcción y MUST fallar de forma
ruidosa si falta una variable requerida o su valor no es válido. En una aplicación de página
única los valores se incrustan al construir, de modo que una variable ausente NO se manifiesta al
desplegar: se manifiesta como una pantalla rota para el usuario. Por eso la construcción es el
último momento en que se puede detectar.

La dirección de la API MUST aceptar dos formas, porque las dos son legítimas: una dirección
absoluta con protocolo, que es lo que hace falta cuando la API vive en otro origen —el caso del
desarrollo local—, y una ruta relativa a la raíz, que es lo que corresponde cuando el frontend y
la API comparten origen. Cualquier otra cosa MUST rechazarse: olvidar el protocolo en una
dirección absoluta es el error de configuración más común y pasa desapercibido porque se parece a
un valor correcto, y una ruta que no parte de la raíz se resolvería contra la página actual, de
modo que funcionaría o no según desde dónde se navegara.

#### Scenario: Configuración completa

- **WHEN** todas las variables requeridas están presentes y son válidas
- **THEN** la construcción se completa

#### Scenario: Falta la dirección de la API

- **WHEN** falta la variable que indica dónde vive la API
- **THEN** la construcción falla indicando qué variable falta, en lugar de producir un artefacto
  que apunta a ninguna parte

#### Scenario: Dirección absoluta sin protocolo

- **WHEN** la dirección de la API se escribe sin `http://` ni `https://`
- **THEN** la construcción falla

#### Scenario: Dirección relativa a la raíz

- **WHEN** la dirección de la API es una ruta que empieza por barra
- **THEN** se acepta, porque el frontend y la API comparten origen

#### Scenario: Dirección relativa que no parte de la raíz

- **WHEN** la dirección de la API es una ruta que no empieza por barra
- **THEN** la construcción falla

### Requirement: Los fallos de comunicación se explican al usuario

Cuando una petición a la API falla, la interfaz MUST mostrar un mensaje comprensible en español y,
cuando la acción se pueda repetir, MUST ofrecer reintentar. NO DEBE mostrarse el error técnico
crudo, ni un código de estado a secas, ni quedarse indefinidamente en estado de carga.

#### Scenario: La API responde con un error

- **WHEN** una petición recibe una respuesta de error
- **THEN** se muestra un mensaje en español que explica qué ocurrió, sin detalles técnicos

#### Scenario: La API no responde

- **WHEN** una petición no llega a obtener respuesta, por red caída o servicio inaccesible
- **THEN** se muestra un mensaje de error con opción de reintentar, y la interfaz abandona el
  estado de carga

#### Scenario: Petición en curso

- **WHEN** una petición está en curso
- **THEN** la interfaz lo indica, de modo que el usuario no repita la acción creyendo que no pasó
  nada

### Requirement: Utilizable en móvil, tableta y escritorio

La aplicación MUST ser utilizable en anchos de pantalla desde 375 píxeles. Ninguna pantalla MUST
provocar desplazamiento horizontal del contenido.

#### Scenario: Pantalla estrecha

- **WHEN** se abre la aplicación en un ancho de 375 píxeles
- **THEN** el contenido se lee y se opera sin desplazamiento horizontal

#### Scenario: Pantalla ancha

- **WHEN** se abre en un monitor de escritorio
- **THEN** el contenido queda acotado a un ancho legible en lugar de estirarse de borde a borde

### Requirement: Identidad visual consistente

Todas las pantallas MUST compartir la misma estructura y la misma identidad visual, de modo que
la aplicación se perciba como un producto y no como un conjunto de páginas sueltas.

#### Scenario: Navegación entre pantallas

- **WHEN** el usuario pasa de una pantalla a otra
- **THEN** la estructura común permanece y solo cambia el contenido

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

