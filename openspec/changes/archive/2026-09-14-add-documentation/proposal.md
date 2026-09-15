## Why

Quedan dos entregables del enunciado sin escribir, y son los dos que el evaluador lee **antes**
que el código: el README (entregable 3) y la bitácora de trabajo con IA (entregable 4).

No es trabajo de relleno. El enunciado dice, literalmente: _"Un entregable incompleto con un README
que explique con claridad qué falta y por qué es mejor recibido que uno que aparenta estar
terminado"_. Eso convierte el README en el sitio donde se sustenta lo construido y se reconoce lo
que no está, en lugar de esperar a que alguien lo descubra.

Hay además un hueco concreto. El enunciado nombra cuatro decisiones que el README **debe**
justificar: Lambda frente a contenedor, autenticación, subida de archivos y elección de base de
datos. Tres están argumentadas a lo largo de quince changes. **La primera no**: hay razonado por
qué Express corre en Lambda, pero nunca se comparó Lambda contra un contenedor.

## What Changes

- `README.md` en la raíz, con lo que pide el entregable 3.
- `AI-LOG.md` con lo que pide el entregable 4, en una o dos páginas.
- La comparación entre Lambda y contenedor, que hasta ahora no existía.

## Capabilities

### Added Capabilities

- `documentacion`: qué tiene que explicar el proyecto sobre sí mismo para poder entregarse, y con
  qué honestidad.

## Decisiones

**La bitácora se destila, no se transcribe.** Hay unas 4.200 palabras de notas tomadas al cerrar
cada change. El enunciado pide una o dos páginas y dice que interesa el criterio y no el volumen,
así que hay que recortar cuatro de cada cinco palabras. Volcar las notas sería más fácil y estaría
incumpliendo el encargo.

**La bitácora cuenta sobre todo lo que salió mal.** Lo pide el enunciado —_"dónde su propuesta no
funcionó, qué corregiste o descartaste y por qué"_— y es lo que distingue una bitácora de un
anuncio. Incluye propuestas rechazadas, premisas equivocadas que hubo que corregir, funcionalidad
que entró en contra de la recomendación, y los casos en que una comprobación parecía verificar
algo y no verificaba nada.

**Diagrama en texto, no imagen ni lenguaje de diagramas.** Se ve en el navegador, en la terminal,
en un diff y dentro de veinte años. Una imagen hay que mantenerla aparte y un diagrama renderizado
depende de que el visor sepa hacerlo.

**Las credenciales del usuario de prueba NO van en el repositorio.** El README dice que la cuenta
existe y que las credenciales viajan en el mensaje de entrega. Es más incómodo para quien evalúa,
y es la postura coherente con no versionar credenciales.

**El README de infraestructura se queda donde está.** El de la raíz enlaza a él. Duplicar acaba
con dos versiones que divergen y ninguna que sea la buena.

## Alternativas descartadas

- **Un README por aplicación en lugar de uno en la raíz.** Obligaría a leer cuatro archivos para
  entender una sola arquitectura.
- **Generar la bitácora al final a partir del historial.** Produciría un relato limpio y falso: se
  recuerdan las decisiones acertadas y se olvidan los intentos que no probaron nada. Por eso las
  notas se fueron tomando al cerrar cada change.
- **Omitir las limitaciones o suavizarlas.** Es justo lo que el enunciado dice que penaliza, y lo
  que un evaluador encuentra igualmente mirando el código.

## Impact

- `README.md` y `AI-LOG.md` nuevos, en la raíz.
- Sin cambios en código, infraestructura ni despliegue.
- Cierra los entregables 3 y 4. Quedan fuera de este change el vídeo de demostración, el acceso al
  repositorio para el evaluador y la fusión a la rama principal.
