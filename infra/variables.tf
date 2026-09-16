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

# The default of -1 means "no reservation of its own", and it is not neglect: this
# account has a TOTAL limit of 10 concurrent executions and AWS requires leaving at
# least 10 unreserved, so reserving any amount is impossible here. The account
# limit already acts as the cap.
#
# On an account with the usual limit this takes a concrete number, and then the cap
# is per function, which is what you want.
variable "api_reserved_concurrency" {
  description = "Ejecuciones simultaneas reservadas para la API. -1 desactiva la reserva."
  type        = number
  default     = -1
}

# The default is the right one for any real environment. This environment, which is
# disposable, opts out in its own variables file.
variable "videos_bucket_force_destroy" {
  description = "Permitir destruir el bucket de videos aunque conserve objetos."
  type        = bool
  default     = false
}

# Optional on purpose: whoever clones this repository does not necessarily own a
# domain, and requiring one would make the deployment reproducible only by its
# author.
variable "web_domain" {
  description = "Subdominio propio para la aplicacion. Vacio para usar el dominio de la distribucion."
  type        = string
  default     = ""

  validation {
    # A domain apex cannot hold a CNAME: the DNS specification forbids it, because
    # the authority records live there. It would need an ALIAS record, a
    # proprietary extension most registrars do not offer.
    condition     = var.web_domain == "" || length(split(".", var.web_domain)) >= 3
    error_message = "web_domain debe ser un subdominio (app.ejemplo.com), no el dominio raiz."
  }
}
