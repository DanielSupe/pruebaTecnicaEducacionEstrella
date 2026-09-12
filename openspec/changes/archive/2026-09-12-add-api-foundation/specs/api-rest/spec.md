## Purpose

Define el contrato transversal de la API: qué garantiza al arrancar, cómo responde cuando algo
falla y cómo se comprueba que sigue viva. Son las reglas que cumplen todos los endpoints, no
las de ninguno en particular.

## ADDED Requirements

### Requirement: La configuración se valida al arrancar

La API MUST validar su configuración al iniciarse y MUST negarse a arrancar si falta una
variable requerida o si su valor no es válido. La validación MUST NOT diferirse al momento de
usar cada valor, porque eso convierte un error de despliegue en un fallo a mitad de una petición
de un usuario real.

#### Scenario: Configuración completa

- **WHEN** todas las variables requeridas están presentes y son válidas
- **THEN** la aplicación arranca

#### Scenario: Falta una variable requerida

- **WHEN** falta cualquier variable requerida
- **THEN** el proceso termina de inmediato indicando qué variable falta, y no atiende ninguna
  petición

#### Scenario: Variable presente pero con valor inválido

- **WHEN** una variable existe pero su valor no cumple el formato esperado
- **THEN** el arranque falla igual que si faltara

### Requirement: Formato único de respuesta de error

Todas las respuestas de error MUST compartir la misma forma, y esa forma MUST decidirla un único
middleware central. Ningún manejador de ruta MUST construir su propia respuesta de error.

#### Scenario: Error previsto

- **WHEN** un manejador señala un fallo previsto, como una entrada inválida o un recurso ausente
- **THEN** la respuesta lleva el código de estado que corresponde a ese fallo y el formato común,
  con un mensaje en español apto para mostrarse al usuario

#### Scenario: Ruta desconocida

- **WHEN** se solicita una ruta que no existe
- **THEN** la respuesta es 404 y usa **el mismo** formato que cualquier otro error, no el formato
  por omisión del framework

#### Scenario: Fallo en un manejador asíncrono

- **WHEN** un manejador asíncrono termina con un rechazo
- **THEN** el middleware central lo atiende igual que a un fallo síncrono, y la petición NO queda
  sin respuesta

### Requirement: Un error inesperado no revela detalles internos

Ante un fallo no previsto, la respuesta MUST NOT incluir la traza de la pila, el mensaje original
ni ningún detalle de la implementación. La respuesta MUST ser un mensaje genérico, y el detalle
MUST quedar registrado del lado del servidor para poder diagnosticarlo.

#### Scenario: Excepción no prevista

- **WHEN** un manejador falla por un motivo que la aplicación no contempla
- **THEN** el cliente recibe 500 con un mensaje genérico, sin traza ni mensaje interno

#### Scenario: Diagnóstico disponible

- **WHEN** ocurre ese mismo fallo
- **THEN** el detalle queda registrado en el servidor, de modo que el error sea diagnosticable
  aunque el cliente no lo vea

### Requirement: Comprobación de vida

La API MUST exponer un punto de comprobación que confirme que el proceso responde. Ese punto MUST
NOT consultar sus dependencias: convertir la lentitud de una dependencia en "el servicio está
caído" provoca reinicios en cascada y empeora justo la situación que pretende detectar.

#### Scenario: El proceso responde

- **WHEN** se consulta el punto de comprobación
- **THEN** responde con éxito indicando que el servicio está operativo

#### Scenario: Una dependencia está degradada

- **WHEN** una dependencia externa está lenta o no disponible
- **THEN** la comprobación de vida sigue respondiendo con éxito, porque el proceso sigue vivo

### Requirement: Cabeceras de seguridad y origen restringido

Las respuestas MUST incluir cabeceras de seguridad estándar. El acceso desde el navegador MUST
restringirse a los orígenes configurados, y esos orígenes MUST provenir de la configuración, no
de valores escritos en el código.

#### Scenario: Petición desde un origen autorizado

- **WHEN** el navegador llama a la API desde un origen presente en la configuración
- **THEN** la petición se permite

#### Scenario: Petición desde un origen no autorizado

- **WHEN** la llamada procede de un origen que no está configurado
- **THEN** el navegador no obtiene permiso para leer la respuesta
