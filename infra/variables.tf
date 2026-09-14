variable "aws_region" {
  description = "Region donde se crea toda la infraestructura."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo con el que se nombran y etiquetan todos los recursos."
  type        = string
  default     = "educacion-estrella"
}

variable "allowed_upload_origins" {
  description = <<-EOT
    Origenes desde los que el navegador puede subir videos directamente al bucket.
    En desarrollo es el servidor de Vite; el change setup-deployment anade aqui el
    dominio de CloudFront. Es una variable y no un literal precisamente para que
    nadie tenga que editar el recurso cuando ese dominio exista.
  EOT
  type        = list(string)
  default     = ["http://localhost:5173"]
}

variable "dynamodb_read_capacity" {
  description = <<-EOT
    Unidades de lectura provisionadas. 25 es exactamente lo que cubre la capa
    siempre gratuita de AWS. Subir este valor deja de ser gratis.
  EOT
  type        = number
  default     = 25
}

variable "dynamodb_write_capacity" {
  description = "Unidades de escritura provisionadas. Ver la nota de lectura: 25 es el limite gratuito."
  type        = number
  default     = 25
}

variable "orphan_video_retention_days" {
  description = <<-EOT
    Dias que sobrevive un video subido pero nunca confirmado. El ciclo de vida de S3
    se evalua una vez al dia, asi que el minimo util es 1 y el borrado es eventual.
  EOT
  type        = number
  default     = 7
}

variable "video_max_retention_days" {
  description = "Tope de retencion de cualquier video. Acota el consumo de los 5 GB de la capa gratuita."
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "Retencion de los grupos de logs. Sin esto la retencion por omision es indefinida y crece sin control."
  type        = number
  default     = 14
}

# Tope de ejecuciones simultaneas de la API: limita el gasto y el radio de impacto
# de una funcion que cualquiera puede invocar.
#
# El valor por omision es -1, que significa "sin reserva propia", y NO es dejadez:
# esta cuenta tiene un limite TOTAL de 10 ejecuciones simultaneas, y AWS exige
# dejar al menos 10 sin reservar. Reservar cualquier cantidad es literalmente
# imposible aqui. El limite de la cuenta ya actua como tope.
#
# En una cuenta con el limite habitual de 1000, esto se pone en un numero concreto
# y entonces el tope es por funcion, que es lo deseable: asi un abuso de la API no
# consume la capacidad del resto de funciones.
variable "api_reserved_concurrency" {
  description = "Ejecuciones simultaneas reservadas para la API. -1 desactiva la reserva."
  type        = number
  default     = -1
}

# El valor por omision es el correcto para cualquier entorno real: un bucket no
# deberia poder destruirse con contenido dentro por descuido. Este entorno, que es
# desechable y vive semanas, opta por salirse en su archivo de variables.
variable "videos_bucket_force_destroy" {
  description = "Permitir destruir el bucket de videos aunque conserve objetos."
  type        = bool
  default     = false
}

# Dominio propio para servir la aplicacion. Vacio significa "sin dominio propio":
# se usa el que genera la distribucion y todo funciona igual.
#
# Es opcional a proposito. Quien clone este repositorio no tiene por que poseer un
# dominio, y exigirselo convertiria el despliegue en algo que solo su autor puede
# reproducir.
variable "web_domain" {
  description = "Subdominio propio para la aplicacion. Vacio para usar el dominio de la distribucion."
  type        = string
  default     = ""

  validation {
    # El vertice de un dominio no admite CNAME: lo prohibe la especificacion del
    # DNS, porque ahi conviven los registros de autoridad. Haria falta un registro
    # ALIAS, que es una extension propietaria que la mayoria de registradores no
    # ofrece. Se exige un subdominio para no fallar a mitad del despliegue.
    condition     = var.web_domain == "" || length(split(".", var.web_domain)) >= 3
    error_message = "web_domain debe ser un subdominio (app.ejemplo.com), no el dominio raiz."
  }
}
