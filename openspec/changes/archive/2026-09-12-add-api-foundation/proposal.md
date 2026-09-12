## Why

Los cuatro endpoints de solicitudes y el middleware de autenticación necesitan un sitio donde
vivir, y ese sitio impone decisiones que después son caras de cambiar: cómo se ve un error,
cuándo falla la aplicación si está mal configurada, y quién decide el formato de la respuesta.

Escribir esa base ahora, cuando solo hay un endpoint trivial, permite probarla de verdad. Si se
improvisa al añadir el primer endpoint real, el manejo de errores acaba repartido por los
handlers y cada uno responde a su manera.

## What Changes

- `apps/api` pasa de esqueleto a una API REST que se ejecuta y se prueba:
  - Aplicación Express separada de su arranque, de modo que las pruebas la ejerciten sin abrir
    un puerto.
  - **Configuración validada al arrancar**: si falta o está mal una variable de entorno, el
    proceso no levanta.
  - **Middleware central de errores**: único responsable del formato de las respuestas de error.
    Ningún handler formatea las suyas.
  - Clases de error propias para distinguir un fallo previsto de uno inesperado.
  - Endpoint de estado y respuesta 404 consistente para rutas desconocidas.
  - Cabeceras de seguridad y CORS restringido por configuración.
- Vitest y Supertest, con pruebas que ejercitan la aplicación real.

## Capabilities

### New Capabilities

- `api-rest`: el contrato transversal de la API — cómo responde ante un error, qué garantiza al
  arrancar y cómo se comprueba que está viva. Los changes de autenticación y de solicitudes lo
  amplían en lugar de reinventarlo.

### Modified Capabilities

Ninguna.

## Alternativas descartadas

- **Express 4.** Obligaría a envolver cada handler asíncrono o a añadir `express-async-errors`:
  en Express 4 una promesa rechazada no llega al middleware de errores y la petición se queda
  colgada hasta agotar el tiempo. Express 5 lo resuelve de raíz y elimina una clase entera de
  fallos silenciosos.
- **Ejecutar TypeScript con el soporte nativo de Node.** Ya funciona sin flags en la versión que
  usamos, pero exige escribir la extensión `.ts` en cada import, lo que rompería el estilo que
  ya usa `packages/shared` y que el empaquetador entenderá después. Una dependencia de
  desarrollo a cambio de un único estilo de import en todo el monorepo.
- **Leer las variables de entorno allí donde se usan.** Reparte `process.env` por el código y
  convierte un fallo de configuración en un error en tiempo de ejecución, a mitad de una
  petición, en lugar de una negativa a arrancar.
- **Un endpoint de estado que compruebe DynamoDB y Cognito.** Convertiría una lentitud de una
  dependencia en "el servicio está caído" y provocaría reinicios en cascada. Comprueba que el
  proceso vive, que es lo que la pregunta significa.
- **Una librería de registro estructurado.** Aporta consultas que nadie va a hacer en una prueba
  técnica. El middleware de errores registra lo inesperado y eso basta.
- **Definir ya toda la taxonomía de errores y todas las variables de entorno.** Serían
  decisiones sin uso que aún pueden cambiar. Cada change añade las suyas.

## Desviación consciente del roadmap

El empaquetado con esbuild y el adaptador de Lambda se mueven al change de despliegue. Las
dependencias que de verdad pueden complicar un empaquetado —el verificador de tokens y el SDK de
AWS— llegan en los dos changes siguientes: comprobar hoy que se empaqueta una aplicación que aún
no las tiene sería una prueba vacía.

## Requisitos del enunciado que cubre

- **4.2**: el backend se expone como API REST.
- **3.2**: la base sobre la que se apoya la validación en servidor.
- **Sección 7, "Backend y manejo de archivos"**: manejo de errores coherente y explícito.
- **Sección 7, "Seguridad"**: un error inesperado no revela detalles internos.

## Impact

- `apps/api/`: código fuente, dependencias y scripts.
- Sin cambios en infraestructura ni en el frontend.
- Desbloquea `add-api-auth` y, tras él, todos los endpoints de solicitudes.
