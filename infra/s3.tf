# El espacio de nombres de S3 es global: un nombre fijo colisionaria con cualquier
# otra cuenta que ya lo hubiera tomado. El sufijo se guarda en el estado, asi que
# es estable entre aplicaciones sucesivas.
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "videos" {
  # Con versionado activo, destruir exige borrar tambien versiones y marcadores.
  # Ver la variable: el valor por omision NO destruye datos.
  force_destroy = var.videos_bucket_force_destroy

  bucket = "${var.project_name}-videos-${random_id.bucket_suffix.hex}"
}

# El enunciado penaliza explicitamente un bucket con acceso publico. Las cuatro
# opciones, no solo las dos habituales.
resource "aws_s3_bucket_public_access_block" "videos" {
  bucket = aws_s3_bucket.videos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Cifrado con claves gestionadas por S3. KMS daria trazabilidad del uso de clave,
# pero cobra por peticion y aqui no hay requisito de custodia que lo justifique.
resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Sin versionado: duplicaria el almacenamiento de archivos de hasta 200 MB contra
# una capa gratuita de 5 GB, y cada solicitud escribe su propia clave una sola vez.
resource "aws_s3_bucket_versioning" "videos" {
  bucket = aws_s3_bucket.videos.id

  versioning_configuration {
    status = "Disabled"
  }
}

# El navegador sube directamente aqui con una politica firmada, asi que el bucket
# tiene que aceptar la peticion desde el origen del frontend. Solo POST: es el
# unico metodo que usa la subida firmada.
resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  cors_rule {
    allowed_methods = ["POST"]
    # El dominio de la distribucion se anade aqui, no en la variable: se conoce al
    # aplicar y escribirlo a mano obligaria a recordar actualizarlo. La subida
    # firmada va directa al almacenamiento, asi que este CORS si hace falta.
    allowed_origins = concat(
      var.allowed_upload_origins,
      ["https://${aws_cloudfront_distribution.web.domain_name}"],
      # El dominio propio, si lo hay. Olvidarlo romperia SOLO la subida del video
      # y SOLO desde ese dominio: el resto de la aplicacion pareceria correcta.
      var.web_domain == "" ? [] : ["https://${var.web_domain}"],
    )
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "Location"]
    max_age_seconds = 3000
  }
}

# Dos reglas que responden a preguntas distintas.
#
# Una regla de ciclo de vida no puede consultar DynamoDB: solo filtra por prefijo,
# etiqueta y antiguedad. Por eso el estado viaja en el propio objeto. La politica de
# subida firmada obligara a subir con status=pending, y la confirmacion reetiqueta a
# status=confirmed, lo que SACA al objeto del alcance de la primera regla.
#
# El sentido importa: si se etiquetara al confirmar, un huerfano se quedaria sin
# etiqueta y viviria para siempre. El valor por omision tiene que ser el que se limpia.
resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    id     = "eliminar-videos-huerfanos"
    status = "Enabled"

    filter {
      tag {
        key   = "status"
        value = "pending"
      }
    }

    expiration {
      days = var.orphan_video_retention_days
    }
  }

  rule {
    id     = "tope-de-retencion"
    status = "Enabled"

    filter {}

    expiration {
      days = var.video_max_retention_days
    }
  }

  # No hace falta abort_incomplete_multipart_upload: con subida firmada por POST no
  # existen cargas multiparte que abortar.

  depends_on = [aws_s3_bucket_versioning.videos]
}

# Deniega cualquier peticion que no viaje cifrada. Es barato y cierra un hueco que
# el bloqueo de acceso publico no cubre.
data "aws_iam_policy_document" "videos" {
  statement {
    sid       = "DenegarTransporteSinCifrar"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.videos.arn, "${aws_s3_bucket.videos.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "videos" {
  bucket = aws_s3_bucket.videos.id
  policy = data.aws_iam_policy_document.videos.json

  # La politica debe aplicarse despues del bloqueo de acceso publico: si no, S3
  # puede rechazarla por considerarla una politica potencialmente publica.
  depends_on = [aws_s3_bucket_public_access_block.videos]
}
