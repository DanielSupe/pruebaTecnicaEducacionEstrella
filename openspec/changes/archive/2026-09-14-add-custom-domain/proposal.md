## Why

La aplicación se sirve desde un nombre generado: `d2cuc8ew1n7iu6.cloudfront.net`. Funciona, y el
enunciado no pide más que una URL desplegada y funcionando.

**Esto lo pide el propietario del proyecto, no lo exige el enunciado.** Queda escrito porque el
proposal es donde se sustentan las decisiones: un dominio propio no suma puntos en la rúbrica. Lo
que sí hace es que el entregable se lea como un producto y no como una demo, y el coste es cero.

## What Changes

- Certificado público para un subdominio del dominio del propietario.
- Ese subdominio se declara como alias de la distribución que ya existe.
- El almacenamiento de vídeos acepta subidas desde el nuevo origen.
- El dominio generado por la distribución **sigue funcionando**: el alias se suma, no sustituye.

## Capabilities

### Modified Capabilities

- `infraestructura-base`: la aplicación era alcanzable en una dirección generada. Se añade que
  pueda serlo además en una dirección propia, servida con su propio certificado.

## Decisiones

**El certificado va en `us-east-1`, y no es una elección.** CloudFront solo acepta certificados de
esa región, viva donde viva el resto. Aquí coincide con la región del proyecto, así que no hace
falta declarar un segundo proveedor apuntando a otra región — que es la complicación habitual de
este paso.

**Validación por DNS y no por correo.** La validación por correo depende de que exista y se lea un
buzón en el dominio, y no deja rastro en el código. Un registro DNS es reproducible y se puede
comprobar desde fuera.

**El DNS se queda en el registrador.** Traerlo a Route 53 permitiría que Terraform creara los
registros solo, sin ningún paso manual. Cuesta 0,50 $ al mes por zona alojada, que no entra en la
capa gratuita, y el enunciado pide no incurrir en costes. Se acepta el paso manual y **se
documenta**, que es distinto de que aparezca por sorpresa.

**Un subdominio, no el dominio raíz.** En el vértice de un dominio no puede haber un `CNAME`: lo
prohíbe la especificación del DNS, porque ahí conviven los registros de autoridad. Hace falta un
registro ALIAS, que es una extensión propietaria que Route 53 tiene y la mayoría de registradores
no. Un subdominio es un `CNAME` corriente y funciona en cualquier proveedor.

**El dominio generado sigue sirviendo.** Un alias se suma a la distribución; no la renombra. Eso
deja una dirección de reserva si el DNS tarda en propagarse el día de la entrega.

## Alternativas descartadas

- **Trasladar el DNS a Route 53.** Automatizaría el proceso entero, al precio de una zona alojada
  al mes y de cambiar los servidores de nombres del dominio, que afecta a todo lo que ese dominio
  sirva ya.
- **Dominio raíz, o raíz más `www` con redirección.** Es lo habitual en un producto real. Aquí
  añade una redirección que mantener a cambio de nada, en una demo con fecha de caducidad.
- **Usar la API del registrador desde Terraform.** Obligaría a guardar una credencial más y a
  autorizar una dirección IP fija. Para dos registros, el paso manual sale más barato en todos los
  sentidos.
- **Renunciar al dominio.** Era lo planificado y sigue siendo defendible. Se hace porque el coste
  real resultó ser dos registros DNS.

## Riesgos

- **Si el dominio no usa los servidores de nombres del registrador, la validación nunca llega.**
  Los registros se añadirían en un panel que nadie consulta. Se comprueba antes de empezar.
- **El orden importa.** Apuntar el subdominio a la distribución antes de que ésta lo reconozca
  como alias produce un error de CloudFront que parece una avería y es solo una secuencia mal
  hecha.
- **Olvidar el origen nuevo en el almacenamiento** rompería la subida del vídeo únicamente desde
  el dominio nuevo: el resto de la aplicación parecería correcta.

## Impact

- `infra/`: el certificado, su validación, el alias en la distribución y el origen añadido al
  almacenamiento.
- Sin cambios en `apps/`: la dirección de la API es relativa desde el change anterior, así que el
  frontend no sabe ni necesita saber en qué dominio se sirve. Esa decisión se paga aquí.
- La política de seguridad de contenido **no cambia**: el origen propio sigue siendo el propio, y
  el directorio de usuarios y el almacenamiento son los mismos.
