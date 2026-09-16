## ADDED Requirements

### Requirement: La API se organiza en capas separadas

Cada funcionalidad de la API MUST repartirse en archivos por capa, y cada archivo MUST tener una
sola responsabilidad:

- **Rutas**: qué camino corresponde a qué manejador. MUST poder leerse como una tabla: qué
  endpoints existen y qué middleware los protege, sin lógica de ninguna clase.
- **Controlador**: lo que es propio de HTTP. Leer la petición, validar la entrada, elegir el
  código de estado y dar forma a la respuesta. MUST NOT contener reglas de negocio.
- **Servicio**: las reglas de negocio y la orquestación. MUST NOT leer la petición ni escribir la
  respuesta: recibe datos ya validados y devuelve datos.
- **Repositorio**: el acceso a los almacenes. MUST NOT contener reglas de negocio.

Una capa MUST NOT saltarse a la siguiente: el controlador no habla con el repositorio.

La misma estructura MUST aplicarse a toda la API, incluidas las rutas que no tienen lógica ni
datos. Dos convenciones conviviendo en el mismo backend son peores que cualquiera de las dos.

#### Scenario: Se busca qué endpoints expone la API

- **WHEN** se abre el archivo de rutas de una funcionalidad
- **THEN** se ven todos sus endpoints y qué los protege, sin leer su implementación

#### Scenario: Una regla de negocio

- **WHEN** existe una regla sobre cuándo una operación es posible
- **THEN** vive en el servicio, no en el controlador

#### Scenario: El servicio se usa sin una petición HTTP

- **WHEN** se invoca una operación del servicio
- **THEN** no necesita objetos de petición ni de respuesta para funcionar

### Requirement: Los errores asíncronos no se envuelven a mano

Un manejador asíncrono MUST NOT rodearse de un envoltorio que capture su rechazo y lo reenvíe. El
marco de trabajo ya lo propaga al middleware central, y ese envoltorio es ceremonia que además
esconde la lógica.

#### Scenario: Un manejador asíncrono falla

- **WHEN** una operación lanza dentro de un manejador asíncrono
- **THEN** la respuesta la construye el middleware central de errores, con su formato habitual
