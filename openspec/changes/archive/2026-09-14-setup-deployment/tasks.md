## 1. Adaptador de Lambda

- [x] 1.1 `apps/api/src/lambda.ts`: envuelve la aplicación que ya construye `createApp`
- [x] 1.2 La configuración y las claves de verificación se resuelven en el **ámbito del módulo**,
      no dentro del manejador: así se pagan una vez por contenedor y no una vez por petición
- [x] 1.3 El manejador espera esa inicialización antes de atender la primera petición
- [x] 1.4 Si la inicialización falla, la función falla de forma visible. No se atiende tráfico
      que estamos condenados a rechazar
- [x] 1.5 **No se toca `createApp`**: estaba separado de `listen` desde el change 4 justamente
      para esto. Si hiciera falta cambiarlo, la separación no servía

## 2. Empaquetado

- [x] 2.1 esbuild a un solo archivo, destino `infra/build/`
- [x] 2.2 `archive_file` sobre la salida, el mismo patrón del trigger de registro
- [x] 2.3 Comprobar que el paquete **no contiene ningún `.env`** ni valores de configuración

## 3. API en la nube

- [x] 3.1 Lambda Node 22 con su rol, su grupo de trazas y la retención ya declarada
- [x] 3.2 Adjuntar la política de permisos mínimos de `iam_api.tf`, que existe desde el change 9
      y todavía no está atada a ningún rol
- [x] 3.3 Variables de entorno desde las salidas de Terraform. Ninguna escrita a mano
- [x] 3.4 Concurrencia reservada como tope de gasto y de radio de impacto. **La cuenta no lo
      permite**: limite total de 10 y AWS exige dejar 10 sin reservar, así que reservar es
      imposible aquí. El mecanismo queda declarado por variable y el tope lo pone la cuenta. El
      requisito se ajustó para decir lo que se puede cumplir
- [x] 3.5 API HTTP de API Gateway, etapa `$default`, integración proxy con formato de carga 2.0
- [x] 3.6 **Sin `cors_configuration`**: el navegador solo habla con la distribución
- [x] 3.7 Sin prefijo de etapa en la ruta, `/api/v1/...` llega tal cual a Express, sin reescrituras

## 4. Distribución

- [x] 4.1 Bucket del SPA, privado, con bloqueo de acceso público
- [x] 4.2 Distribución con acceso de origen restringido hacia ese bucket
- [x] 4.3 Comportamiento por defecto → el SPA
- [x] 4.4 Comportamiento `/api/*` → API Gateway, **sin caché** y **reenviando todo menos el
      anfitrión**. Las dos cosas son obligatorias: cachear serviría la solicitud de una persona a
      otra, y reenviar el anfitrión hace que la puerta de enlace responda 403
- [x] 4.5 Comprobar que la cabecera de autorización llega hasta la API. Sin ella no funciona nada
- [x] 4.6 Respuestas de error 403 y 404 → `/index.html` con estado 200, para las rutas del cliente
- [x] 4.7 Añadir el dominio de la distribución al CORS del bucket de vídeos: la subida firmada
      sigue yendo directa al almacenamiento

## 5. Cabeceras de seguridad

- [x] 5.1 Política de cabeceras de respuesta con CSP, HSTS, `X-Content-Type-Options` y
      `Referrer-Policy`
- [x] 5.2 `default-src 'none'` y no `'self'`: obliga a que toda directiva sea explícita, así que
      lo que falte salta en la consola en lugar de pasar desapercibido
- [x] 5.3 `script-src 'self'` **sin `unsafe-inline`**. Esta es la directiva que sostiene la
      decisión de guardar los tokens en el navegador
- [x] 5.4 `style-src` sí necesita `'unsafe-inline'`: la librería de ventanas emergentes inyecta
      su hoja en tiempo de ejecución y la barra de progreso usa un atributo de estilo. Dejarlo
      **documentado como concesión**, no escondido
- [x] 5.5 `connect-src` con el origen propio, el directorio de usuarios y el almacenamiento
- [x] 5.6 `media-src` con el almacenamiento: la reproducción es un elemento de vídeo, que CSP
      gobierna con otra directiva. Olvidarlo rompe justo lo del change 12
- [x] 5.7 **Confirmar la forma real del host del almacenamiento** en la URL firmada, en lugar de
      suponerla: el firmador puede emitir dos y la política distingue entre ellas
- [x] 5.8 HSTS sin precarga: el dominio por omisión de la distribución es compartido

## 6. Configuración del frontend

- [x] 6.1 La dirección de la API acepta absoluta con protocolo **o** ruta desde la raíz
- [x] 6.2 Sigue rechazando una absoluta sin protocolo, que es el error más común
- [x] 6.3 Rechaza una ruta relativa que no parta de la raíz
- [x] 6.4 Pruebas de los cuatro casos
- [x] 6.5 Comprobar que la construcción **falla** si falta una variable; verificar el código de
      salida, no la apariencia del mensaje

## 7. Publicación

- [x] 7.1 `scripts/deploy-web.sh`: construir, sincronizar e invalidar
- [x] 7.2 Los valores salen de las salidas de Terraform, ninguno escrito a mano
- [x] 7.3 Los archivos con huella en el nombre se cachean largo; `index.html` **nunca**
- [x] 7.4 Documentar el orden: aplicar la infraestructura, luego publicar el frontend

## 8. Verificación

**Primer hito, antes que nada:**

- [x] 8.1 `/api/v1/health` responde por el dominio de la distribución. Si esto no responde, el
      resto no importa; y si se atasca, se pasa al plan de repliegue en lugar de insistir

Después:

- [x] 8.2 Flujo completo desde la dirección pública: registro, acceso, solicitud, subida, listado
      y reproducción
- [x] 8.3 **Consola del navegador sin una sola violación de la política**, recorriendo todo el
      flujo. Que la página cargue no demuestra que la política esté bien
- [x] 8.4 Recargar en una ruta del cliente devuelve la aplicación, no un 404
- [x] 8.5 El bucket del SPA no se puede leer directamente
- [x] 8.6 Las cabeceras de seguridad llegan de verdad al navegador
- [x] 8.7 Una petición autenticada funciona: la cabecera de autorización sobrevivió al borde
- [x] 8.8 El vídeo se reproduce desde la dirección pública, con la política puesta
- [ ] 8.9 ~~`terraform destroy` seguido de `terraform apply`~~ → **NO ejecutado**. Destruiría la
      URL que es el entregable 2 y que debe seguir viva, y borrar una distribución de CloudFront
      lleva cerca de veinte minutos. En su lugar: `terraform plan -detailed-exitcode` devuelve 0,
      o sea que el estado coincide con lo declarado y nada se hizo a mano. Es una garantía más
      débil y conviene decirlo
- [x] 8.10 Crear el usuario de prueba del entregable 2 y comprobar que entra
- [x] 8.11 Limpiar los datos de prueba, conservando el usuario del evaluador. Se conserva
      también una solicitud de ejemplo suya: ver el flujo terminado dice más que una lista vacía

## 9. Cierre del change

- [x] 9.1 `pnpm turbo lint typecheck test` en verde
- [x] 9.2 Escáner de secretos limpio
- [x] 9.3 Anotar en las notas del AI-LOG lo que haya aparecido al implementar
- [x] 9.4 Anotar para el README: acceso directo a la API sin restringir, `unsafe-inline` en
      estilos, y el dominio por omisión sin certificado propio
- [x] 9.5 Archivar el change y sincronizar las capabilities
- [x] 9.6 Cerrar con un único commit: `✨ feat(repo): despliegue en aws con cloudfront y lambda`
