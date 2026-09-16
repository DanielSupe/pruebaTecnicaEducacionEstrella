## 1. Antes de mover nada

- [x] 1.1 Anotar el estado de partida: 47 pruebas de ruta, 88 de la API en total, todas en verde
- [x] 1.2 Dejar claro el criterio de éxito: **las afirmaciones de las pruebas no se tocan**. Solo
      puede cambiar la línea que monta las dependencias. Si hay que cambiar una afirmación, la
      reorganización cambió el comportamiento y hay que deshacerlo

## 2. Solicitudes

La funcionalidad con lógica de verdad. Queda en cinco archivos:

- [x] 2.1 `applications.repository.ts` — lo que hoy es `repository.ts`, solo renombrado
- [x] 2.2 `applications.storage.ts` — lo que hoy es `uploads.ts`. Es la misma capa que el
      repositorio: acceso a un almacén, en este caso S3
- [x] 2.3 `applications.service.ts` — **nuevo**. Recibe el repositorio y el almacenamiento
- [x] 2.4 Al servicio se mueve la búsqueda de una solicitud propia, las comprobaciones de estado y
      **la orquestación del aviso de subida completada**, que es la que justifica esta capa
- [x] 2.5 El orden de esas cinco operaciones no cambia, y el comentario que lo explica viaja con
      ellas: es una trampa, no una explicación
- [x] 2.6 `applications.controller.ts` — **nuevo**. Identidad del token, validación con Zod,
      códigos de estado y forma de la respuesta. Nada más
- [x] 2.7 La función que retira la ruta interna del objeto se queda en el controlador: es forma de
      la respuesta, no negocio
- [x] 2.8 `applications.routes.ts` — solo la tabla: camino, middleware y controlador

## 3. Vida e identidad

- [x] 3.1 `features/health/` con sus tres archivos
- [x] 3.2 `features/me/` con sus tres archivos
- [x] 3.3 No tienen repositorio y no se les inventa uno: no persisten nada
- [x] 3.4 Se retira la carpeta `routes/`, que queda vacía

## 4. Los manejadores adelgazan

- [x] 4.1 Retirar el envoltorio `void (async () => { try … catch { next(error) } })()` de los cinco
      manejadores
- [x] 4.2 Quedan como funciones asíncronas normales: Express 5 propaga el rechazo por su cuenta, y
      hay una prueba que lo demuestra
- [x] 4.3 Comprobar que esa prueba sigue pasando: es la que sostiene esta decisión

## 5. El montaje

- [x] 5.1 `app.ts` construye repositorio y almacenamiento, con ellos el servicio, con él el
      controlador, y se lo pasa a las rutas
- [x] 5.2 Cada capa recibe la de debajo: nadie la busca por su cuenta

## 6. Verificación

- [x] 6.1 **Las 88 pruebas de la API en verde sin tocar una sola afirmación.** Es la garantía del
      change: son el contrato, y si siguen pasando el comportamiento no cambió
- [x] 6.2 Revisar el diff de las pruebas: solo deben aparecer líneas de montaje
- [x] 6.3 Comprobar que ningún controlador importa el repositorio ni el almacenamiento
- [x] 6.4 Comprobar que ningún servicio recibe ni devuelve objetos de petición o respuesta
- [x] 6.5 Arrancar la API y recorrer el flujo contra AWS real: crear, subir, avisar, listar y
      pedir el enlace del vídeo
- [x] 6.6 Comprobar que los códigos de estado de los casos de error siguen siendo los mismos:
      401 sin token, 404 ajena, 409 estado incorrecto, 400 datos inválidos

## 7. Documentación

- [x] 7.1 El README describe la estructura nueva
- [x] 7.2 Decir qué puede saber cada capa, no solo cómo se llaman los archivos
- [x] 7.3 `CLAUDE.md`: la estructura en cuatro capas, para que el próximo cambio la siga

## 8. Cierre del change

- [x] 8.1 `pnpm turbo lint typecheck test` en verde
- [x] 8.2 Escáner de secretos limpio
- [x] 8.3 Archivar el change y sincronizar la capability
- [x] 8.4 Cerrar con un único commit: `⬆️ improve(api): rutas, controladores, servicios y repositorios separados`
