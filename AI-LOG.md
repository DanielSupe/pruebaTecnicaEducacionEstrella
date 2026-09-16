# Bitácora de trabajo con IA

Usé Claude Code durante todo el proyecto. Lo que más determinó el resultado no fue qué le pedí,
sino **el modelo de trabajo que le impuse antes de empezar**.

## Escribir primero, programar después

Usé [OpenSpec](openspec/) para que **ninguna funcionalidad empezara por el código**. Cada una nace
como un _change_ con tres artefactos escritos antes de tocar nada:

- `proposal.md` — por qué se hace y **qué alternativas se descartan**.
- `specs/` — los requisitos en forma verificable, con escenarios.
- `tasks.md` — el desglose, que luego sirve de lista de verificación.

Al terminar, el change se archiva y sus requisitos se integran en la especificación viva del
proyecto. El resultado son **20 changes, 6 capacidades, 85 requisitos y 194 escenarios**, y un
historial donde cada commit apunta al change que lo justifica.

Encima de eso, tres paradas con confirmación explícita: **plan → artefactos → implementación**. La
segunda existe porque **escribir la especificación es donde aparecen los huecos del plan**:
redactando la del listado salieron dos requisitos que el plan no contemplaba —cerrar la ventana con
una subida en curso, y no reutilizar el enlace temporal del video—, y ninguno se me habría ocurrido
mirando código.

El efecto secundario más útil es que **obliga a escribir lo descartado**. Una decisión razonada
cuando se toma se sostiene sola; reconstruida semanas después es una racionalización.

## Las reglas: `CLAUDE.md` y skills

Antes del primer change escribí un `CLAUDE.md` con el rol, las convenciones y las reglas duras
—nada hardcodeado, validar en los dos lados, ningún secreto en el repositorio—. Después lo completé
con _skills_, instrucciones que se cargan solas cuando la tarea las toca:

**`git-workflow`.** Un change igual a un commit, formato del mensaje, ramas, y un escáner que
bloquea el commit si detecta `.env`, claves o credenciales en el área de preparación. Se ejecutó
antes de cada commit, sin excepción.

**`web-design-system`.** Esta se la pedí a él: en lugar de improvisar estilos pantalla a pantalla,
que escribiera primero el sistema. **Partiendo del logo** derivó la paleta, la tipografía y el
espaciado, de modo que la interfaz sigue los estilos de la marca y no una elección estética
cualquiera.

Fijar esas reglas una vez acabó frenándole a él mismo: al construir pantallas nuevas, la skill le
recordaba restricciones que él mismo había establecido y habría vuelto a decidir de cero.

## Dónde su propuesta no funcionó

**Verificaciones que no verificaban nada.** El patrón que más veces tuve que cortar, y el más
peligroso: produce informes en verde.

- Para probar que una subida se puede cancelar a mitad, propuso cancelarla y comprobar que la
  ventana se cerraba. Lo hizo tres veces y las tres **la subida ganó la carrera**: acababa enviada,
  o sea completada en vez de abortada. Solo quedó demostrado con un video de 134 MB, cancelando al
  1 % y comprobando que la solicitud seguía pendiente y **que no quedó ningún objeto en S3**.
- Afirmó que la construcción del frontend falla si falta una variable. Devolvía código 0: había un
  `.env` local que el constructor leía. La garantía era cierta; la prueba estaba mal.
- Midió un contraste y dio 1,62:1, que habría sido un problema grave de accesibilidad. La medición
  leía valores `oklch` como si fueran canales RGB.

Le exigí que cada grupo de pruebas se validara **mutando el comportamiento que debía proteger** y
comprobando que alguna se rompía. Varias veces no se rompió ninguna.

**Premisas equivocadas presentadas con seguridad.** Al proponer servir frontend y API bajo un único
origen afirmó que eso eliminaba el CORS y permitía una política de seguridad mínima. Las dos eran
falsas: el bucket de videos sigue necesitando CORS para la subida directa, y la librería de
autenticación llama a Cognito **desde el navegador**, que es otro origen. Corregirlo cambió la
política entera.

**Una organización que se degradó sin avisar.** Escribió los **controladores en línea**, dentro de
cada ruta, y **no separó los servicios**: un mismo manejador leía el token, validaba, decidía y
hablaba con DynamoDB y S3. Nunca lo propuso como decisión: fue ocurriendo change a change, y cada
paso suelto parecía razonable. Lo note ya avanzado en algunos changes.


## Lo que descarté

- **Una librería de formularios** para la pantalla de solicitud: las de acceso ya usaban un hook
  propio, y dos formas de hacer formularios conviviendo es incoherencia.
- **Declarar el tamaño del video desde el cliente.** Un número que envía el navegador no demuestra
  nada; el límite real lo impone la política firmada.
- **Su recomendación sobre los errores de credenciales**, que los prefería bajo el campo. Elegí
  ventana emergente y lo implementó dejando constancia de que iba contra su criterio: le pedí que
  sustentara, no que obedeciera.

## Qué aprendí sobre dirigirlo

Lo que mejor funcionó fue **pedir la garantía, no el comando en verde**. "Comprueba que el bucket
es privado" produce una afirmación; "léelo sin firma y enséñame el código de respuesta" produce una
prueba. Igual con la política de seguridad: una consola limpia se vería igual si no se estuviera
aplicando, así que hubo que inyectar script y ver que lo bloqueaba.

Y conviene desconfiar de su instrumental antes que de la realidad: dos veces un número alarmante
—el contraste, y un registro DNS que "no existía"— venía de una medición mal hecha.
