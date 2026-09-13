## ADDED Requirements

### Requirement: Registro de un solicitante

Un solicitante MUST poder crear una cuenta con correo y contraseña y quedar dentro de la
aplicación sin pasos adicionales. Si la cuenta se crea pero no se consigue iniciar la sesión, el
mensaje MUST decir precisamente eso, porque el usuario ya tiene cuenta y repetir el registro
fallaría.

#### Scenario: Registro correcto

- **WHEN** alguien se registra con un correo libre y una contraseña que cumple la política
- **THEN** queda con la sesión iniciada y en la zona privada de la aplicación

#### Scenario: El correo ya está registrado

- **WHEN** el correo pertenece a una cuenta existente
- **THEN** se explica que ya existe y se ofrece ir a iniciar sesión

#### Scenario: La contraseña no cumple la política

- **WHEN** la contraseña no alcanza lo que exige el directorio de usuarios
- **THEN** se indica qué falta **antes** de enviar nada

#### Scenario: La cuenta se crea pero la sesión no

- **WHEN** el registro tiene éxito y el inicio de sesión posterior falla
- **THEN** el mensaje aclara que la cuenta existe y que debe iniciar sesión, en lugar de sugerir
  que el registro falló

### Requirement: Inicio de sesión

Un solicitante registrado MUST poder iniciar sesión con su correo y su contraseña. Un fallo de
credenciales MUST NOT revelar si el correo existe: distinguirlo permite averiguar qué correos
están dados de alta.

#### Scenario: Credenciales correctas

- **WHEN** el correo y la contraseña son correctos
- **THEN** la sesión queda iniciada y se llega a la zona privada

#### Scenario: Credenciales incorrectas

- **WHEN** la contraseña no corresponde, o el correo no está registrado
- **THEN** se muestra el mismo mensaje en ambos casos, y el usuario puede corregir sin perder lo
  que ya había escrito

### Requirement: La sesión persiste entre visitas

La sesión MUST sobrevivir a recargar la página y a cerrar y reabrir el navegador, mientras siga
siendo válida. El requisito 3.1 del enunciado pide sesión persistente de forma explícita.

#### Scenario: Recargar la página

- **WHEN** alguien con la sesión iniciada recarga
- **THEN** sigue dentro, sin volver a introducir credenciales

#### Scenario: Volver más tarde

- **WHEN** alguien cierra el navegador y vuelve antes de que la sesión caduque
- **THEN** sigue dentro

### Requirement: Las zonas privadas exigen sesión

Las rutas privadas MUST exigir una sesión válida. Quien no la tenga MUST ser llevado a iniciar
sesión. La comprobación MUST resolverse **antes** de pintar la pantalla privada: mostrarla y
retirarla después deja ver, aunque sea un instante, algo que no debía verse.

#### Scenario: Acceso sin sesión

- **WHEN** alguien sin sesión abre una ruta privada, o la escribe directamente en la barra
- **THEN** se le lleva a iniciar sesión sin que la pantalla privada llegue a pintarse

#### Scenario: Acceso con sesión

- **WHEN** alguien con sesión válida abre una ruta privada
- **THEN** la pantalla se muestra

#### Scenario: Ya hay sesión al abrir el acceso

- **WHEN** alguien con sesión iniciada abre la pantalla de inicio de sesión o la de registro
- **THEN** se le lleva a la zona privada, en lugar de ofrecerle entrar de nuevo

### Requirement: Cada petición a la API viaja identificada

Toda petición a la API desde una zona privada MUST adjuntar el token de acceso vigente. El token
MUST obtenerse en el momento de la petición, NO de una copia guardada: es la librería de
autenticación quien decide cuándo renovarlo, y una copia propia acaba enviando tokens caducados.

#### Scenario: Petición con sesión iniciada

- **WHEN** la aplicación llama a la API con la sesión iniciada
- **THEN** la petición lleva el token de acceso vigente

#### Scenario: El token estaba a punto de caducar

- **WHEN** el token vigente está próximo a caducar y la sesión sigue siendo renovable
- **THEN** la petición viaja con un token renovado, sin que el usuario note nada

### Requirement: Cierre de sesión

Un solicitante MUST poder cerrar sesión desde cualquier pantalla privada, y MUST confirmarlo
antes: es una acción con consecuencia que conviene no disparar por un clic accidental. Tras
cerrarla, los datos de la sesión anterior MUST NOT seguir accesibles.

#### Scenario: Cerrar sesión

- **WHEN** el solicitante cierra sesión y lo confirma
- **THEN** la sesión termina y se le lleva a la pantalla de acceso

#### Scenario: Cancelar el cierre

- **WHEN** el solicitante cancela la confirmación
- **THEN** la sesión continúa y no se pierde nada

#### Scenario: Volver atrás tras cerrar sesión

- **WHEN** tras cerrar sesión se intenta volver a una pantalla privada
- **THEN** se exige iniciar sesión de nuevo

### Requirement: Sesión caducada durante el uso

Si la API rechaza una petición por credenciales no válidas, la aplicación MUST avisar de que la
sesión caducó y llevar a iniciar sesión. MUST NOT dejarse al usuario ante una pantalla que ya no
va a funcionar, ni redirigir en silencio sin explicar por qué.

#### Scenario: La API rechaza la sesión

- **WHEN** una petición recibe una respuesta de credenciales no válidas
- **THEN** se avisa de que la sesión caducó y se lleva a iniciar sesión

#### Scenario: Sin bucles de redirección

- **WHEN** el rechazo ocurre estando ya en una pantalla pública
- **THEN** no se produce ninguna redirección adicional
