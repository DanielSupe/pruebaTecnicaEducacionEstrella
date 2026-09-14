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

