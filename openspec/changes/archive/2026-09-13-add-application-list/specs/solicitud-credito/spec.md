## ADDED Requirements

### Requirement: Consulta de las solicitudes propias

Un solicitante autenticado MUST poder obtener las solicitudes que ha registrado. La respuesta
MUST incluir, de cada una, su estado y la fecha en que se creó, que es lo que el enunciado pide
mostrar.

Las solicitudes MUST devolverse de más reciente a más antigua: quien entra a consultar viene casi
siempre a ver la última.

#### Scenario: Solicitante con solicitudes

- **WHEN** un solicitante autenticado consulta sus solicitudes
- **THEN** las recibe ordenadas de más reciente a más antigua, con su estado y su fecha

#### Scenario: Solicitante sin solicitudes

- **WHEN** consulta alguien que no ha registrado ninguna
- **THEN** recibe una lista vacía, no un error: no tener solicitudes es un estado normal

#### Scenario: Sin autenticar

- **WHEN** la consulta llega sin credenciales válidas
- **THEN** se rechaza

### Requirement: Solo se devuelven las solicitudes propias

La consulta MUST devolver únicamente las solicitudes del solicitante autenticado. La identidad
MUST formar parte de la clave con la que se consulta, NO ser un filtro aplicado después de leer:
lo primero hace imposible devolver datos ajenos, lo segundo depende de acordarse de filtrar en
cada sitio.

#### Scenario: Dos solicitantes distintos

- **WHEN** dos solicitantes con solicitudes propias consultan cada uno las suyas
- **THEN** ninguno ve ni una sola solicitud del otro

#### Scenario: La petición intenta indicar de quién son

- **WHEN** la petición incluye un identificador de usuario
- **THEN** se ignora: la identidad sale del token verificado

### Requirement: Resultados paginados

La respuesta MUST estar acotada y MUST indicar si quedan más resultados, ofreciendo la forma de
pedirlos. El almacenamiento corta por sí solo al alcanzar un tamaño máximo, así que sin una
paginación explícita el corte ocurre igualmente pero de forma invisible y sin manera de continuar.

Un puntero de continuación MUST NOT permitir leer solicitudes de otro solicitante, aunque se
manipule: la identidad con la que se consulta se fija en el servidor, no se toma del puntero.

#### Scenario: Hay más resultados de los que caben

- **WHEN** un solicitante tiene más solicitudes de las que devuelve una página
- **THEN** recibe la primera página junto con un puntero para pedir la siguiente

#### Scenario: Se pide la página siguiente

- **WHEN** se consulta usando el puntero recibido
- **THEN** se obtienen las siguientes, **sin repetir** ninguna de la página anterior

#### Scenario: No quedan más resultados

- **WHEN** la página devuelta es la última
- **THEN** no se ofrece puntero de continuación

#### Scenario: Puntero manipulado

- **WHEN** se consulta con un puntero alterado o perteneciente a otro solicitante
- **THEN** NO se devuelven solicitudes ajenas

### Requirement: La ubicación del vídeo no se expone

La respuesta MUST NOT incluir la ruta del objeto en el almacenamiento. Es un detalle interno: el
solicitante no la necesita, y publicarla revela cómo está organizado el almacenamiento.

#### Scenario: Contenido de cada solicitud devuelta

- **WHEN** se consultan las solicitudes
- **THEN** cada una trae sus datos, su estado y sus fechas, pero no la ruta del objeto
