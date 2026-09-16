## Why

Dos ajustes sobre una aplicación ya desplegada y funcionando.

**Un fallo detectado probando:** al cerrar la ventana de subida con una transferencia en curso, el
aviso que pide confirmación aparece **por debajo** de la propia ventana. El usuario ve una ventana
que no responde y no entiende por qué.

**Un campo que pide más de lo que da:** la institución educativa es texto libre. Quien solicita
tiene que escribir el nombre completo de su universidad sin ayuda, con las faltas y variantes que
eso trae —"U. Nacional", "Universidad Nacional", "UNAL"—, y los datos quedan inconsistentes.
Existe un registro público de las instituciones de educación superior del país.

## What Changes

- Los avisos se muestran por encima de las ventanas modales, siempre.
- El campo de institución pasa a ser un selector que filtra al escribir, con los nombres reales
  del registro oficial.
- La lista se descarga con un script y se versiona; en ejecución no se consulta nada.

## Capabilities

### Modified Capabilities

- `aplicacion-web`: describía cómo se comporta la interfaz. Se añade que un aviso nunca quede tapado
  y que la institución se elija de un listado real sin dejar de admitir texto libre.

## Decisiones

**El fallo no era de `z-index`, y comprobarlo cambió la solución.** La hipótesis de partida era que
el aviso necesitaba un `z-index` mayor. Se reprodujo el caso aislado en el navegador: un elemento
con `z-index: 2147483647` —el máximo posible— **sigue quedando detrás**.

La causa real es que la ventana se abre con `showModal()`, lo que la coloca en el **top layer** del
navegador: una capa por encima de todo el documento a la que `z-index` no llega. Subir el número no
habría arreglado nada, y habría parecido un intento razonable.

La solución es renderizar el aviso **dentro** de la ventana, que es lo único que lo sitúa en esa
misma capa. Se verificó antes de escribir el código.

**El destino del aviso se resuelve solo, no se pasa por parámetro.** Si cada pantalla tuviera que
acordarse de indicar dónde renderizar, olvidarlo reproduciría este mismo fallo. El envoltorio de
ventanas emergentes averigua si hay una ventana abierta y la usa.

**La lista se hornea al construir, no se consulta en vivo.** Son 300 nombres y 13,7 KB: caben en el
paquete. Consultarla en ejecución obligaría a abrir un origen externo en la política de seguridad y
ataría el formulario a que una API del gobierno responda. Horneada, **el formulario funciona aunque
ese servicio se caiga** — que importa en un despliegue que debe seguir vivo tras la entrevista.

**La lista sugiere, no obliga.** El campo sigue admitiendo texto libre y el contrato con el
servidor no cambia. El registro solo cubre instituciones colombianas de educación superior: exigir
que el valor esté en él dejaría fuera a quien estudie en el extranjero o en una institución que el
registro no recoja.

**Los nombres se dejan en mayúsculas.** Es como figuran en el registro oficial. Pasarlos a formato
título rompería las siglas, que son muchas: SENA, CESA, CEA.

**Se deduplica.** El registro trae 361 filas y 300 nombres: la diferencia son seccionales de la
misma institución. Sin deduplicar, "UNIVERSIDAD NACIONAL DE COLOMBIA" aparecería nueve veces en el
desplegable.

## Alternativas descartadas

- **Subir el `z-index`.** Era la hipótesis inicial y se descartó porque **se midió** que no puede
  funcionar.
- **Dejar de usar `showModal()`** para que el aviso pueda taparla. Devolvería a mano la trampa de
  foco, el cierre con escape y el fondo inerte, que es justo lo que se ganó al usar el elemento
  nativo.
- **Un `<datalist>` nativo.** Resuelve el filtrado y la accesibilidad casi gratis, pero el
  desplegable lo dibuja el navegador y se ve distinto en cada uno. Se prefiere un control propio
  coherente con el resto del formulario, asumiendo que cuesta bastante más.
- **Una librería de selectores.** El sistema de diseño exige justificar cualquier librería de
  interfaz. Un control con estas necesidades cabe en un archivo.
- **Validar en el servidor contra la lista.** Obligaría a llevar los 300 nombres también al
  paquete de la API, convertiría actualizar el registro en un despliegue, y rechazaría solicitudes
  legítimas.

## Impact

- `apps/web/`: el envoltorio de ventanas emergentes, un componente nuevo y el formulario.
- `scripts/`: la descarga de la lista.
- **Sin cambios en la API, en `packages/shared` ni en la infraestructura.** La política de
  seguridad de contenido no se toca, precisamente porque la lista no se consulta en ejecución.
