# Permisos que necesita la API.
#
# Se define aqui, junto al change que escribe el codigo que los usa, y NO se
# adjunta a ningun rol todavia: el rol de la funcion llega con el despliegue.
# El motivo es practico: los permisos se acotan bien cuando sabes exactamente
# que operaciones hace el codigo, no semanas despues intentando recordarlo.
#
# Por que la API necesita permiso de escritura en S3 si nunca sube el archivo:
# al firmar una politica de subida, quien firma esta delegando SUS permisos. S3
# valida la subida contra lo que puede hacer el firmante, asi que sin PutObject
# la politica seria valida y la subida fallaria igualmente.
data "aws_iam_policy_document" "api" {
  statement {
    sid    = "EscribirSolicitudes"
    effect = "Allow"

    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]

    resources = [aws_dynamodb_table.applications.arn]
  }

  statement {
    sid    = "AutorizarSubidaDeVideos"
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:PutObjectTagging",

      # Lo que exige HeadObject, aunque el nombre de la operacion no lo sugiera:
      # comprobar si un objeto existe y con que metadatos se autoriza con el
      # permiso de lectura.
      "s3:GetObject",
    ]

    # Solo bajo el prefijo de videos, no sobre el bucket entero.
    resources = ["${aws_s3_bucket.videos.arn}/videos/*"]
  }
}

resource "aws_iam_policy" "api" {
  name        = "${var.project_name}-api"
  description = "Permisos minimos de la API: registrar solicitudes y autorizar subidas de video."
  policy      = data.aws_iam_policy_document.api.json
}
