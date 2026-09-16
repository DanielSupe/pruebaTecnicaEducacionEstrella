## ADDED Requirements

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
