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
