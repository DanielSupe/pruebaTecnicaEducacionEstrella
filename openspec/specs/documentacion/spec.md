# documentacion Specification

## Purpose
TBD - created by archiving change add-documentation. Update Purpose after archive.
## Requirements
### Requirement: El proyecto explica cómo levantarlo

El repositorio MUST incluir instrucciones para ejecutar el proyecto en local. Las instrucciones
MUST poder seguirse desde cero, sin depender de nada que solo exista en la máquina de quien las
escribió.

MUST indicarse qué variables de entorno hacen falta y de dónde salen. MUST NOT incluirse ningún
valor real de configuración ni ninguna credencial.

#### Scenario: Alguien clona el repositorio y sigue las instrucciones

- **WHEN** se siguen los pasos en un entorno limpio
- **THEN** la aplicación arranca, sin pasos que no estén escritos

#### Scenario: Falta configuración

- **WHEN** se intenta arrancar sin haber configurado las variables
- **THEN** el fallo indica qué falta, y el documento explica de dónde sale

### Requirement: La arquitectura desplegada está descrita

El repositorio MUST describir la arquitectura que corre en la nube: qué piezas hay y cómo se
hablan entre ellas. MUST poder seguirse el recorrido completo de una solicitud, incluido el camino
del vídeo, que no pasa por la API.

La descripción MUST ser legible sin herramientas: leerla no MUST depender de que un visor sepa
representar un formato concreto.

#### Scenario: Alguien quiere entender el sistema sin leer el código

- **WHEN** lee la descripción de la arquitectura
- **THEN** puede decir qué componentes hay y por dónde viaja el vídeo

### Requirement: Las decisiones técnicas están sustentadas

El repositorio MUST justificar las decisiones técnicas, y MUST cubrir de forma explícita las
cuatro que el enunciado nombra: el modelo de ejecución del backend frente a un contenedor, la
estrategia de autenticación, la estrategia de subida de archivos y la elección de base de datos.

Cada decisión MUST decir qué se sacrifica al tomarla. Una decisión presentada solo con ventajas no
está sustentada: está anunciada.

#### Scenario: Se revisa una decisión

- **WHEN** se lee cualquiera de las decisiones documentadas
- **THEN** se encuentra la alternativa considerada y qué se pierde con la elegida

### Requirement: Las limitaciones se declaran

El repositorio MUST enumerar lo que no está resuelto y por qué, y MUST decir qué se haría distinto
con más tiempo. MUST NOT omitirse una limitación conocida por resultar incómoda: aparecerá igual
al revisar el código, y entonces parecerá un descuido en lugar de una decisión.

#### Scenario: Una carencia conocida del sistema

- **WHEN** existe una comprobación que no se hace o un riesgo asumido
- **THEN** figura escrito, con el motivo por el que se asumió

### Requirement: La bitácora de trabajo con IA describe el criterio

El repositorio MUST incluir una bitácora de cómo se usó la asistencia de IA. MUST ocupar una o dos
páginas: el encargo pide criterio y no volumen, así que la extensión forma parte del requisito.

MUST recoger qué se pidió, dónde la propuesta de la herramienta no funcionó, y qué se corrigió o
descartó y por qué. Una bitácora que solo cuente aciertos no cumple lo que se pide.

#### Scenario: Una propuesta de la herramienta que se rechazó

- **WHEN** se lee la bitácora
- **THEN** aparecen casos concretos de propuestas descartadas, con el motivo

#### Scenario: Extensión

- **WHEN** se mide el documento
- **THEN** cabe en dos páginas

### Requirement: Ninguna credencial se versiona

Las credenciales del usuario de prueba MUST NOT escribirse en el repositorio. El documento MUST
indicar que la cuenta existe y por qué vía se entregan sus credenciales.

#### Scenario: Se busca una credencial en el repositorio

- **WHEN** se revisa el contenido versionado
- **THEN** no aparece ninguna contraseña, clave ni valor de configuración real

### Requirement: El código comenta lo que no se puede deducir de él

Un comentario en el código MUST justificar su existencia: se queda **solo si quitarlo permitiera
que alguien cometa un error que el código no revela por sí mismo**.

Eso ocurre en tres casos, y MUST conservarse un comentario que describa cualquiera de ellos:

- **Una restricción externa invisible desde el código**, impuesta por un servicio o por el
  navegador.
- **Una propiedad de seguridad que parece una elección arbitraria** y que alguien podría deshacer
  creyendo que simplifica.
- **Un lugar donde la mejora evidente es incorrecta**, y por qué.

MUST NOT conservarse un comentario que repita lo que la línea siguiente ya dice, que explique una
decisión de diseño que no encierra ninguna trampa, o que refiera en qué momento del historial se
decidió algo. Lo primero envejece y acaba mintiendo; lo demás vive en las propuestas archivadas y
en el historial, que es donde sobrevive a que el código se mueva.

Los comentarios MUST estar en inglés, como el resto del código. Los textos que ve el usuario y los
mensajes de validación MUST seguir en español.

#### Scenario: Un comentario repite el código

- **WHEN** un comentario dice lo mismo que la línea que le sigue
- **THEN** no está presente

#### Scenario: Una restricción que el código no revela

- **WHEN** el código depende de algo que un servicio externo exige y que no se deduce leyéndolo
- **THEN** hay un comentario que lo explica

#### Scenario: Una prueba que existe por un fallo concreto

- **WHEN** una prueba protege contra un fallo que llegó a ocurrir
- **THEN** consta cuál era, para que no se borre por parecer de más

#### Scenario: Idioma

- **WHEN** se lee cualquier comentario del código
- **THEN** está en inglés, y los textos dirigidos al usuario siguen en español

