# Educación Estrella — Solicitud de crédito educativo con video

Un solicitante se registra, rellena el formulario de solicitud de crédito, adjunta el video de su
entrevista y consulta después el estado de lo que ha enviado.

Prueba técnica Full Stack. El enunciado completo está en
[`prueba-tecnica-fullstack-educacion-estrella.md`](prueba-tecnica-fullstack-educacion-estrella.md)
y es la fuente de verdad de los requisitos.

**Desplegado en https://educacionestrella.danielsupelano.online**

---

## 1. Cómo levantar el proyecto localmente

**No hay emulación local de AWS.** La autenticación es Cognito y los datos y los videos viven en
DynamoDB y S3; no implementé una capa que los sustituya, así que el flujo completo se recorre
contra infraestructura real.

Eso no significa que haya que desplegar nada: **la infraestructura ya está corriendo**, y el primer
camino de aquí abajo la usa tal cual.

Las pruebas automatizadas sí corren **sin AWS**: usan dobles y pasan con las credenciales
eliminadas. Lo que no existe es su otra mitad — la verificación contra infraestructura real se hizo
a mano. Para una evolución del proyecto añadiría esas pruebas de integración contra un entorno de
desarrollo.

Tres caminos, de menos a más esfuerzo. Elige el primero que te sirva.

---

### A) Solo el frontend, contra la API desplegada

**El más corto.** Ni Terraform, ni levantar la API, ni credenciales de AWS. Basta para recorrer el
flujo entero, incluida la subida del video.

Necesitas **Node 22+** y **pnpm 11**.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
```

En `apps/web/.env`, tres valores:

```bash
VITE_API_BASE_URL=https://<dominio-desplegado>/api/v1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

Los dos identificadores de Cognito salen de `terraform output` en el despliegue que vayas a usar, o
de quien te haya pasado el proyecto. No son secretos: viajan en el paquete que descarga cualquiera
que abra la aplicación.

```bash
pnpm --filter @educacion-estrella/web dev    # http://localhost:5173
```

Funciona porque el despliegue autoriza `http://localhost:5173` como origen, tanto en la API como en
el bucket de videos — por eso la subida directa al almacenamiento también funciona desde local.

---

### B) Frontend y API, los dos en local

Para depurar el backend. Necesitas lo anterior más **credenciales de AWS**: la API llama a DynamoDB
y a S3 con IAM, y esas llamadas van firmadas. Sin credenciales arranca, pero falla en cuanto toca
datos.

Pueden ir en tu perfil de AWS, en el entorno, o **en el propio `apps/api/.env`** junto al resto de
variables.

```bash
cp apps/api/.env.example apps/api/.env
```

Los cinco identificadores de infraestructura que pide salen de `terraform output`. Y en
`apps/web/.env`, apunta el frontend a tu API local:

```bash
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

En dos terminales:

```bash
pnpm --filter @educacion-estrella/api dev    # http://localhost:3000
pnpm --filter @educacion-estrella/web dev    # http://localhost:5173
```

La API valida su configuración **al arrancar** y el frontend la valida **al construir**: si falta
una variable, ninguno de los dos llega a levantar y el mensaje dice cuál falta.

Un aviso: la comprobación de vida responde correctamente aunque las credenciales estén mal, porque
no consulta nada. Para saber si la API llega a los datos, pide el listado de solicitudes.

---

### C) Crear la infraestructura desde cero

Necesitas además **Terraform 1.9+** y el **AWS CLI**.

```bash
pnpm install

cd infra
terraform init
terraform apply          # crea Cognito, DynamoDB, S3 y el resto
cd ..

bash scripts/gen-env.sh  # genera apps/api/.env y apps/web/.env
```

**No transcribas los identificadores a mano.** Terraform es la única fuente de verdad de nombres de
bucket, identificadores de Cognito y nombres de tabla; ese script los lee de `terraform output` y
escribe los `.env`. Copiarlos a mano cuesta más tiempo del que ahorra, y un carácter mal puesto
produce un fallo que no apunta a su causa.

Después, a arrancar igual que en el camino B.

#### Lo que el User Pool tiene que tener activado

Si lo creas a mano en vez de con Terraform, hay tres cosas **sin las cuales el acceso no funciona**,
y ninguna da un error que apunte a su causa:

- **El correo como `username`, no como alias.** Es el detalle crítico. Configurado como alias,
  Cognito solo resuelve el correo cuando está verificado; como aquí no se verifica, los usuarios se
  registrarían bien y **nunca podrían iniciar sesión**.
- **App Client sin secreto.** El cliente es un navegador: un secreto incrustado ahí lo lee
  cualquiera en el paquete descargado. Y con secreto, la librería de autenticación rechaza la
  configuración.
- **Flujo de autenticación SRP habilitado** (`ALLOW_USER_SRP_AUTH`) más el de refresco.

Además, el registro se auto-confirma con un trigger `PreSignUp`. Sin él los usuarios quedan sin
confirmar y no pueden entrar.

La contraseña exige 8 caracteres con mayúscula, minúscula y número. **Sin símbolo obligatorio**: el
valor por omisión de Cognito lo exige y es fricción innecesaria para quien pruebe la demostración.

---

### Comprobaciones

```bash
pnpm turbo lint typecheck test
```

### Publicar

Necesitas además el **AWS CLI**.

```bash
cd infra && terraform apply && cd ..
bash scripts/deploy-web.sh
```

En ese orden: el script de publicación lee de las salidas de Terraform el bucket y la distribución.

---

## 2. Arquitectura desplegada

El diseño se fijó antes de escribir código, en [`openspec/config.yaml`](openspec/config.yaml). Esto
es lo que quedó construido.

### Estructura

**Monorepo con pnpm workspaces y Turborepo**: `apps/web`, `apps/api`, `packages/shared` e `infra`.

`packages/shared` es donde vive el contrato. Los límites del video, los estados de una solicitud y
las reglas de cada campo existen **una sola vez**, como esquemas Zod que importan cliente y
servidor. Es la única forma de que no diverjan.

El backend se organiza **por módulo de negocio y, dentro de cada uno, por capas en archivos
separados**. No hay una carpeta `controllers/` con todos los controladores juntos: lo que cambia a la
vez vive junto, y lo que se toca al modificar las solicitudes está en una sola carpeta.

```
apps/api/src/features/applications/
├── applications.routes.ts       Qué URL existe y qué la atiende. Nada más
├── applications.controller.ts   HTTP: identidad, validación, códigos de estado, forma de la respuesta
├── applications.service.ts      Las reglas de negocio. No sabe que existe HTTP
├── applications.repository.ts   DynamoDB
└── applications.storage.ts      S3
```

Cada capa **recibe** la de abajo; ninguna la busca por su cuenta. `app.ts` construye el repositorio y
el almacenamiento, con ellos el servicio, con él el controlador, y se lo entrega a las rutas. Por eso
las pruebas pueden sustituir DynamoDB y S3 sin interceptar módulos.

`health` y `me` tienen tres capas en lugar de cinco: no persisten nada, así que no hay repositorio
que escribir.

### Frontend

Aplicación de página única con **React, Vite y TypeScript**, estilada con **Tailwind**.

- **TanStack Router**, con las rutas privadas protegidas en `beforeLoad`: la comprobación ocurre
  **antes de pintar**, porque un guardián que muestra la pantalla y redirige después deja ver, aunque
  sea un instante, lo que no debía verse.
- **TanStack Query** para el estado del servidor y **axios** para la subida, que es lo que permite el
  indicador de progreso.
- **aws-amplify/auth** —solo ese módulo— para hablar con Cognito.
- **SweetAlert2** siempre tras un envoltorio propio: ninguna pantalla conoce la librería, así que
  cambiarla sería reescribir un archivo.
- Los formularios usan estado propio y un hook compartido, **no una librería de formularios**.

### Backend

**Express sobre Node y TypeScript**, API REST bajo `/api/v1`.

- **Zod** valida cuerpo, parámetros y cadena de consulta, con esquemas estrictos: una clave
  desconocida es un error explícito, no algo que se descarte en silencio.
- **Middleware central de errores** con clases propias. Un error inesperado nunca revela detalle
  interno.
- **aws-jwt-verify** comprueba los tokens contra las claves públicas de Cognito. **AWS SDK v3**,
  **helmet**, empaquetado con **esbuild**.
- En local corre con `app.listen`; en la nube, la misma aplicación sobre Lambda. Esa separación
  estaba hecha desde el principio, así que llegar a la nube fue añadir un adaptador, no
  reestructurar nada.

### Infraestructura

Todo en **Terraform**, región `us-east-1`, dentro de la capa gratuita:

| Pieza                       | Para qué                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Cognito** User Pool       | Registro y acceso. App Client **sin secreto**: el cliente es un navegador, y ahí no hay secreto que guardar |
| **DynamoDB**                | Las solicitudes                                                                                             |
| **S3** privado              | Los videos. Sin acceso público, cifrado, CORS acotado y limpieza automática                                 |
| **Lambda + API Gateway**    | La API                                                                                                      |
| **S3 + CloudFront** con OAC | El frontend. El bucket es privado; solo la distribución puede leerlo                                        |
| **IAM**                     | Permisos mínimos, sobre el prefijo concreto y no sobre el bucket entero                                     |
| **CloudWatch**              | Trazas con retención fijada, no indefinida                                                                  |

**Una sola distribución sirve las dos cosas**: la aplicación por defecto y la API bajo `/api/*`. El
navegador habla siempre con el mismo origen, así que entre él y nuestra API no hay intercambio entre
orígenes que configurar ni que equivocar. CloudFront añade además las cabeceras de seguridad, con la
política de seguridad de contenido a la cabeza.

Eso no elimina todo el CORS del sistema: el bucket de videos lo necesita para la subida directa, y
Cognito es otro origen al que el navegador llama por su cuenta.

```
                              Navegador
                                  │
            ┌─────────────────────┼─────────────────────┐
            │ 1. la aplicación    │ 2. la API           │ 3. el video
            ▼                     ▼                     ▼  (directo)
      ┌─────────────────────────────────┐         ┌──────────────┐
      │          CloudFront             │         │  S3  videos  │
      │  CSP · HSTS · un solo origen    │         │   privado    │
      └────────┬───────────────┬────────┘         └──────────────┘
          /*   │               │  /api/*                  ▲
               ▼               ▼                          │
        ┌────────────┐   ┌──────────────┐        autorización firmada,
        │ S3   SPA   │   │ API Gateway  │        con caducidad y límites
        │  privado   │   │   $default   │                 │
        └────────────┘   └──────┬───────┘                 │
                                ▼                         │
                        ┌───────────────┐                 │
                        │    Lambda     │─────────────────┘
                        │   (Express)   │
                        └───┬───────────┘
                            ▼
                     ┌──────────────┐        ┌──────────────────┐
                     │   DynamoDB   │        │     Cognito      │
                     │  solicitudes │        │ ◀── el navegador │
                     └──────────────┘        │   habla directo  │
                                             └──────────────────┘
```

### Reglas que no se negociaron en ningún momento

- **El `userId` sale siempre del `sub` del token verificado, jamás del cuerpo.**
- **El video sube directo del navegador a S3** con una autorización firmada que fija ruta, tipo y
  rango de tamaño. **La API nunca recibe el archivo.**
- **Cliente y servidor validan con los mismos esquemas.** El servidor valida igualmente todo lo que
  recibe: el cliente no es una frontera de confianza.
- **A la API se envía el token de acceso, no el de identidad.**

### El recorrido de una solicitud

Es lo que más cuesta deducir leyendo el código, porque el video nunca pasa por la API:

```
1.  POST /api/v1/applications          →  crea la solicitud   [PENDING_VIDEO]
                                          y devuelve una autorización de subida firmada

2.  POST directo al almacenamiento     →  el video va del navegador a S3
                                          sin tocar la API, con barra de progreso

3.  POST /api/v1/applications/:id/complete-upload
                                       →  la API mira el objeto realmente almacenado
                                          y, si cuadra, pasa a  [UNDER_REVIEW]
```

El paso 3 existe porque la API **no se entera** de que la subida terminó: el archivo viajó por
fuera. Y no se fía del aviso: comprueba el objeto guardado antes de dar nada por bueno.

### Lo que cambió respecto al diseño inicial

Cuatro cosas, y conviene que estén dichas en lugar de aparentar que el plan se cumplió entero:

- **DynamoDB pasó de capacidad bajo demanda a provisionada.** Consultando la API de precios resultó
  que la capa gratuita permanente cubre la capacidad **provisionada**, mientras que bajo demanda se
  factura desde la primera escritura. Misma funcionalidad, coste cero. Con carga real e impredecible
  la elección sería la contraria.
- **El CORS restringido al dominio del frontend se volvió innecesario** al servir la API bajo el
  mismo origen. Sigue configurado para el desarrollo local.
- **El adaptador de Lambda acabó siendo `serverless-http`** y no el que figuraba en el diseño.
- **Se añadió un dominio propio con certificado**, que no estaba previsto.

---

## 3. Decisiones técnicas

### Lambda frente a contenedor

El backend es una API de peticiones cortas, sin estado y con tráfico intermitente: no hay nada aquí
que justifique un proceso corriendo de forma permanente. Para el alcance de esta prueba,
administrar un contenedor en ECS/Fargate añadiría infraestructura que operar sin aportar un
beneficio proporcionado.

**Lo que se paga a cambio:** arranques en frío de unos cientos de milisegundos en la primera
petición tras un rato de inactividad, y una depuración menos cómoda que la de un proceso al que
puedes conectarte.

**Lo que NO fue un argumento**, aunque lo parezca: un contenedor habla con Cognito, S3 y DynamoDB
por el mismo SDK, así que la integración no diferencia; y el límite de tamaño de petición obliga a
la subida firmada en los dos casos, de modo que el contenedor tampoco habría evitado esa
complejidad.

**Elegiría contenedor si** hubiera procesos largos —transcodificar el video, por ejemplo—,
conexiones persistentes, o si el arranque en frío afectara a la experiencia.

### Estrategia de autenticación

**Cognito, resuelto en el cliente.** No hay endpoints de autenticación propios: el navegador habla
con Cognito directamente y la API se limita a **verificar** el token de acceso contra las claves
públicas del directorio.

- **El `userId` sale del `sub` del token verificado, jamás del cuerpo de la petición.** Aceptarlo del
  cuerpo permitiría registrar solicitudes en nombre de cualquiera.
- **El registro auto-confirma sin verificar el correo**, mediante un trigger. Los datos son ficticios
  y verificar exigiría un buzón real. El detalle que decide que esto funcione es usar
  `username_attributes` y no `alias_attributes`: con alias, Cognito solo resuelve el correo cuando
  está verificado, y el acceso fallaría siempre.

**Lo que se paga:** la sesión persistente que pide el enunciado implica, en una aplicación de página
única sin backend de sesión, guardar los tokens donde el JavaScript puede leerlos. Ver
[Limitaciones](#4-limitaciones-conocidas).

### Estrategia de subida de archivos

**Autorización firmada y subida directa al almacenamiento.** El video va del navegador a S3 sin
pasar por la API.

No es una optimización: es lo que vuelve viable la opción serverless. El límite de tamaño de
petición de API Gateway y Lambda hace **imposible** mover 200 MB por la API.

Se eligió el flujo en tres pasos —crear, subir, avisar— frente a firmar una subida suelta, porque el
enunciado pide validar tipo y tamaño _antes de consumir ancho de banda innecesario_: así el
formulario se valida en el servidor antes de transferir nada, y **el servidor decide la ruta del
objeto**, en lugar de tener que sanear una que proponga el cliente.

La política firmada fija la ruta, el tipo de contenido, el rango de tamaño y una etiqueta. Cambiar
un solo campo invalida la firma. El tamaño **no lo declara el cliente**: un número que envía el
navegador no demuestra nada.

**Lo que se paga:** hay un estado intermedio real. Una solicitud puede quedarse en `PENDING_VIDEO`
si la subida se corta, y el sistema tiene que saber recuperarse de eso —por eso el listado permite
completarla— y limpiar lo que quede huérfano.

### Elección de base de datos

**DynamoDB, con una sola tabla.**

```
PK  USER#<sub de Cognito>
SK  APP#<ULID>
```

El identificador de la clave de ordenación es un ULID, que ordena lexicográficamente por tiempo.
Consultar una partición en orden descendente devuelve las solicitudes más recientes primero **sin
índice secundario, sin recorrer la tabla y sin ordenar en memoria**.

Y tiene una propiedad de seguridad que no es accesoria: **la identidad forma parte de la clave de
partición**. Un usuario no puede ver solicitudes ajenas porque literalmente no están en su
partición. Esa es la diferencia entre una consulta segura por construcción y una que depende de
acordarse de comprobar el propietario en cada sitio.

Frente a una base relacional: el patrón de acceso es uno solo —"mis solicitudes, las más recientes
primero"—, no hay relaciones que recorrer ni informes que hacer, y la capacidad provisionada mínima
entra en la capa gratuita permanente.

**Lo que se paga:** el día que aparezca una consulta que el modelo no previó —"todas las solicitudes
en revisión", para un panel administrativo— hará falta un índice secundario. Con una base relacional
sería una consulta más. Es el precio del modelado por patrón de acceso, y se acepta sabiendo que ese
panel está explícitamente fuera de alcance.

### Otras decisiones

**Dos estados y no cinco.** `PENDING_VIDEO` y `UNDER_REVIEW` modelan el ciclo de vida de la
_solicitud_, no el del crédito. Un fallo de subida no es un estado: es ausencia de progreso.

**Los videos huérfanos se limpian solos.** Una regla de ciclo de vida no puede consultar la base de
datos, así que el estado viaja en el objeto: nace etiquetado como pendiente y el aviso de subida
completada lo reetiqueta, lo que lo **saca** del alcance de la regla que borra. Al revés —etiquetar
al confirmar— un huérfano se quedaría sin etiqueta y viviría para siempre.

**Paginación por cursor.** Una consulta a DynamoDB corta sola en 1 MB: sin cursor ese corte ocurre
igual, solo que invisible y sin forma de pedir el resto. El cursor se reconstruye siempre contra la
partición del token, así que uno manipulado no da acceso a datos ajenos.

## 4. Limitaciones conocidas

**Los tokens viven en el almacenamiento del navegador.** Es lo que implica una sesión persistente en
una aplicación de página única sin backend de sesión. Lo que hace el riesgo asumible es que no haya
forma de ejecutar script ajeno: la política de seguridad de contenido lo prohíbe, y está comprobada
intentando violarla —script externo, script en línea y petición a un origen no autorizado: los tres
bloqueados—, no solo declarada.

**La política permite estilos en línea**, porque la librería de ventanas emergentes inyecta su hoja
en tiempo de ejecución. Es una concesión real; el riesgo es de otro orden que el del script, que es
el que protege los tokens.

**La API es alcanzable directamente**, sin pasar por la distribución. Se podría restringir a que
solo CloudFront la invoque; no se hizo porque la API exige token en todo salvo la comprobación de
vida, así que el acceso directo no concede nada que no conceda el camino normal.

**No se inspecciona el contenido real del video.** Se comprueba el tipo declarado y el tamaño del
objeto almacenado, no la cabecera del archivo: cualquier cosa puede llamarse `video/mp4`.

**El registro no verifica el correo.** Ver la decisión de autenticación.

**El tope de ejecuciones simultáneas es de cuenta, no por función.** Esta cuenta tiene un límite
total de 10 y AWS exige dejar 10 sin reservar, así que reservar capacidad es imposible. El mecanismo
está declarado por variable y funciona en una cuenta con el límite habitual.

**El estado de Terraform vive en local y no se versiona.** Si se pierde, Terraform deja de conocer
los recursos. Un backend remoto exige crear antes el bucket que lo aloja, fuera de este mismo
Terraform.

**El registro de validación del certificado se añade a mano**, porque el DNS vive en el registrador
y no en esta cuenta.

**`terraform destroy` seguido de `apply` no se ha ejecutado** sobre el despliegue completo:
destruiría la URL que hay que mantener viva. Sí está comprobado que el estado coincide con lo
declarado y que nada se hizo a mano — una garantía más débil.

### Qué haría distinto con más tiempo

En este orden.

**Que subir el video no dependa de la conexión.** Quien pide este crédito lo hace desde el móvil,
con cobertura irregular. Hoy una subida que se corta al 90 % se pierde entera; con carga multiparte
continuaría desde el último fragmento. Es lo único de esta lista que decide si la solicitud **llega
o no llega**.

**Enterarme de que algo falla sin que lo cuente un usuario.** Hay trazas, pero no métricas ni
alarmas: si las subidas empezaran a fallar, nadie se enteraría hasta que alguien reclamara.

**Dejar preparado el paso siguiente del producto.** Alguien tendrá que revisar estas solicitudes, y
hoy "todas las que están en revisión" no es una consulta posible: la identidad forma parte de la
clave. Haría falta un índice por estado. Es una decisión consciente y sé lo que cuesta revertirla.

Y lo menos vistoso: estado de Terraform remoto e integración continua.

---

## Pruebas

```bash
pnpm turbo test
```

Pocas y elegidas, como pide el enunciado. Cubren los esquemas compartidos, la verificación de
tokens, las rutas de la API con sus casos de error, la seguridad del cursor de paginación y el flujo
de subida del navegador.

**Corren sin AWS**: usan dobles, así que no hacen falta credenciales ni infraestructura.

El criterio al escribirlas fue que **una prueba que no puede fallar no prueba nada**: cada grupo se
comprobó mutando el comportamiento que debía proteger y verificando que alguna prueba se rompía.

## Historial y proceso

Cada funcionalidad nació como un change de [OpenSpec](openspec/changes/archive/) con su propuesta,
sus especificaciones y sus tareas escritas **antes** del código, y se cerró con **un único commit**.
Las propuestas archivadas contienen el razonamiento completo de cada decisión y las alternativas que
se descartaron.

El proceso de trabajo con IA, incluido lo que salió mal, está en [`AI-LOG.md`](AI-LOG.md).

El detalle de la infraestructura, incluida la limpieza al terminar, está en
[`infra/README.md`](infra/README.md).
