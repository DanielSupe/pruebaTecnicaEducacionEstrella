## 1. Contrato en `shared`

- [x] 1.1 Esquema de la respuesta del enlace: la dirección y el instante de caducidad
- [x] 1.2 La caducidad viaja como instante absoluto, no como "quedan N segundos": el cliente no
      sabe cuánto tardó la respuesta en llegarle
- [x] 1.3 La constante de duración vive en la API, junto a la de la subida, no en `shared`: no la
      necesita el navegador

## 2. Firma de la lectura

- [x] 2.1 `authorizeView` en `uploads.ts`, junto al resto de operaciones sobre el almacenamiento
- [x] 2.1b No previsto en el plan: el tipo se llamaba `UploadAuthorizer` y al ganar una operación
      de lectura pasaba a describir mal lo que hace. Renombrado a `VideoStorage` (5 referencias).
      De paso, un bloque de documentación que se había quedado suelto sobre otro símbolo vuelve a
      la función que describe
- [x] 2.2 Usa el firmador del SDK sobre una lectura del objeto, con la duración definida
- [x] 2.3 Devuelve también el instante de caducidad, calculado en el servidor
- [x] 2.4 Duración: 15 minutos. Dejar escrito **por qué** no son 5, que es lo que parecería más
      prudente: el reproductor pide trozos del archivo mientras se reproduce y al adelantar, y
      una caducidad corta rompe la reproducción a mitad
- [x] 2.5 La URL firmada **no** se registra en ningún log

## 3. Ruta

- [x] 3.1 `GET /applications/:id/video-url`, detrás del middleware de autenticación
- [x] 3.2 Reutilizar `buscarPropia`: una solicitud ajena se comporta como inexistente
- [x] 3.3 Si el estado no es el de vídeo confirmado, conflicto con un mensaje que explique que
      todavía no hay vídeo que ver
- [x] 3.4 La respuesta lleva la dirección y la caducidad. **No** lleva la ubicación del objeto

## 4. Pruebas

- [x] 4.1 Una solicitud pendiente de vídeo no produce enlace, y **no se llega a firmar nada**:
      afirmar sobre el doble del firmador, no solo sobre el código de respuesta
- [x] 4.2 Una solicitud de otro solicitante responde como inexistente
- [x] 4.3 Sin autenticación, no autorizado
- [x] 4.4 La respuesta no contiene la ubicación del objeto
- [x] 4.5 El instante de caducidad va por delante del momento de la petición
- [x] 4.6 Mutar la comprobación de estado debe romper alguna prueba; si no, la prueba no prueba

## 5. Verificación contra AWS real

- [ ] 5.1 ~~Con una solicitud enviada de verdad: el enlace **reproduce el vídeo** en el
      navegador~~ → **movida al change del listado web**, que es donde existe el reproductor.
      Aquí no hay interfaz que consuma el endpoint. Lo verificable a nivel HTTP sí se comprobó:
      el enlace responde 200 con `Content-Type: video/mp4` y `Accept-Ranges: bytes`, que es
      justo de lo que depende un elemento `<video>`
- [x] 5.2 La misma dirección **sin firma** responde denegado: es lo que demuestra que el bucket
      sigue privado y que el acceso lo da la firma, no una apertura del bucket
- [x] 5.3 Adelantar dentro del vídeo funciona: confirma que las peticiones por trozos van
      firmadas y no solo la primera. Comprobado con una petición por rango: `206 Partial
    Content` con el rango exacto. El archivo subido fue **sintético**, no un vídeo real:
      el almacenamiento no inspecciona el contenido, y no se suben archivos personales
- [x] 5.4 Alterar un carácter de la firma responde denegado
- [x] 5.5 Pedir el enlace de una solicitud de otra cuenta responde como inexistente. Con dos
      cuentas reales, que es la comprobación que ningún doble sustituye
- [x] 5.6 Revisar la salida de la API: la URL firmada **no** aparece en los registros
- [x] 5.7 Limpiar las solicitudes y objetos de prueba al terminar

## 6. Cierre del change

- [x] 6.1 `pnpm turbo lint typecheck test` en verde
- [x] 6.2 Escáner de secretos limpio
- [x] 6.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 6.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 6.5 Cerrar con un único commit: `✨ feat(api): enlace temporal para ver el video`
