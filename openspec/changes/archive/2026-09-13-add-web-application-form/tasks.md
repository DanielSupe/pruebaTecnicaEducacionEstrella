## 1. Contexto del proyecto

- [x] 1.1 Retirar de `openspec/config.yaml` la librería de formularios que no se usa: ese archivo alimenta el contexto de **todos** los artefactos de OpenSpec, y dejarlo así los haría afirmar algo falso en cada proposal

## 2. Generalizar el hook de formularios

- [x] 2.1 Extraer de `useAuthForm` la parte genérica: validar con Zod, poner los errores bajo cada campo y ejecutar la acción
- [x] 2.2 La traducción de errores de autenticación **se queda** en `features/auth`: es específica de Cognito
- [x] 2.3 Justificación de por qué ahora sí: la regla es no abstraer hasta tener dos usos, y este es el segundo
- [x] 2.4 Las pruebas existentes de los formularios de acceso deben seguir pasando **sin tocarlas**: son la red que demuestra que la extracción no cambió el comportamiento

## 3. Esquema del formulario

- [x] 3.1 Esquema del formulario a partir de `applicationFieldsSchema` de `shared`, más el archivo
- [x] 3.2 El monto llega del campo como texto: convertir **antes** de validar, no con coerción en el esquema. El mismo esquema corre en el servidor, donde aceptar texto relajaría la validación
- [x] 3.3 Validar el archivo con `videoFileSchema`, usando el tipo y el tamaño reales del archivo elegido
- [x] 3.4 Mensajes en español, mostrados **bajo cada campo**

## 4. Componentes

- [x] 4.1 Selector de archivo: muestra el nombre y el tamaño del elegido, con su error debajo. Restringido por `accept` a los formatos permitidos, que es ayuda pero **no validación**
- [x] 4.2 Barra de progreso con el porcentaje, accesible (`role="progressbar"` con sus valores)
- [x] 4.3 Seguir la skill `web-design-system`: ningún color, espaciado ni radio fuera de los tokens

## 5. Flujo de subida

- [x] 5.1 `features/applications/upload.ts` con los tres pasos: registrar, transferir, avisar
- [x] 5.2 **La transferencia NO usa `lib/http.ts`**: ese cliente adjunta el token de acceso, y mandarlo al almacenamiento entregaría nuestras credenciales a un tercero que no las necesita. Instancia desnuda, sin interceptores
- [x] 5.3 Construir el formulario multiparte con los campos de la autorización y **el archivo al final**: el almacenamiento ignora todo lo que venga después
- [x] 5.4 Progreso con el evento de subida de axios
- [x] 5.5 `AbortController` para poder cancelar de verdad, no solo dejar de mostrar el progreso
- [x] 5.6 Distinguir los fallos por paso, para poder decir qué pasó y qué se puede hacer
- [x] 5.7 Reintento: pedir una autorización nueva con `video-url` sobre la **misma** solicitud, porque la anterior pudo caducar

## 6. Pantalla

- [x] 6.1 `routes/NewApplicationPage.tsx` con los cinco campos, el selector y las acciones
- [x] 6.2 Ruta privada nueva en el router, detrás del guardián de sesión
- [x] 6.3 Enlace desde la pantalla de inicio
- [x] 6.4 Durante la subida: progreso visible, acciones deshabilitadas y botón de cancelar
- [x] 6.5 El botón de envío **no** se deshabilita por formulario incompleto: se envía, se valida y se señalan los errores
- [x] 6.6 Al terminar: confirmación y navegación a donde figurarán las solicitudes
- [x] 6.7 Tras un fallo de subida, la pantalla ofrece reintentar conservando lo escrito

## 7. Pruebas

- [x] 7.1 El esquema rechaza cada campo inválido con su mensaje en español
- [x] 7.2 El esquema rechaza un archivo de formato no permitido
- [x] 7.3 El esquema rechaza un archivo por encima del límite, y **acepta uno exactamente en el límite**
- [x] 7.4 El monto se convierte de texto a número antes de validarse; un texto no numérico se rechaza
- [x] 7.5 El flujo de subida llama a los tres pasos **en orden**, y no avisa si la transferencia falló
- [x] 7.6 Al cancelar, no se llama al paso de aviso
- [x] 7.7 El reintento pide autorización nueva y **no** registra otra solicitud
- [x] 7.8 Verificar que Vitest informa de más de cero pruebas

## 8. Verificación en el navegador

- [x] 8.1 Elegir un archivo de formato no permitido → aviso **sin que salga ninguna petición de red**. Comprobarlo en el panel de red, no suponerlo
- [x] 8.2 Elegir un archivo por encima del límite → lo mismo
- [x] 8.3 Enviar el formulario vacío → errores bajo cada campo, ninguna petición
- [x] 8.4 Envío completo con un vídeo real → barra avanzando, y al terminar la solicitud aparece enviada
- [x] 8.5 **Comprobar en S3 que el objeto quedó etiquetado como confirmado** y en la tabla que no quedó plazo de expiración
- [x] 8.6 Cancelar a mitad → comprobar en el panel de red que la petición **se aborta**, no que solo desaparece el progreso
- [x] 8.7 Apagar la API justo después de la transferencia → aviso con reintento, y el reintento completa el envío
- [x] 8.8 **375 px sin desplazamiento horizontal**: la comprobación que quedó pendiente en el change 6 y que aquí ya tiene sentido
- [x] 8.9 Recorrer el formulario entero con el teclado, comprobando que el foco se ve
- [x] 8.10 Limpiar solicitudes, objetos y cuentas de prueba al terminar

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Archivar el change y sincronizar la capability `solicitud-credito`
- [x] 9.5 Cerrar con un único commit: `✨ feat(web): formulario de solicitud con subida de video`
