## MODIFIED Requirements

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
