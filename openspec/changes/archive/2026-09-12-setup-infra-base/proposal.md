## Why

El riesgo de calendario más caro de esta prueba es descubrir un problema de permisos, de IAM o
de configuración de Cognito el último día. Adelantar la infraestructura base convierte ese
riesgo en algo que se resuelve hoy, con margen, en lugar de la víspera de la entrega.

Además hay una dependencia dura: `add-api-auth` necesita un User Pool real contra el que
verificar tokens, y `add-web-auth` necesita poder registrar usuarios. Sin este change, el
ciclo 1 del roadmap no puede cerrarse.

## What Changes

- `infra/` pasa de un README a contener Terraform aplicable:
  - **DynamoDB**: tabla de solicitudes con clave compuesta, capacidad provisionada dentro de
    la capa siempre gratuita, y TTL.
  - **S3 de videos**: Block Public Access, cifrado en reposo, CORS restringido, dos reglas de
    ciclo de vida y una política que rechaza el tráfico sin cifrar.
  - **Cognito**: User Pool con el correo como nombre de usuario, App Client sin secreto y
    trigger de pre-registro que confirma al usuario sin verificar el correo.
  - **Lambda del trigger** con su rol de mínimo privilegio y su grupo de logs con retención.
- Outputs con los identificadores que consumirán `api` y `web`, más un script que genera los
  archivos de entorno a partir de ellos.
- `terraform.tfvars.example` como plantilla; el archivo real nunca se versiona.
- Se ejecuta un `terraform apply` real: el change no se da por cerrado hasta que los recursos
  existen en la cuenta.

## Capabilities

### New Capabilities

- `infraestructura-base`: qué recursos sostienen la aplicación y con qué garantías de
  seguridad, retención y coste.

### Modified Capabilities

Ninguna.

## Alternativas descartadas

- **Estado de Terraform en S3.** Es lo que se haría en equipo, pero exige crear antes el bucket
  de estado fuera de este Terraform: un bootstrap manual que añade tiempo al change más largo
  del roadmap. Con un solo desarrollador el estado local es proporcionado. Se documenta como
  limitación conocida, junto a lo que se haría con más tiempo.
- **Dividir la infraestructura en dos estados** (base y despliegue). Aislaría mejor, pero
  obligaría a pasar valores entre estados con `remote_state` o `data sources`. Un único estado
  al que `setup-deployment` añade archivos es más simple y no pierde nada a esta escala.
- **Módulos de Terraform.** Con una tabla, un bucket, un User Pool y una función no hay dos
  usos que justifiquen la abstracción.
- **Verificación de correo real en Cognito.** Obligaría a que le llegue un correo al evaluador
  el día de la demo, con el tope de 50 envíos diarios del emisor por defecto. Como todos los
  datos son ficticios, se auto-confirma sin marcar el correo como verificado, que es más honesto
  que fingir una verificación que nadie hizo.
- **Crear los usuarios solo por administrador.** Evitaría el trigger, pero incumple el
  requisito 3.1, que pide registro del solicitante.
- **Versionado de objetos en S3.** Duplicaría el almacenamiento de archivos de hasta 200 MB
  contra un Free Tier de 5 GB, sin aportar nada a este caso de uso.

## Desviación consciente del roadmap

El trigger de pre-registro **es** una función Lambda, y el roadmap situaba Lambda en el change
de despliegue. Se adelanta aquí porque Cognito no ofrece forma declarativa de auto-confirmar:
sin el trigger, el registro deja usuarios inutilizables y los changes 7, 10 y 12 no se pueden
probar contra Cognito. Es una función de una decena de líneas, sin relación con la API ni con
API Gateway.

## Requisitos del enunciado que cubre

- **3.1**: el User Pool y su App Client sostienen registro, inicio de sesión y sesión
  persistente.
- **4.3**: todo en AWS dentro del Free Tier, en `us-east-1`, con los videos en S3 y **no
  públicos**; persistencia en DynamoDB; infraestructura como código, que el enunciado valora.
- **Sección 8**: ningún bucket con acceso público y ningún secreto versionado.

## Impact

- `infra/`: archivos de Terraform, plantilla de variables y script de generación de entorno.
- **Crea recursos reales en AWS, con coste cero.** Todos los recursos caen dentro de la capa
  siempre gratuita, incluida la tabla: el enunciado pide explícitamente no incurrir en costos.
- Desbloquea `add-api-auth` y `add-web-auth`, y con ellos el primer ciclo end-to-end.
