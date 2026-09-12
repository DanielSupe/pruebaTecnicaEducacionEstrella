## Decisiones y trade-offs

### Estado de Terraform en local

El estado vive en `infra/terraform.tfstate`, ignorado por git.

**A favor**: cero bootstrap. Un estado remoto en S3 exige crear antes el bucket que lo aloja,
fuera de este mismo Terraform, y eso añade una ceremonia manual al change más largo del
roadmap.

**En contra**: el estado existe en una sola máquina. Si se pierde, Terraform deja de conocer
los recursos y hay que borrarlos a mano desde la consola. No hay bloqueo, aunque con un solo
desarrollador no hay concurrencia que bloquear.

**Riesgo de seguridad**: un archivo de estado de Terraform **contiene valores sensibles en
texto plano**. No es un problema hoy porque el único recurso con secreto potencial es el App
Client, que se crea deliberadamente sin secreto, pero la regla general se mantiene: el estado
nunca se versiona ni se comparte.

Con más tiempo: backend S3 con bloqueo nativo, que desde Terraform 1.10 no necesita ya una
tabla de DynamoDB aparte.

### Un solo estado para base y despliegue

`setup-deployment` añadirá archivos a este mismo directorio en lugar de crear un segundo
estado. Dividirlos aislaría mejor el radio de impacto, pero obligaría a pasar valores entre
estados. A esta escala, el coste de esa indirección supera lo que aporta.

### Estructura plana, sin módulos

Una tabla, un bucket, un User Pool y una función no son dos usos de nada. Escribir módulos aquí
sería exactamente la abstracción especulativa que `CLAUDE.md` prohíbe. Los archivos se separan
por recurso para que se lean, no para reutilizarse.

### El correo como nombre de usuario, no como alias

Esta es la decisión que más silenciosamente puede romper el proyecto entero.

Cognito ofrece dos formas de iniciar sesión con el correo. Como **alias**, el correo solo se
resuelve cuando está verificado; como **nombre de usuario**, el correo _es_ la identidad y la
verificación es irrelevante. Dado que se auto-confirma sin verificar el correo, usar alias
produciría usuarios que se registran correctamente y **nunca pueden iniciar sesión**, con un
error que no apunta a la causa.

Se usa el correo como nombre de usuario.

### Auto-confirmación sin verificar el correo

El trigger de pre-registro confirma al usuario pero **no** marca el correo como verificado:
marcarlo sería afirmar que alguien comprobó algo que nadie comprobó. El User Pool se deja sin
atributos de verificación automática, de modo que no envía correos en ningún caso, y la
recuperación de cuenta queda restringida a administrador, porque "olvidé mi contraseña" no
tiene sentido con correos ficticios.

**Riesgo de seguridad reconocido**: auto-confirmar abre la puerta a registros masivos, ya que
no hay ninguna prueba de que quien se registra controle el correo. Es aceptable en un entorno
de demostración con datos ficticios y vida corta. En producción se mantendría la verificación y
se añadiría protección contra registros abusivos.

### Ciclo de vida por etiqueta, no por prefijo

Una regla de ciclo de vida no puede consultar la base de datos: solo sabe filtrar por prefijo,
por etiqueta y por antigüedad. Para que sepa qué video quedó huérfano, el estado tiene que
viajar en el objeto.

La política de subida firmada incluirá una etiqueta fija `status=pending` como campo obligatorio,
de modo que el cliente no pueda subir sin ella ni elegir otro valor. La confirmación reetiqueta
a `status=confirmed`, y eso **saca** al objeto del alcance de la regla.

El sentido importa: si se etiquetara al confirmar, un huérfano se quedaría sin etiqueta y
viviría para siempre. El valor por omisión tiene que ser el que se limpia.

La alternativa era subir a un prefijo `pending/` y copiar el objeto al confirmar. Funciona, pero
la clave cambiaría al confirmar, y tanto el reintento como la verificación tendrían que saber en
qué prefijo mirar según el estado. Más piezas móviles por ningún beneficio.

Se añade una segunda regla, global y más larga, como tope de coste frente a los 5 GB de la capa
gratuita.

**Ambas reglas son eventuales**: el ciclo de vida se evalúa una vez al día y su unidad mínima es
un día. No sirve para limpiar en minutos, y no pretende hacerlo.

### Capacidad provisionada en DynamoDB, no bajo demanda

Bajo demanda es la mejor decisión de ingeniería en abstracto: no exige planificar capacidad ni
expone a limitación por exceso. Pero la capa siempre gratuita de DynamoDB está definida sobre
capacidad **provisionada** — 25 unidades de lectura y 25 de escritura — y bajo demanda se
factura desde la primera petición, a razón de 0,625 dólares por millón de escrituras y 0,125 por
millón de lecturas.

El importe de una demostración sería de fracciones de céntimo, pero el enunciado es explícito:
si una decisión implica un cobro, se documenta en lugar de ejecutarla. Existiendo una
alternativa a coste cero y con la misma funcionalidad, no hay nada que sopesar.

El riesgo que se asume es la limitación por exceso de capacidad. Con un solo usuario probando el
flujo, 25 escrituras por segundo sostenidas están varios órdenes de magnitud por encima de lo
que la aplicación va a generar.

Con más tiempo y carga real impredecible: bajo demanda, precisamente por no tener que acertar la
capacidad.

### Cifrado gestionado por S3, no por KMS

El cifrado en reposo usa claves gestionadas por S3. KMS daría trazabilidad de uso de clave, pero
cobra por petición y por clave, y aquí no hay requisito de custodia que lo justifique.

### Sin versionado de objetos

Versionar duplicaría el almacenamiento de archivos de hasta 200 MB contra una capa gratuita de
5 GB, y el caso de uso no contempla sobrescribir un video: cada solicitud escribe su propia
clave, una sola vez.

### Nombre del bucket único globalmente

El espacio de nombres de S3 es global, así que un nombre fijo colisionaría con cualquier otra
cuenta que lo hubiera tomado. Se compone con un sufijo aleatorio estable, guardado en el estado.

### Orígenes permitidos como variable

El bucket debe aceptar subidas desde el servidor de desarrollo local y, más adelante, desde el
dominio de la distribución de contenido. Como esa distribución todavía no existe, la lista de
orígenes es una variable: `setup-deployment` la amplía en lugar de que nadie edite un literal.

### Los identificadores no se copian a mano

Terraform emite los identificadores como salidas y un script genera a partir de ellas los
archivos de entorno de `api` y `web`. Sin ese script, la alternativa real no es "copiarlos con
cuidado": es copiarlos mal alguna vez y perder media hora averiguando por qué.

## Riesgos asumidos

| Riesgo                                            | Mitigación                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Estado de Terraform solo en una máquina           | Ignorado por git y documentado; con más tiempo, backend remoto                                         |
| Auto-confirmación permite registros masivos       | Entorno de demostración, datos ficticios, vida corta                                                   |
| El usuario de Terraform tiene permisos amplios    | Usuario dedicado, no raíz; se elimina al terminar la prueba                                            |
| Capacidad provisionada puede limitar si se supera | 25 unidades por segundo frente a un único usuario probando: el margen es de varios órdenes de magnitud |
| La capa gratuita de almacenamiento son 5 GB       | Clips pequeños en desarrollo y regla de ciclo de vida como tope                                        |
