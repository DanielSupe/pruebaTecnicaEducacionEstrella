## Why

La API tiene hoy dos capas donde deberían verse cuatro. Las rutas y los controladores viven
fusionados en un mismo archivo —el controlador es la función anónima que se le pasa a cada ruta— y
**no existe capa de servicio**: las reglas de negocio están dentro de los manejadores.

Se nota en un sitio concreto. El aviso de subida completada orquesta cinco pasos en un orden que
importa —buscar, comprobar el estado, verificar el objeto, reetiquetar y actualizar—, y ese
razonamiento vive en un manejador HTTP. Si el mismo flujo tuviera que dispararse desde otro sitio,
habría que duplicarlo.

Y para saber qué endpoints expone la API hay que leer doscientas líneas en lugar de una tabla.

## What Changes

- Cuatro capas en archivos separados: rutas, controlador, servicio y repositorio.
- Se aplica a **todo el backend**, también a las rutas de vida y de identidad.
- Desaparece el envoltorio manual de errores asíncronos de cada manejador.
- El README describe la estructura nueva.

## Capabilities

### Modified Capabilities

- `api-rest`: describía el comportamiento de la API. Se añade cómo está organizada por dentro y
  qué puede saber cada capa.

## Decisiones

**El envoltorio de errores asíncronos se retira.** Cada manejador está hoy envuelto en un
`void (async () => { try … catch { next(error) } })()`. Es innecesario: Express 5 propaga solo el
rechazo de un manejador asíncrono, y hay una prueba que lo demuestra. Eran cuatro líneas de
ceremonia por endpoint que además escondían la lógica.

**El servicio sigue lanzando los errores actuales.** Un servicio en su forma pura no sabría de
HTTP y lanzaría errores de dominio que el controlador traduciría. Se decide no hacerlo: añadiría
un archivo de errores y una tabla de traducción por endpoint, y la separación que se busca aquí es
estructural. Queda anotado que ese es el siguiente paso si el servicio llegara a usarse desde algo
que no sea una petición HTTP.

**Las rutas de vida y de identidad también se separan**, aunque no tengan lógica ni datos. Quien
abra cualquier carpeta encuentra la misma estructura. El precio es media docena de archivos con
tres líneas, y se acepta a cambio de que no haya dos convenciones conviviendo.

**Ninguna de las dos no cambia de comportamiento.** No se toca un endpoint, ni un código de
estado, ni un mensaje. Es reorganización.

## Alternativas descartadas

- **Dejarlo en dos capas.** Era mi recomendación por tamaño: con cinco endpoints, un servicio que
  reenvía es ceremonia, y la testabilidad ya la daba la inyección de dependencias. Se descarta
  porque la organización en cuatro capas es un requisito del proyecto, no una preferencia.
- **Separar solo `applications`** y dejar las otras dos rutas como están. Dejaría dos convenciones
  en el mismo backend, que es peor que cualquiera de las dos por separado.
- **Errores de dominio traducidos en el controlador.** Es la separación de verdad y queda anotado
  como trabajo futuro; hoy duplicaría el alcance del cambio sin que nadie consuma el servicio
  fuera de HTTP.

## Riesgos

- **Es el archivo con más pruebas del proyecto.** Cuarenta y siete de ruta dependen de él, y son
  la red que demuestra que la reorganización no cambió nada: sus **afirmaciones no deben tocarse**,
  solo la línea que monta las dependencias.
- **Mover código es donde se pierde una línea sin que nadie lo note.** Por eso la verificación no
  es leer el diff.

## Impact

- `apps/api/src/`: la estructura de carpetas y archivos.
- `README.md`: la sección de estructura.
- **Sin cambios en el frontend, en la infraestructura ni en el comportamiento de la API.**
