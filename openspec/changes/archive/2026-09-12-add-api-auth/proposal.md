## Why

Sin esto, cualquiera podría crear y listar solicitudes ajenas. El enunciado pide ruta protegida
(3.1) y la seguridad pesa un 20% de la evaluación.

Va antes que los endpoints de solicitudes a propósito: si se añadiera después, habría que volver
a tocar cada endpoint para protegerlo, y protegerlos "luego" es como se olvida uno.

## What Changes

- Middleware que verifica el token de acceso emitido por Cognito y expone la identidad del
  solicitante a los manejadores que van detrás.
- Las variables del directorio de usuarios se incorporan al esquema de configuración, que sigue
  creciendo con cada change en lugar de anticipar variables sin uso.
- Nueva clase de error para la falta de credenciales válidas, que responde por el manejador
  central ya existente.
- Las claves públicas de verificación se obtienen al arrancar, no en la primera petición.
- Pruebas del comportamiento del middleware y comprobación contra el directorio real.

## Capabilities

### New Capabilities

- `autenticacion`: quién puede llamar a la API, cómo se prueba la identidad de quien llama y de
  dónde sale el identificador del usuario.

### Modified Capabilities

Ninguna. `api-rest` no cambia: el 401 usa el formato de error que esa capability ya define.

## Alternativas descartadas

- **Verificar solo la firma del token.** Es el error más fácil de cometer aquí. Un token firmado
  por el mismo directorio de usuarios pero emitido para otro cliente es criptográficamente
  válido: comprobar la firma responde "¿este token es auténtico?", cuando la pregunta es "¿este
  token es **para mí**?". Se verifica también el cliente al que se emitió y que sea un token de
  acceso.
- **Usar el token de identidad en lugar del de acceso.** El de identidad describe al usuario
  para el propio cliente; el de acceso autoriza a llamar a un recurso. Además se comprobó en el
  change de infraestructura que el de acceso no incluye el correo, lo que confirma que la
  identidad que interesa al servidor es el identificador, no los datos de perfil.
- **Aplicar el middleware a toda la aplicación.** Dejaría la comprobación de vida detrás de
  autenticación, y una comprobación de vida que exige credenciales no sirve para lo que existe.
  Se aplica por grupo de rutas.
- **Implementar la verificación a mano con una librería genérica de JWT.** Habría que resolver
  la obtención y rotación de claves públicas, la caché y la selección de clave por identificador.
  Es código de seguridad delicado y ya resuelto por la librería oficial, que además no arrastra
  dependencias.
- **Obtener las claves de forma perezosa.** Un directorio mal configurado no daría la cara hasta
  que alguien intentara autenticarse. Obtenerlas al arrancar es coherente con validar la
  configuración al arrancar: el precio es que el arranque pasa a requerir red.
- **Confiar en que el cliente diga quién es.** El identificador sale siempre del token
  verificado. Aceptarlo del cuerpo permitiría actuar en nombre de cualquiera.

## Requisitos del enunciado que cubre

- **3.1**: sin sesión válida no se accede a los recursos protegidos.
- **Sección 7, "Seguridad"**: protección de rutas y no exposición de datos ajenos.
- **Sección 8**: evita confiar en el cliente para determinar la identidad.

## Impact

- `apps/api/`: middleware, configuración y una clase de error nuevos.
- Sin cambios en infraestructura: el directorio de usuarios ya existe y está verificado.
- Desbloquea todos los endpoints de solicitudes, que nacen ya protegidos.
