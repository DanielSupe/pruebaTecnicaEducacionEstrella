## 1. Dependencias y configuración

- [x] 1.1 Añadir `aws-jwt-verify` a `apps/api`. Cero dependencias propias, lo que importa para el empaquetado del change de despliegue
- [x] 1.2 Ampliar el esquema de configuración con el identificador del User Pool y el del App Client. Ambos obligatorios y **sin valor por omisión**: un default aquí significaría verificar contra el directorio equivocado sin enterarse
- [x] 1.3 Comprobar que `scripts/gen-env.sh` ya emite ambas variables (las emite desde el change de infraestructura) y que el `.env.example` las refleja
- [x] 1.4 Verificar que sigue sin haber `process.env` fuera de `src/config/env.ts`

## 2. Error de autorización

- [x] 2.1 `UnauthorizedError` (401) en `src/errors.ts`, junto a la base que ya existe
- [x] 2.2 El mensaje es genérico y **no distingue** entre token ausente, caducado, manipulado o de otro cliente. Detallar el motivo ayuda a quien está probando tokens, no al usuario legítimo
- [x] 2.3 Confirmar que el 401 sale por el manejador central y no por el middleware: el formato de error lo decide un solo sitio

## 3. Middleware de autenticación

- [x] 3.1 Crear el verificador con `tokenUse: "access"` y el identificador del App Client. **Verificar solo la firma no basta**: un token del mismo directorio emitido para otro cliente es criptográficamente válido
- [x] 3.2 El verificador se **inyecta como parámetro** al middleware, igual que la configuración a `createApp`. Es lo que permite probarlo sin red ni credenciales
- [x] 3.3 Extraer el token de la cabecera de autorización, aceptando solo el esquema esperado
- [x] 3.4 Exponer la identidad a los manejadores posteriores, con el identificador tomado del token verificado
- [x] 3.5 Tipar esa identidad para que los manejadores no tengan que suponerla
- [x] 3.6 Cualquier fallo de verificación se traduce a `UnauthorizedError`. El error original se registra en el servidor pero **no viaja al cliente**

## 4. Montaje

- [x] 4.1 `createApp` acepta el verificador además de la configuración
- [x] 4.2 Montar una ruta protegida de ejemplo que devuelva la identidad, para que este change sea demostrable por sí solo y las pruebas tengan algo que ejercitar
- [x] 4.3 **La comprobación de vida sigue pública**: el middleware se aplica por grupo de rutas, nunca con `app.use` global
- [x] 4.4 Precargar las claves públicas al arrancar en `server.ts`, y abortar con un mensaje claro si no se pueden obtener
- [x] 4.5 Las pruebas **no** precargan claves: reciben un verificador simulado, así que no tocan la red

## 5. Pruebas

- [x] 5.1 Petición sin cabecera de autorización a la ruta protegida devuelve 401 con el formato común
- [x] 5.2 Cabecera con esquema incorrecto devuelve 401
- [x] 5.3 Token que el verificador rechaza devuelve 401, y se comprueba que el cuerpo **no revela el motivo** ni el mensaje interno
- [x] 5.4 Token válido deja pasar y la identidad expuesta coincide con la del token
- [x] 5.5 Un identificador de usuario enviado en el cuerpo **se ignora**: la identidad sigue siendo la del token
- [x] 5.6 La comprobación de vida responde con éxito **sin** cabecera de autorización
- [x] 5.7 El esquema de configuración falla si falta cualquiera de las dos variables nuevas

## 6. Verificación contra Cognito real

- [x] 6.1 Registrar un usuario de prueba con el CLI y obtener un token de acceso real
- [x] 6.2 Arrancar la API y llamar a la ruta protegida **con ese token real**: debe pasar y devolver el identificador correcto
- [x] 6.3 Llamar con el token manipulado: debe devolver 401
- [x] 6.4 Llamar con el **token de identidad** en lugar del de acceso: debe devolver 401. Es la comprobación de que `tokenUse` está bien configurado, que los tests simulados no cubren
- [x] 6.5 Arrancar con un identificador de User Pool inexistente: el proceso debe negarse a arrancar
- [x] 6.6 Eliminar el usuario de prueba al terminar

## 7. Cierre del change

- [x] 7.1 `pnpm turbo lint typecheck test` en verde
- [x] 7.2 Escáner de secretos limpio, con atención a que no se cuele ningún token en el código ni en los artefactos
- [x] 7.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 7.4 Archivar el change y sincronizar la capability `autenticacion`
- [x] 7.5 Cerrar con un único commit: `✨ feat(api): verificacion de tokens de cognito`
