# Infraestructura

Terraform para AWS en `us-east-1`, dentro de la capa gratuita.

## Qué hay aquí

| Archivo               | Recurso                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `dynamodb.tf`         | Tabla de solicitudes, capacidad provisionada 25/25 y TTL               |
| `s3.tf`               | Bucket privado de videos: sin acceso público, cifrado, CORS, lifecycle |
| `cognito.tf`          | User Pool y App Client sin secreto                                     |
| `lambda_presignup.tf` | Función que auto-confirma el registro, su rol y sus logs               |
| `lambda_api.tf`       | La API en Lambda, su rol y sus logs                                    |
| `apigateway.tf`       | API HTTP, etapa `$default`, integracion proxy                          |
| `cloudfront.tf`       | Bucket del SPA, distribucion, cabeceras de seguridad                   |
| `acm.tf`              | Certificado del dominio propio (opcional)                              |
| `outputs.tf`          | Identificadores que consumen `api`, `web` y los scripts                |

## Uso

```bash
cd infra
terraform init
terraform plan
terraform apply
```

Después, desde la raíz del repositorio:

```bash
bash scripts/gen-env.sh
```

Ese script genera `apps/api/.env` y `apps/web/.env` a partir de `terraform output`.
**No transcribas los identificadores a mano**: son la única fuente de verdad y copiarlos
mal cuesta más tiempo del que ahorra.

Para publicar el frontend, desde la raíz y **después** de aplicar:

```bash
bash scripts/deploy-web.sh
```

### Dominio propio

Es opcional. `web_domain` vacío significa "sin dominio propio" y todo funciona con el
que genera la distribución. Con dominio, el certificado se pide solo pero **el registro
DNS de validación se añade a mano**, porque la zona vive en el registrador. La salida
`certificate_validation_record` dice exactamente qué registro poner.

Ese registro **no se borra** después de emitir: el certificador lo vuelve a consultar
para renovar automáticamente.

## Qué no se versiona

`terraform.tfstate`, `*.tfvars`, `tfplan` y `.terraform/` están en `.gitignore`. El estado
y los planes guardados contienen los valores de todos los recursos en texto plano.

`.terraform.lock.hcl` **sí** se versiona: fija las versiones de los providers.

## Limitaciones conocidas

- **El estado vive en local.** Si se pierde el archivo, Terraform deja de conocer los
  recursos y hay que eliminarlos a mano desde la consola. Con más tiempo: backend en S3
  con bloqueo nativo. Se eligió local porque un backend remoto exige crear antes el bucket
  que lo aloja, fuera de este mismo Terraform.
- **El registro auto-confirma sin verificar el correo.** Todos los datos son ficticios. En
  producción se mantendría la verificación y se añadiría protección contra registros
  abusivos.
- **El tope de concurrencia de la API es de cuenta, no por función.** Esta cuenta tiene un
  límite total de 10 ejecuciones simultáneas y AWS exige dejar 10 sin reservar, así que
  reservar capacidad es imposible. La variable existe y funciona en una cuenta normal.

La lista completa de limitaciones del proyecto está en el [README de la raíz](../README.md).

## Limpieza

Al terminar la prueba:

```bash
cd infra && terraform destroy
```

El bucket de videos solo se destruye con contenido si `videos_bucket_force_destroy` está
activado. El valor por omisión es `false`, que es el correcto para cualquier entorno real.

Y elimina también el usuario IAM que se creó para ejecutar Terraform.
