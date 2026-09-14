## 1. Error de conflicto

- [x] 1.1 `ConflictError` (409) en `src/errors.ts`, junto a las que ya existen
- [x] 1.2 Se usa cuando la petición choca con el estado actual: avisar sin haber subido, o pedir autorización para una solicitud ya enviada

## 2. Lectura y actualización de solicitudes

- [x] 2.1 `getApplication(userId, applicationId)`: lectura por clave, **nunca por recorrido**
- [x] 2.2 Una solicitud ajena se comporta como inexistente: distinguir "no existe" de "no es tuya" revela qué identificadores están en uso
- [x] 2.3 `markAsSubmitted`: actualización **condicionada al estado pendiente**, que registra el tamaño real, el momento, y **retira el plazo de expiración**
- [x] 2.4 Sin retirar la expiración, una solicitud enviada desaparecería a los 7 días. Es el fallo más silencioso de este change
- [x] 2.5 Si la condición falla porque ya estaba enviada, **no es un error**: es el caso idempotente

## 3. Verificación y reetiquetado del objeto

- [x] 3.1 `verifyStoredVideo(key, contentType)`: comprueba existencia, tamaño real y tipo
- [x] 3.2 Traducir "no existe" a conflicto, no a un error inesperado: es un estado previsible del flujo
- [x] 3.3 **Esta es la única comprobación que ve el tamaño real.** El navegador evita gastar ancho de banda y la firma acota lo que se acepta; solo aquí se mira lo que quedó guardado
- [x] 3.4 Comprobar también el tipo aunque la firma ya lo fije: llega en la misma respuesta y detectaría una autorización mal construida
- [x] 3.5 `markVideoAsConfirmed(key)`: reetiqueta el objeto para sacarlo de la limpieza de huérfanos

## 4. Aviso de subida completada

- [x] 4.1 `POST /api/v1/applications/:id/complete-upload`, detrás del middleware de autenticación
- [x] 4.2 **El orden es: verificar → reetiquetar → actualizar.** Al revés, un fallo intermedio dejaría una solicitud enviada con el vídeo aún marcado como pendiente, y la limpieza lo borraría
- [x] 4.3 Si ya estaba enviada, responder con éxito y el mismo estado: avisar dos veces produce el mismo resultado que avisar una
- [x] 4.4 El caso de "subió pero nunca avisó" se repara solo: la verificación encuentra el objeto y el estado se actualiza sin volver a subir
- [x] 4.5 Devolver la solicitud actualizada, para que el navegador no tenga que volver a pedirla

## 5. Reintento de subida

- [x] 5.1 `POST /api/v1/applications/:id/video-url`, detrás del middleware
- [x] 5.2 Solo sobre solicitudes propias que sigan pendientes; una ya enviada da conflicto
- [x] 5.3 Reutilizar la misma construcción de ruta y la misma autorización que la creación: **no duplicar** la lógica de firma
- [x] 5.4 La ruta del objeto es la misma, de modo que reintentar sobreescribe en lugar de acumular huérfanos

## 6. Permisos

- [x] 6.1 Añadir a la política existente: lectura del objeto —que es lo que exige la verificación, aunque el nombre de la operación no lo sugiera— y lectura y actualización de la tabla
- [x] 6.2 El reetiquetado ya está cubierto por el permiso que se añadió en el change anterior
- [x] 6.3 Repasar que no sobre ninguna acción

## 7. Pruebas

- [x] 7.1 Avisar sin objeto almacenado devuelve conflicto y **no modifica** la solicitud
- [x] 7.2 Avisar con un objeto demasiado grande devuelve conflicto
- [x] 7.3 Avisar con un objeto de otro tipo devuelve conflicto
- [x] 7.4 Avisar correctamente actualiza el estado, registra el tamaño real y **retira la expiración**
- [x] 7.5 El reetiquetado ocurre **antes** que la actualización: comprobar el orden, no solo que ambas suceden
- [x] 7.6 Avisar dos veces devuelve éxito ambas veces, sin efectos distintos
- [x] 7.7 Una solicitud ajena se comporta como inexistente
- [x] 7.8 Pedir autorización para una solicitud ya enviada devuelve conflicto
- [x] 7.9 Pedir autorización para una pendiente devuelve una nueva, con la misma ruta
- [x] 7.10 Sin autenticación, ambos endpoints devuelven 401 y no tocan nada

## 8. Verificación contra AWS real

- [x] 8.1 Crear una solicitud, **avisar sin subir** → conflicto, y comprobar en la tabla que sigue pendiente
- [x] 8.2 Subir el vídeo y avisar → estado enviado, tamaño real registrado, **sin plazo de expiración**
- [x] 8.3 **Comprobar la etiqueta del objeto en S3**: debe ser confirmada. Es lo único que demuestra de extremo a extremo que la limpieza de huérfanos no se llevará por delante un vídeo válido
- [x] 8.4 **Avisar una segunda vez** → éxito, y el estado no cambia
- [x] 8.5 Pedir autorización nueva para una solicitud ya enviada → conflicto
- [x] 8.6 Con una segunda cuenta, intentar operar sobre la solicitud de la primera → debe comportarse como inexistente
- [x] 8.7 Limpiar solicitudes, objetos y cuentas de prueba al terminar

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 9.5 Cerrar con un único commit: `✨ feat(api): aviso de subida completada con verificacion`
