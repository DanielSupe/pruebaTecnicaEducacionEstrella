## 1. Contrato compartido

- [x] 1.1 Retirar el tamaño declarado del cuerpo de creación: el cliente solo indica el tipo de contenido. El límite lo impone la política firmada, que no puede alterar
- [x] 1.2 Conservar el esquema que valida el archivo elegido (tipo **y** tamaño): lo usa el navegador para rechazar antes de gastar ancho de banda. Deja de viajar al servidor, no desaparece
- [x] 1.3 Hacer opcional el tamaño del vídeo en la entidad de respuesta: se conoce al confirmar, no antes
- [x] 1.4 Definir el contrato de la respuesta de subida (dirección y campos del formulario), aplazado desde `add-shared-schemas` hasta tener delante lo que devuelve el SDK
- [x] 1.5 Actualizar las pruebas de `shared` que asumían el tamaño declarado

## 2. Dependencias

- [x] 2.1 Añadir a `apps/api`: cliente de DynamoDB con su capa de documentos, cliente de S3, generador de políticas de subida firmadas y generador de identificadores ordenables
- [x] 2.2 Identificador ordenable con librería, **no a mano**: el valor está en ordenar por tiempo de forma lexicográfica, y una versión casera falla en la monotonía dentro del mismo milisegundo
- [x] 2.3 Ampliar el esquema de configuración con el nombre de la tabla y el del bucket
- [x] 2.4 Comprobar que `gen-env.sh` ya los emite y actualizar `.env.example`

## 3. Acceso a datos

- [x] 3.1 `features/applications/repository.ts`: escritura de la solicitud con clave compuesta por identidad del solicitante e identificador ordenable
- [x] 3.2 Marca de expiración alineada con la limpieza del almacenamiento: si los plazos divergen quedan solicitudes apuntando a vídeos inexistentes
- [x] 3.3 Los clientes de AWS se crean **una sola vez** al cargar el módulo, no por petición: en una función sin servidor eso es lo que aprovecha el arranque en caliente
- [x] 3.4 Sin capa de servicios: hoy solo reenviaría llamadas

## 4. Autorización de subida

- [x] 4.1 `features/applications/uploads.ts`: genera la política firmada
- [x] 4.2 La ruta del objeto la construye el **servidor**, con la identidad del token, el identificador de la solicitud y la extensión derivada del tipo de contenido. El nombre del archivo del usuario no cruza
- [x] 4.3 Fijar en la política: la ruta exacta, el tipo de contenido exacto, el rango de tamaño entre 1 byte y el máximo, y la etiqueta de pendiente
- [x] 4.4 La etiqueta viaja como campo obligatorio de la política, de modo que quien sube **no pueda omitirla ni cambiarla**: sin ella la limpieza automática no encontraría nada que borrar
- [x] 4.5 Caducidad de una hora: 200 MB a 2 Mbps son unos 13 minutos, y quince dejan sin margen a una subida lenta
- [x] 4.6 Verificar qué forma exacta espera el SDK para el campo de etiquetado antes de darlo por hecho

## 5. Endpoint

- [x] 5.1 `POST /api/v1/applications` detrás del middleware de autenticación
- [x] 5.2 Validar el cuerpo con el esquema compartido **aunque el navegador ya lo haya validado**: el cliente no es una frontera de confianza
- [x] 5.3 El identificador del solicitante sale del token verificado, nunca del cuerpo
- [x] 5.4 Traducir el fallo de validación a un error con el formato común, indicando qué campo falla
- [x] 5.5 Responder con el identificador de la solicitud, su estado y la autorización de subida

## 6. Permisos

- [x] 6.1 Política de Terraform con lo mínimo: escribir en la tabla, y escribir objeto y etiquetas **solo bajo el prefijo de vídeos**
- [x] 6.2 No adjuntarla a ningún rol todavía: el rol de la función llega con el despliegue
- [x] 6.3 Repasar acción por acción que no sobra ninguna

## 7. Pruebas

- [x] 7.1 Sin autenticación devuelve 401 y **no escribe nada**
- [x] 7.2 Un cuerpo inválido devuelve 400 indicando el campo, y no escribe nada
- [x] 7.3 Un campo desconocido (`userId`, `status`) se rechaza
- [x] 7.4 Un tipo de contenido no permitido se rechaza
- [x] 7.5 Con datos válidos se escribe la solicitud con el identificador **del token**, no el del cuerpo si lo hubiera
- [x] 7.6 La política firmada fija la ruta esperada, el tipo de contenido, el rango de tamaño y la etiqueta de pendiente
- [x] 7.7 La ruta del objeto no se ve afectada por un nombre de archivo con caracteres de ruta
- [x] 7.8 Verificar que Vitest informa de más de cero pruebas

## 8. Verificación contra AWS real

- [x] 8.1 Crear una solicitud con un token real y comprobar que aparece en la tabla con el estado y la marca de expiración correctos
- [x] 8.2 **Subir un archivo de verdad con la política devuelta** y comprobar que el almacenamiento lo acepta
- [x] 8.3 Comprobar que el objeto quedó con la etiqueta de pendiente: es lo que hace funcionar la limpieza de huérfanos
- [x] 8.4 **Intentar subir con la política a una ruta distinta** de la autorizada: debe rechazarse
- [x] 8.5 **Intentar subir un archivo mayor que el máximo**: debe rechazarse, con independencia de lo declarado
- [x] 8.6 **Intentar subir omitiendo la etiqueta**: debe rechazarse
- [x] 8.7 Limpiar la solicitud, el objeto y la cuenta de prueba al terminar

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 9.5 Cerrar con un único commit: `✨ feat(api): creacion de solicitud con subida firmada`
