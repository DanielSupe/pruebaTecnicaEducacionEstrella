# Infraestructura

Terraform para AWS en `us-east-1`, dentro de la capa gratuita.

## Qué hay aquí

| Archivo               | Recurso                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `dynamodb.tf`         | Tabla de solicitudes, capacidad provisionada 25/25 y TTL               |
| `s3.tf`               | Bucket privado de videos: sin acceso público, cifrado, CORS, lifecycle |
| `cognito.tf`          | User Pool y App Client sin secreto                                     |
| `lambda_presignup.tf` | Función que auto-confirma el registro, su rol y sus logs               |
| `outputs.tf`          | Identificadores que consumen `api` y `web`                             |

Lambda de la API, API Gateway y CloudFront llegan en el change `setup-deployment`.

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

## Limpieza

Al terminar la prueba:

```bash
cd infra && terraform destroy
```

Y elimina también el usuario IAM que se creó para ejecutar Terraform.
