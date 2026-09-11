## 1. Dependencias

- [x] 1.1 Añadir `zod@^4.6.2` como dependencia de `packages/shared` (dependencia de producción, no de desarrollo: forma parte del contrato que se ejecuta en tiempo de ejecución)
- [x] 1.2 Añadir `vitest@^4.1.11` como dependencia de desarrollo de la raíz. No usar la 5.x: salió hace días y no aporta nada a pruebas unitarias de esquemas
- [x] 1.3 Cambiar el script `test` de `packages/shared` de `echo` a `vitest run`
- [x] 1.4 Verificar con `pnpm peers check` que no aparecen conflictos nuevos

## 2. Límites del video (`src/video.ts`)

- [x] 2.1 `MAX_VIDEO_BYTES = 200 * 1024 * 1024`, escrito como producto y no como literal, con un comentario que explique que son mebibytes y que este mismo número lo usan la política firmada y la verificación posterior
- [x] 2.2 `VIDEO_CONTENT_TYPES` como mapa de tipo de contenido a extensión (`video/mp4` → `mp4`, `video/webm` → `webm`), tipado para que las claves sean la fuente de verdad del enum
- [x] 2.3 `videoContentTypeSchema` derivado de las claves del mapa, no escrito a mano dos veces
- [x] 2.4 `videoMetadataSchema`: tipo de contenido permitido y tamaño entero entre 1 y `MAX_VIDEO_BYTES`, ambos inclusive
- [x] 2.5 `extensionForContentType()`: función pura que devuelve la extensión de un tipo permitido
- [x] 2.6 Mensajes de error en español, redactados para mostrarse tal cual al usuario

## 3. Esquemas de la solicitud (`src/application.ts`)

- [x] 3.1 `APPLICATION_STATUSES` y `applicationStatusSchema` con los dos estados: `PENDING_VIDEO` y `UNDER_REVIEW`
- [x] 3.2 `applicationFieldsSchema`: `fullName`, `idDocument` (solo dígitos, 5 a 20), `institution`, `program` y `amount` (entero positivo dentro del rango seguro, sin máximo de negocio)
- [x] 3.3 `createApplicationInputSchema`: los campos anteriores más los metadatos del video, en `.strict()` para que una clave desconocida sea un error explícito
- [x] 3.4 `applicationSchema`: la entidad que devuelve la API (identificador, estado, fechas y datos del video), separada de la entrada para que el cliente no pueda fijar lo que controla el servidor
- [x] 3.5 Exportar los tipos inferidos con `z.infer`, nunca escritos a mano en paralelo
- [x] 3.6 Mensajes de error en español

## 4. Punto de entrada

- [x] 4.1 `src/index.ts` reexporta el contrato público y deja de ser `export {}`

## 5. Pruebas

- [x] 5.1 `src/video.test.ts`: tipo de contenido no permitido; tamaño exactamente `MAX_VIDEO_BYTES` (debe **aceptarse**: el límite es inclusivo); `MAX_VIDEO_BYTES + 1`; tamaño cero; extensión de cada tipo permitido
- [x] 5.2 `src/application.test.ts`: monto cero, negativo, decimal y por encima del entero seguro; documento con letras, demasiado corto y demasiado largo; falta de un campo obligatorio
- [x] 5.3 `src/application.test.ts`: un campo desconocido (`status`, `userId`) es rechazado por `.strict()`, no descartado en silencio
- [x] 5.4 Comprobar que el mensaje de error de al menos un caso llega en español, porque se muestra tal cual en la interfaz
- [x] 5.5 Verificar que Vitest informa de un número de pruebas mayor que cero: un `test` que no ejecuta nada y sale en verde es peor que no tenerlo

## 6. Verificación

- [x] 6.1 `pnpm turbo lint typecheck test` en verde en los tres paquetes
- [x] 6.2 Comprobar que los tipos de `shared` resuelven desde `api` con contenido real (en el change anterior se verificó con el paquete vacío)
- [x] 6.3 `openspec validate add-shared-schemas` pasa
- [x] 6.4 Revisar que ningún límite quedó duplicado: `MAX_VIDEO_BYTES` y los tipos permitidos aparecen definidos una sola vez en todo el repositorio

## 7. Cierre del change

- [x] 7.1 Archivar el change y sincronizar la capability `solicitud-credito` a las specs principales
- [x] 7.2 Cerrar con un único commit siguiendo la skill `git-workflow`: `✨ feat(shared): esquemas de la solicitud y limites del video`
