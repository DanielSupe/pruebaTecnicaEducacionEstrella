## Why

La aplicación está completa y no es alcanzable por nadie. La API corre con `tsx` en un portátil y
el frontend con el servidor de desarrollo de Vite. El entregable 2 del enunciado pide una **URL
del frontend desplegada y funcionando**, con un usuario de prueba, mantenida hasta 48 horas
después de la entrevista.

Y hay una deuda que vence aquí. Desde el primer día se justifica que los tokens vivan en
`localStorage` —es lo que implica una sesión persistente en un SPA sin backend de sesión— diciendo
que lo mitiga una CSP estricta. Esa CSP no existe todavía: se sirve desde CloudFront, y CloudFront
no existía. Hasta este change, la mitigación era una promesa.

## What Changes

- La API se empaqueta en un archivo y corre en Lambda, tras una API HTTP de API Gateway.
- El SPA se publica en un bucket privado servido por CloudFront con acceso de origen restringido.
- **Una sola distribución sirve ambos**: el SPA por defecto y la API bajo `/api/*`.
- Cabeceras de seguridad en las respuestas, con la CSP a la cabeza.
- Recargar en cualquier ruta del cliente devuelve la aplicación, no un 404.
- La dirección de la API pasa a ser una ruta relativa, así que el frontend deja de necesitar el
  dominio para construirse.
- El bucket de vídeos declara si puede destruirse con contenido, por variable.
- Un script publica el frontend: construir, sincronizar e invalidar.

## Capabilities

### Modified Capabilities

- `infraestructura-base`: describía los recursos que sostienen la aplicación. Se añade lo que la
  sirve y lo que la protege en el borde.
- `aplicacion-web`: la configuración se validaba al construir exigiendo una URL absoluta. Con un
  único origen, la dirección de la API es una ruta relativa.

## Decisiones

**Un solo origen público, con la API bajo `/api/*` de la misma distribución.** El navegador habla
siempre con CloudFront, así que entre él y la API no hay CORS que configurar ni que equivocar. No
elimina el CORS del sistema: el bucket de vídeos lo sigue necesitando para la subida firmada, y
Amplify llama a Cognito directamente desde el navegador. Lo que elimina es el CORS de nuestra
propia API, que es el que estaría en nuestras manos romper.

**El comportamiento de `/api/*` no cachea y reenvía todo menos el `Host`.** Las dos cosas son
obligatorias y por motivos distintos. Cachear respuestas de una API autenticada serviría la
solicitud de una persona a otra. Y el `Host` debe excluirse porque API Gateway responde 403 si
recibe uno que no es el suyo: la política reenvía el resto, incluida la cabecera de autorización,
sin la que no funcionaría nada.

**Etapa `$default` en API Gateway.** Sin prefijo de etapa en la ruta, `/api/v1/health` llega tal
cual a Express. La alternativa obliga a reescribir rutas en el borde, que es una capa de
traducción que solo existe para deshacer un prefijo que no hacía falta.

**Las claves de verificación se descargan fuera del manejador.** El arranque local las obtiene
antes de escuchar. En Lambda eso tiene que ocurrir en el ámbito del módulo, para que se pague una
vez por contenedor y no una vez por petición.

**La dirección de la API pasa a ser relativa.** Con un solo origen, `/api/v1` basta. Además
rompe un círculo: el dominio se conoce al aplicar la infraestructura, pero el frontend hay que
construirlo antes de subirlo. Una ruta relativa no depende del dominio.

**La concurrencia reservada acota el gasto.** Es el tope de coste y de radio de impacto de una
función a la que cualquiera puede llamar.

**`force_destroy` por variable, con omisión `false`.** El valor correcto en cualquier entorno real
es `false`; este entorno, que es desechable, opta por salirse en su archivo de variables. El
código enseña el criterio sano y el entorno asume su excepción.

## Alternativas descartadas

- **Dos dominios públicos, con CORS entre navegador y API.** Es lo convencional y queda como plan
  de repliegue si el comportamiento `/api/*` se complica. Se descarta de partida porque añade una
  configuración que podemos equivocar, y porque obliga a nombrar el dominio de la API en la CSP.
- **URL de función de Lambda en lugar de API Gateway.** Ahorra un componente, pero deja la
  limitación de peticiones sin sitio natural donde vivir.
- **Subir el frontend desde Terraform, archivo a archivo.** Terraform no es una herramienta de
  publicación de artefactos: cada cambio del paquete generaría diferencias en el plan.
- **Dominio propio con certificado.** Nadie lo pide y añade validación de DNS al camino crítico
  del último día. El dominio por omisión de la distribución sirve.
- **Cerrar el acceso directo a la API.** Se podría restringir a que solo CloudFront la invoque.
  No se hace en esta prueba: la API exige token de Cognito en todo salvo la comprobación de vida,
  así que el acceso directo no concede nada. **Se documenta como limitación conocida**, que es
  distinto de no haberlo visto.

## Riesgos

- **La CSP puede romper la aplicación de formas silenciosas.** Por eso se verifica con la consola
  del navegador delante y no se da por buena porque la página cargue.
- **El host del almacenamiento en la CSP hay que confirmarlo.** El firmador puede emitir dos
  formas de dirección y la CSP distingue entre ellas.
- **Es el change con más superficie nueva.** Si el comportamiento `/api/*` se atasca, se pasa al
  plan de repliegue en lugar de insistir.

## Impact

- `infra/`: API Gateway, Lambda de la API, bucket del SPA, CloudFront con sus dos orígenes, la
  política de cabeceras y la variable de destrucción.
- `apps/api/`: el adaptador de Lambda y el empaquetado.
- `apps/web/`: la configuración acepta una dirección relativa.
- `scripts/`: la publicación del frontend.
- Cierra el entregable 2 del enunciado y la mitigación pendiente de los tokens en `localStorage`.
