## 1. Contrato compartido

- [x] 1.1 Esquema de la respuesta paginada: las solicitudes y un puntero de continuación opcional
- [x] 1.2 El puntero es opaco para el cliente: una cadena que se devuelve tal cual, sin que el navegador tenga que entender su contenido
- [x] 1.3 Esquema de los parámetros de consulta, con límite acotado y valor por omisión

## 2. Consulta en el repositorio

- [x] 2.1 `listApplications(userId, opciones)` con consulta **por clave de partición**, nunca recorriendo la tabla
- [x] 2.2 Orden descendente: el identificador de la clave de ordenación ya ordena por tiempo, así que no hay que ordenar en memoria ni crear un índice
- [x] 2.3 Límite por petición y traducción del puntero del almacenamiento a una cadena que se pueda enviar en una URL
- [x] 2.4 **La clave de partición se construye siempre con la identidad recibida**, nunca con nada que venga del puntero: es lo que impide leer la partición de otro aunque lo manipulen
- [x] 2.5 Un puntero ilegible se trata como ausencia de puntero, no como un error del servidor

## 3. Endpoint

- [x] 3.1 `GET /api/v1/applications` detrás del middleware de autenticación
- [x] 3.2 Validar los parámetros de consulta con el esquema compartido; un límite fuera de rango se rechaza
- [x] 3.3 La identidad sale del token verificado; un identificador de usuario en la petición se ignora
- [x] 3.4 Reutilizar `sinClaveInterna` para no exponer la ruta del objeto en ninguna de las solicitudes
- [x] 3.5 Sin solicitudes, devolver una lista vacía con éxito: no tener ninguna es un estado normal, no un error

## 4. Permisos

- [x] 4.1 Añadir la acción de consulta a la política existente
- [x] 4.2 Repasar que no sobra ninguna acción

## 5. Pruebas

- [x] 5.1 Sin autenticación devuelve 401 y no consulta nada
- [x] 5.2 Devuelve las solicitudes del usuario **del token**, no de otro que venga en la petición
- [x] 5.3 Sin solicitudes, lista vacía y éxito
- [x] 5.4 Se consulta en orden descendente: comprobar el parámetro de orden, no solo que devuelva algo
- [x] 5.5 Con más resultados de los que caben, se devuelve puntero; sin más, no se devuelve
- [x] 5.6 Un límite fuera de rango se rechaza
- [x] 5.7 Un puntero ilegible no revienta: se trata como primera página
- [x] 5.8 Ninguna solicitud devuelta incluye la ruta del objeto
- [x] 5.9 Verificar que Vitest informa de más de cero pruebas

## 6. Verificación contra AWS real

- [x] 6.1 Crear varias solicitudes y comprobar que llegan **de más reciente a más antigua**
- [x] 6.2 **Con una segunda cuenta: no aparece ni una sola solicitud de la primera.** Es la comprobación que importa y no se puede sustituir por un test con dobles
- [x] 6.3 **Tomar el puntero de la primera cuenta y usarlo autenticado como la segunda**: no debe devolver solicitudes ajenas. Es el riesgo que conviene verificar en lugar de razonar
- [x] 6.4 Con un límite bajo, recorrer las páginas y comprobar que no se repite ni se pierde ninguna
- [x] 6.5 Comprobar en la respuesta que no viaja la ruta del objeto
- [x] 6.6 Comprobar que una solicitud pendiente de vídeo **también aparece**: es lo que permitirá reintentar su subida desde el listado
- [x] 6.7 Limpiar solicitudes, objetos y cuentas de prueba al terminar

## 7. Cierre del change

- [x] 7.1 `pnpm turbo lint typecheck test` en verde
- [x] 7.2 Escáner de secretos limpio
- [x] 7.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 7.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 7.5 Cerrar con un único commit: `✨ feat(api): listado paginado de solicitudes`
