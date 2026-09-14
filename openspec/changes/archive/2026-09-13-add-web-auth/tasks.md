## 1. Dependencias y configuración

- [x] 1.1 Añadir `aws-amplify` y `sweetalert2` a `apps/web`
- [x] 1.2 Importar **solo** `aws-amplify/auth`, nunca el paquete completo: el resto arrastra módulos que no usamos al paquete final
- [x] 1.3 Ampliar el esquema de configuración con el identificador del User Pool y el del App Client, obligatorios y sin valor por omisión
- [x] 1.4 Comprobar que `gen-env.sh` ya los emite y actualizar `.env.example`
- [x] 1.5 Configurar Amplify una sola vez, al arrancar la aplicación

## 2. Envoltorio de ventanas emergentes

- [x] 2.1 `src/lib/dialogs.ts` con funciones de intención: `confirmar`, `avisarError`, `avisarExito`. Ninguna pantalla llama a la librería directamente
- [x] 2.2 Tematizar con `customClass` y `buttonsStyling: false`, usando las clases del sistema de diseño
- [x] 2.3 Desactivar los iconos animados por omisión: son lo que más delata la librería
- [x] 2.4 En `confirmar`, el foco arranca en cancelar y el botón de confirmación es el destructivo cuando la acción lo es
- [x] 2.5 En `avisarError` desde un formulario, devolver el foco al campo al cerrarse, para que el coste de cerrar y reescribir sea el mínimo

## 3. Estado de sesión

- [x] 3.1 `src/lib/session.ts`: consulta de sesión que resuelve si hay usuario y cuál es su identificador
- [x] 3.2 Exponer la definición de la consulta para que el guardián de rutas la reutilice: **una sola fuente de verdad** para la interfaz y para la protección
- [x] 3.3 Pasar el cliente de consultas por el contexto del router: `beforeLoad` corre **fuera de React** y no puede usar hooks
- [x] 3.4 Invalidar la sesión al entrar y al salir, para que la interfaz reaccione sin recargar

## 4. Interceptor de peticiones

- [x] 4.1 Interceptor asíncrono que obtiene el token **en cada petición** y lo adjunta
- [x] 4.2 **Nunca cachear el token por nuestra cuenta**: es la librería quien decide cuándo renovar, y una copia propia acaba enviando tokens caducados
- [x] 4.3 Si no hay sesión, la petición sale sin cabecera en vez de fallar: las rutas públicas también usan el cliente
- [x] 4.4 Ante un rechazo por credenciales, limpiar la sesión, avisar y llevar a iniciar sesión
- [x] 4.5 **Evitar el bucle de redirección**: si ya se está en una pantalla pública, no redirigir

## 5. Pantallas de acceso

- [x] 5.1 Pantalla de inicio de sesión con correo y contraseña
- [x] 5.2 Pantalla de registro con correo, contraseña y confirmación de contraseña
- [x] 5.3 Validación de los campos con Zod, mostrada **bajo cada campo**: un formato de correo inválido no es un fallo de operación
- [x] 5.4 El fallo de la operación (el directorio rechaza las credenciales) va en **ventana emergente**, según lo decidido
- [x] 5.5 El mensaje de credenciales incorrectas es el mismo tanto si el correo existe como si no: distinguirlo permite averiguar qué correos están dados de alta
- [x] 5.6 Tras registrarse, iniciar sesión llamando al **mismo** camino que usa la pantalla de acceso
- [x] 5.7 Si el registro funciona y el inicio de sesión falla, decir que la cuenta ya existe y que inicie sesión
- [x] 5.8 Durante el envío, el botón se deshabilita y muestra la acción en curso; el formulario no se deshabilita por estar incompleto
- [x] 5.9 Seguir la skill `web-design-system`: el logotipo sobre el formulario, ancho acotado, sin colores fuera de los tokens

## 6. Rutas y cabecera

- [x] 6.1 Guardián en `beforeLoad` que resuelve la sesión **antes** de pintar: mostrar la pantalla privada y retirarla después deja ver un instante lo que no debía verse
- [x] 6.2 La ruta principal pasa a ser privada; acceso y registro quedan públicos
- [x] 6.3 Quien ya tiene sesión y abre el acceso o el registro va a la zona privada
- [x] 6.4 Botón de cierre de sesión en la cabecera, solo visible con sesión iniciada, con confirmación
- [x] 6.5 La comprobación de vida de la API sigue siendo accesible: no la escondas detrás de la sesión

## 7. Pruebas

- [x] 7.1 El esquema de configuración falla si falta cualquiera de las dos variables nuevas
- [x] 7.2 La validación de los formularios rechaza correo mal formado y contraseña corta, con mensajes en español
- [x] 7.3 La confirmación de contraseña detecta que no coincide
- [x] 7.4 El interceptor adjunta la cabecera cuando hay sesión y la omite cuando no
- [x] 7.5 Verificar que Vitest informa de más de cero pruebas

## 8. Verificación contra Cognito real

- [x] 8.1 Registrar una cuenta **desde el navegador** y comprobar que queda dentro sin pasos adicionales
- [x] 8.2 Comprobar en el directorio de usuarios que la cuenta quedó confirmada y con el correo **sin verificar**
- [x] 8.3 Recargar la página y comprobar que la sesión sigue: es el requisito de sesión persistente
- [x] 8.4 **Escribir una ruta privada en la barra de direcciones sin sesión** y comprobar que lleva al acceso sin pintarla
- [x] 8.5 Comprobar en las herramientas del navegador que las peticiones a la API llevan la cabecera de autorización
- [x] 8.6 Cerrar sesión, confirmar, y comprobar que volver atrás exige entrar de nuevo
- [x] 8.7 Intentar entrar con credenciales incorrectas y comprobar el mensaje y que el foco vuelve al campo
- [x] 8.8 Eliminar del directorio la cuenta de prueba al terminar

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio, con atención a que no se cuele ningún token ni contraseña de prueba
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Archivar el change y sincronizar la capability `autenticacion`
- [x] 9.5 Cerrar con un único commit: `✨ feat(web): registro, inicio y cierre de sesion`
