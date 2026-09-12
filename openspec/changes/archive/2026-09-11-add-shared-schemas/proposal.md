## Why

El enunciado pide en 3.2 "validación de campos en el cliente **y** en el servidor", y la
sección 8 penaliza "ausencia total de validación en el servidor, confiando solo en el cliente".
La forma de cumplir ambas sin que las reglas diverjan es que exista **un solo lugar** donde se
definan, y que cliente y servidor importen exactamente ese código.

Este change entrega ese contrato antes que la API y antes que el frontend, precisamente porque
los dos dependen de él. Si se escribiera después, cada lado habría inventado ya sus propias
reglas y la reconciliación sería una fuente de bugs de borde.

Hay un segundo motivo, menos obvio: el límite de 200 MB del video aparece en **tres** sitios
distintos del sistema (la validación del navegador antes de subir, el `content-length-range` de
la política firmada de S3, y el `HeadObject` que verifica la subida). Si esos tres números no
son literalmente el mismo, aparecen fallos en el borde imposibles de diagnosticar. Definirlo una
vez en `shared` es lo que lo evita.

## What Changes

- `packages/shared` pasa de esqueleto vacío a contener el contrato del dominio:
  - Límites del video: tamaño máximo, tipos MIME permitidos y la extensión que corresponde a
    cada uno.
  - Esquemas Zod de la solicitud de crédito: campos del formulario, entrada de creación y la
    entidad que devuelve la API.
  - Los dos estados de una solicitud.
  - Tipos TypeScript inferidos de los esquemas, para que tipo y validación no puedan divergir.
- Se añade Vitest a la raíz y el script `test` de `shared` pasa de un `echo` a ejecutar pruebas
  de verdad.
- Los mensajes de error de los esquemas se escriben en español, porque llegan tal cual a la
  interfaz.

## Capabilities

### New Capabilities

- `solicitud-credito`: qué constituye una solicitud de crédito válida — campos obligatorios y
  sus restricciones, restricciones del video de entrevista, y los estados por los que pasa.

### Modified Capabilities

Ninguna.

## Alternativas descartadas

- **Duplicar las reglas en `api` y en `web`.** Es lo que hace que el cliente acepte un monto que
  el servidor rechaza, o al revés. El coste de mantener dos copias sincronizadas siempre se paga
  tarde y en forma de bug de borde.
- **Validar solo en el servidor y dejar que el cliente reaccione al 400.** Cumpliría la letra
  del requisito, pero obliga al usuario a subir 200 MB para enterarse de que el documento tenía
  una letra. El enunciado pide explícitamente validar "antes de consumir ancho de banda
  innecesario".
- **Usar `z.coerce.number()` para el monto.** Resolvería que el input HTML entregue una cadena,
  pero el mismo esquema corre en el servidor, donde aceptaría `"5000"` en el body JSON. Eso
  relaja justo la validación de servidor que evalúan. El formulario convierte antes de validar.
- **Derivar la extensión del video del nombre del archivo.** El nombre lo controla el usuario y
  acaba formando parte de la key de S3. Se deriva del `contentType`, que está restringido a una
  lista cerrada: elimina el path traversal en vez de intentar sanearlo.
- **Incluir aquí el contrato de la respuesta del presigned POST.** Su forma la dicta
  `createPresignedPost` del SDK de AWS; definirla antes de haberla invocado nunca es adivinar.
  Entra en `add-application-create`, a tiempo para que `web` la consuma.
- **Persistir el nombre original del archivo.** El listado muestra estado y fecha, que es lo que
  pide el 3.3. Guardar una cadena controlada por el usuario no aporta nada y añade superficie.

## Requisitos del enunciado que cubre

- **3.2**: campos del formulario (nombre completo, documento, institución, programa, monto) y
  restricciones del video (`.mp4`/`.webm`, máximo 200 MB).
- **3.2**: "validación de campos en el cliente y en el servidor" — el mismo esquema en ambos.
- **3.2**: "validación de tipo y tamaño del archivo antes de consumir ancho de banda
  innecesario" — las constantes que lo hacen posible en el navegador.
- **Sección 8**: evita la señal penalizada de validar solo en el cliente.

## Impact

- `packages/shared/src/`: archivos nuevos de video, solicitud y sus pruebas.
- `packages/shared/package.json`: dependencia de `zod`; script `test` real.
- `package.json` raíz: `vitest` como dependencia de desarrollo.
- Sin cambios en API, infraestructura ni frontend: todavía no existen.
- Desbloquea: `add-api-foundation`, `setup-web-foundation` y, a través de ellos, todo el flujo
  de la solicitud.
