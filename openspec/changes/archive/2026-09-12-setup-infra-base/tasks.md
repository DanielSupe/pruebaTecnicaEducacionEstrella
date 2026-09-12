## 1. Andamiaje de Terraform

- [x] 1.1 `infra/providers.tf`: `required_version` de Terraform y provider de AWS con versión fijada; `default_tags` con proyecto y gestor, para que todo recurso quede identificable en la factura
- [x] 1.2 `infra/variables.tf`: región, nombre de proyecto, orígenes permitidos para subidas, días de retención de huérfanos, días de retención global y días de retención de registros. Sin literales dispersos
- [x] 1.3 `infra/terraform.tfvars.example` con valores de ejemplo y un comentario que recuerde que el archivo real no se versiona
- [x] 1.4 Comprobar que `terraform.tfvars`, `*.tfstate` y `.terraform/` quedan ignorados y que `.terraform.lock.hcl` **sí** se versiona
- [x] 1.5 `terraform init` y `terraform fmt -check` limpios

## 2. Tabla de solicitudes

- [x] 2.1 Tabla con clave de partición y de ordenación, capacidad provisionada de 25 unidades de lectura y 25 de escritura, y atributo de expiración habilitado
- [x] 2.2 Verificar que no se define ningún índice secundario: no hay caso de uso que lo pida y sería código muerto

## 3. Bucket de videos

- [x] 3.1 Bucket con sufijo aleatorio estable, porque el espacio de nombres de S3 es global
- [x] 3.2 Bloqueo total de acceso público en sus cuatro opciones
- [x] 3.3 Cifrado en reposo con claves gestionadas por S3
- [x] 3.4 Política de bucket que deniega toda petición sin cifrado en tránsito
- [x] 3.5 CORS que permita la subida desde los orígenes de la variable, y solo los métodos necesarios
- [x] 3.6 Regla de ciclo de vida filtrada por la etiqueta de pendiente, para los huérfanos
- [x] 3.7 Segunda regla global como tope de coste frente a la capa gratuita
- [x] 3.8 Sin versionado, por el coste de almacenamiento frente a archivos de 200 MB

## 4. Directorio de usuarios

- [x] 4.1 User Pool con el correo como **nombre de usuario**, nunca como alias: con el correo sin verificar, un alias impediría iniciar sesión siempre
- [x] 4.2 Sin atributos de verificación automática, para que Cognito no envíe correos
- [x] 4.3 Recuperación de cuenta restringida a administrador
- [x] 4.4 Política de contraseñas: longitud mínima 8 con mayúscula, minúscula y dígito, sin símbolo obligatorio
- [x] 4.5 App Client sin secreto, con vigencia corta para el token de acceso y renovación larga para sostener la sesión persistente
- [x] 4.6 Flujos de autenticación restringidos a los que realmente usa el frontend

## 5. Función de pre-registro

- [x] 5.1 Código de la función: confirma al usuario y **no** marca el correo como verificado
- [x] 5.2 Empaquetado con `archive_file`, sin depender de herramientas externas de construcción
- [x] 5.3 Rol de ejecución con permisos únicamente para escribir sus propios registros
- [x] 5.4 Grupo de registros creado explícitamente con retención definida, para que no quede indefinida por omisión
- [x] 5.5 Permiso para que Cognito invoque la función, y enganche del trigger en el User Pool

## 6. Salidas y generación de configuración

- [x] 6.1 `infra/outputs.tf` con nombre de tabla, nombre de bucket, identificadores del User Pool y del App Client, y región
- [x] 6.2 Script que genera los archivos de entorno de `api` y `web` a partir de `terraform output -json`
- [x] 6.3 Verificar que el script no deja ningún valor dentro de un archivo versionado

## 7. Aplicación real contra AWS

- [x] 7.1 `terraform plan` revisado: confirmar que no aparece nada inesperado ni recursos de pago
- [x] 7.2 `terraform apply` y comprobación de que los recursos existen
- [x] 7.3 **Comprobar que el bucket no es público**: intentar leer un objeto sin credenciales debe fallar
- [x] 7.4 **Comprobar el registro end-to-end**: registrar un usuario de prueba con el CLI y verificar que queda confirmado y con el correo sin verificar
- [x] 7.5 **Comprobar que el usuario puede iniciar sesión**: es la prueba de que el correo funciona como nombre de usuario y no como alias
- [x] 7.6 Ejecutar el script de generación de entorno y verificar que produce valores reales
- [x] 7.7 Confirmar en la consola de facturación que el consumo previsto es cero, y anotarlo para el README

## 8. Cierre del change

- [x] 8.1 `pnpm turbo lint typecheck test` en verde (no debería verse afectado, pero se comprueba)
- [x] 8.2 Escáner de secretos limpio, con atención especial a que no se haya colado ningún `.tfvars` ni `.tfstate`
- [x] 8.3 Archivar el change y sincronizar la capability `infraestructura-base`
- [x] 8.4 Cerrar con un único commit: `✨ feat(repo): infraestructura base con terraform`
