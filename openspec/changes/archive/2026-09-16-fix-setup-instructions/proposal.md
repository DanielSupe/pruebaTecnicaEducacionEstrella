## Why

Las instrucciones de arranque contemplan dos casos —tener la infraestructura o crearla— y **omiten
el más corto**: ejecutar solo el frontend contra la API ya desplegada. Ese camino no necesita
Terraform, ni levantar la API, ni credenciales de AWS, y basta para recorrer el flujo completo
incluida la subida del vídeo.

Es además el caso de quien recibe el proyecto: la infraestructura ya está corriendo.

Hay dos problemas más pequeños. Las instrucciones dicen que hacen falta credenciales de AWS pero
no dónde se ponen, lo cual es correcto y poco accionable. Y el párrafo de entrada advierte de que
"se requiere infraestructura AWS", que leído en frío parece anunciar un despliegue por delante
cuando no hay nada que montar.

## What Changes

- Se añade el camino más corto, y va primero.
- Se dice que las credenciales pueden ir en el propio archivo de entorno.
- El aviso de entrada separa dos cosas distintas: que no hay emulación local, y que aun así no hay
  nada que desplegar para verlo funcionar.

## Capabilities

### Modified Capabilities

- `documentacion`: las instrucciones de arranque tienen que servir a quien recibe el proyecto, no
  solo a quien lo construyó.

## Decisiones

**Los caminos van ordenados por esfuerzo, de menos a más.** Quien abre el documento encuentra en
las primeras líneas cómo tener la aplicación corriendo, y solo sigue bajando si quiere depurar el
backend o levantar su propia infraestructura.

**Los identificadores concretos no se escriben en el documento.** Se dice de dónde salen. Este
repositorio lo puede desplegar cualquiera, y fijar aquí los de un despliegue concreto dejaría las
instrucciones equivocadas para todos los demás. Además es la misma regla que gobierna el código.

**Se menciona que las credenciales caben en el archivo de entorno, sin extenderse.** Es el dato que
falta para poder actuar; el resto de formas de configurarlas son cosa de quien las tenga.

## Alternativas descartadas

- **Dejarlo como está.** El camino corto existe y funciona; omitirlo hace que quien reciba el
  proyecto haga trabajo que no necesita, o que se quede sin verlo funcionar.
- **Escribir los identificadores del despliegue actual.** Serviría a una persona y dejaría el
  documento mintiendo a cualquier otra que clone el repositorio.

## Impact

- `README.md`: la sección de arranque.
- **Ningún cambio de código, de infraestructura ni de comportamiento.**
