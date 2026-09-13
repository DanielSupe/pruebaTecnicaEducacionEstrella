## 1. Dependencias

- [x] 1.1 Producción en `apps/api`: `express@^5`, `cors`, `helmet`, `zod` y el paquete `shared` del workspace
- [x] 1.2 Desarrollo: `tsx`, `supertest`, `@types/express`, `@types/cors`, `@types/supertest`
- [x] 1.3 Scripts de `apps/api`: `dev` con recarga, `start`, y `test` con Vitest en lugar del `echo` actual
- [x] 1.4 `pnpm peers check` sin conflictos nuevos

## 2. Configuración validada al arrancar

- [x] 2.1 `src/config/env.ts`: esquema Zod con **solo lo que este change usa** — puerto, entorno y orígenes permitidos. Cognito llega en `add-api-auth` y tabla y bucket en `add-application-create`
- [x] 2.2 El esquema se evalúa una vez al importarse y exporta un objeto ya tipado y congelado. Nada de `process.env` fuera de este archivo
- [x] 2.3 Si la validación falla, el mensaje dice **qué variable** falla y por qué, y el proceso termina. Un mensaje genérico obliga a adivinar en el despliegue
- [x] 2.4 Sin valores por defecto que enmascaren una variable ausente en producción. El puerto sí puede tenerlo: solo afecta al desarrollo local
- [x] 2.5 `apps/api/.env.example` con las variables y un comentario apuntando a `scripts/gen-env.sh`

## 3. Errores

- [x] 3.1 `src/errors.ts`: clase base con código de estado y código simbólico, que distinga un fallo previsto de uno inesperado
- [x] 3.2 Solo las subclases que este change usa. Las demás llegan con el endpoint que las lanza
- [x] 3.3 `src/middleware/error-handler.ts`: único punto que construye respuestas de error
- [x] 3.4 Un error previsto responde con su estado y su mensaje; uno inesperado responde 500 con mensaje genérico y **sin traza ni mensaje interno**
- [x] 3.5 El error inesperado se registra en el servidor con su detalle, para que siga siendo diagnosticable
- [x] 3.6 Manejador de ruta desconocida que produce un 404 **con el mismo formato** que el resto de errores

## 4. Aplicación

- [x] 4.1 `src/app.ts`: construye y configura Express, **sin escuchar en ningún puerto**. Es lo que permite probarla sin abrir sockets
- [x] 4.2 `helmet` y `cors` restringido a los orígenes de la configuración
- [x] 4.3 Límite explícito al tamaño del cuerpo JSON: la API nunca recibe archivos, así que aceptar cuerpos grandes solo abre superficie
- [x] 4.4 `src/routes/health.ts`: comprobación de vida que **no** consulta dependencias
- [x] 4.5 Orden del montaje: rutas, luego 404, luego el middleware de errores. Invertirlo lo deja sin efecto
- [x] 4.6 `src/server.ts`: arranque local que importa la app y escucha

## 5. Pruebas

- [x] 5.1 `GET /health` responde con éxito y con la forma esperada
- [x] 5.2 Una ruta inexistente responde 404 **con el formato común**, no con el HTML por omisión de Express
- [x] 5.3 Un manejador que lanza un error inesperado responde 500 genérico, y se comprueba explícitamente que el cuerpo **no** contiene la traza ni el mensaje original
- [x] 5.4 Un manejador asíncrono que rechaza también llega al middleware de errores, sin envoltorios: es la prueba de que Express 5 aporta lo que se esperaba de él
- [x] 5.5 El esquema de configuración rechaza que falte una variable requerida
- [x] 5.6 Verificar que Vitest informa de más de cero pruebas

## 6. Verificación

- [x] 6.1 `pnpm turbo lint typecheck test` en verde en los cuatro paquetes
- [x] 6.2 Arrancar la API en local y comprobar la respuesta de vida con una petición real
- [x] 6.3 Comprobar que arrancar **sin** una variable requerida falla con un mensaje claro
- [x] 6.4 Revisar que `process.env` no aparece fuera de `src/config/env.ts`

## 7. Cierre del change

- [x] 7.1 Escáner de secretos limpio, con atención a que no se cuele `apps/api/.env`
- [x] 7.2 Archivar el change y sincronizar la capability `api-rest`
- [x] 7.3 Cerrar con un único commit: `✨ feat(api): base de la api con errores centralizados`
