## Why

El **23 % del código de producto son comentarios**: 1.051 líneas sobre 4.418, más 121 en las
pruebas y 242 en la infraestructura.

Buena parte se escribió para explicar decisiones mientras se tomaban, y hoy ese razonamiento ya
vive donde le corresponde: el README, diecisiete propuestas de OpenSpec archivadas y la bitácora de
trabajo. El código lo repite sin necesidad, y un comentario que repite lo que la línea de abajo ya
dice no es documentación: es ruido que además puede quedarse desactualizado y mentir.

Están además en español, cuando la convención del proyecto es que el código va en inglés.

## What Changes

- Se retiran los comentarios que no evitan un error.
- Los que quedan pasan a inglés.
- La convención queda escrita, para que el próximo cambio no reintroduzca lo mismo.

## Capabilities

### Modified Capabilities

- `documentacion`: describía qué tiene que explicar el proyecto sobre sí mismo hacia fuera. Se
  añade qué explica el código por dentro, y sobre todo qué no.

## Decisiones

**El criterio es que quitarlo permita equivocarse.** Un comentario se queda solo si sin él alguien
podría cometer un error que el código no puede revelar por sí mismo. Tres formas de cumplirlo:

- **Una restricción externa invisible.** Que el archivo vaya último en el formulario multiparte
  porque el almacenamiento ignora lo que venga después. Que la región sea una variable reservada
  del entorno de ejecución. Que una ventana abierta como modal viva en una capa a la que el
  `z-index` no llega.
- **Una propiedad de seguridad que parece una elección arbitraria.** Que la clave de partición se
  reconstruya desde el token y nunca desde el puntero. Que el mensaje de credenciales sea genérico
  a propósito. Que el vídeo nazca etiquetado como pendiente y no al confirmarse.
- **Un sitio donde la mejora obvia es incorrecta.** No limpiar la referencia al foco. No cachear el
  token. Usar el correo como identidad y no como alias.

Lo demás sobra: lo que repite el código, las explicaciones de diseño, y las referencias históricas
a en qué cambio se decidió algo — para eso está el historial.

**Los comentarios de las pruebas que documentan un fallo real se quedan.** Cumplen el tercer
criterio: sin ellos, una prueba parece arbitraria y alguien la borra por parecer de más. Justo la
que existe porque ese fallo ocurrió.

**Se incluye la infraestructura.** Sus comentarios son los más caros de redescubrir, y precisamente
por eso los que sobreviven son casi todos: describen trampas del proveedor que no se deducen de la
declaración.

**La convención se escribe en las reglas del proyecto.** Sin eso, el próximo cambio vuelve a
comentar en español y a explicar lo evidente, y esta limpieza se deshace sola.

## Alternativas descartadas

- **Dejarlos como están.** Defendible: explican bien las decisiones. Pero lo hacen por duplicado,
  y el sitio donde ese razonamiento sobrevive a un refactor es la propuesta archivada, no una línea
  encima de una función que mañana se mueve.
- **Solo traducirlos.** Sería el doble de trabajo para conservar el problema principal, que es el
  volumen y no el idioma.
- **Retirarlos todos.** Se perderían las trampas que cuestan horas de redescubrir, y que son
  exactamente lo que no se puede deducir leyendo el código.
- **Dejar fuera las pruebas.** Se hicieron entrar porque el mismo criterio les aplica, y porque un
  repositorio con dos reglas distintas según la carpeta invita a no seguir ninguna.

## Impact

- 83 archivos entre código de producto, pruebas, infraestructura y scripts.
- `CLAUDE.md`: una línea más en convenciones.
- **Ningún cambio de comportamiento.** Ni lógica, ni nombres, ni interfaces, ni infraestructura.
