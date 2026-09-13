## Why

Es el primer endpoint con lógica de negocio, y el que materializa la decisión de arquitectura
que sostiene todo lo demás: el vídeo va del navegador a S3 sin pasar por la API.

Esa decisión no es una optimización. El límite de 6 MB de carga útil de API Gateway y Lambda hace
imposible subir 200 MB a través de la API, así que la política de subida firmada es lo que vuelve
viable la opción serverless que pide el enunciado.

## What Changes

- `POST /api/v1/applications` valida los datos, registra la solicitud como pendiente de vídeo y
  devuelve una política de subida firmada.
- Acceso a datos de solicitudes: escritura con clave compuesta y marca de expiración.
- Generación de la política firmada, que fija la clave exacta, el tipo de contenido, el rango de
  tamaño y la etiqueta que permite limpiar los huérfanos.
- Se define el contrato de la respuesta de subida en el paquete compartido, aplazado desde el
  change de esquemas hasta tener delante lo que devuelve el SDK.
- Se retira el tamaño declarado del cuerpo de la petición: el límite lo impone la política
  firmada, no un número que el cliente envía.
- Política de permisos en Terraform, sin adjuntar todavía a ningún rol.

## Capabilities

### Modified Capabilities

- `solicitud-credito`: describía qué datos constituyen una solicitud válida. Se añade qué ocurre
  al registrarla y cómo se autoriza la subida del vídeo.

## Alternativas descartadas

- **Recibir el vídeo en la API y reenviarlo.** Imposible: la carga útil máxima está dos órdenes
  de magnitud por debajo del tamaño del archivo. Aunque cupiera, se pagaría el tiempo de cómputo
  de la función mientras el archivo viaja.
- **Que el cliente declare el tamaño del archivo.** No aportaba nada: el límite lo impone la
  política firmada, que el cliente no puede alterar, y la verificación posterior comprueba el
  tamaño real. Un campo menos que falsear y un número menos que mantener sincronizado.
- **Fijar en la política el tamaño exacto declarado.** Sería más estricto, pero una diferencia de
  un solo byte haría que el almacenamiento rechazara la subida con un error que el usuario no
  puede entender ni corregir.
- **Derivar la extensión del nombre del archivo.** Ese nombre lo controla el usuario y acabaría
  formando parte de la ruta del objeto. Se deriva del tipo de contenido, que está restringido a
  una lista cerrada.
- **Dejar que el cliente proponga la ruta del objeto.** Obligaría a verificar que pertenece a
  quien la envía y que no está ya ocupada. Construirla en el servidor elimina el problema en
  lugar de vigilarlo.
- **Una capa de servicios entre las rutas y el acceso a datos.** Hoy solo reenviaría llamadas.
- **Escribir un identificador ordenable a mano.** El valor está en que ordene por tiempo de forma
  lexicográfica, y una versión casera falla en la monotonía dentro del mismo milisegundo, que es
  justo cuando importa.

## Requisitos del enunciado que cubre

- **3.2**: registro de la solicitud con validación en servidor y estrategia de subida del vídeo.
- **3.2**: "validación de tipo y tamaño antes de consumir ancho de banda innecesario".
- **4.2**: API REST desplegable como función, que es posible precisamente porque el archivo no
  pasa por ella.
- **Sección 7, "Backend y manejo de archivos"**: es el núcleo de esa dimensión.

## Impact

- `apps/api/`: acceso a datos, generación de la política firmada y la ruta.
- `packages/shared/`: contrato de la respuesta de subida y retirada del tamaño declarado.
- `infra/`: política de permisos, sin adjuntar.
- Desbloquea la confirmación de la subida y el formulario del navegador.
