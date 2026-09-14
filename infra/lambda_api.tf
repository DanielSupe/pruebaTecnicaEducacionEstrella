# La API.
#
# El paquete lo construye esbuild (pnpm --filter api build) y aqui solo se comprime.
# Terraform no construye codigo: si lo hiciera, un `plan` dependeria de tener las
# dependencias de Node instaladas.
data "archive_file" "api" {
  type        = "zip"
  output_path = "${path.module}/build/api.zip"
  source_dir  = "${path.module}/build/api"
}

resource "aws_iam_role" "api" {
  name               = "${var.project_name}-api"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# La politica de minimo privilegio se escribio en el change 9, junto al codigo que
# la usa, y se quedo sin adjuntar esperando a que existiera este rol.
resource "aws_iam_role_policy_attachment" "api" {
  role       = aws_iam_role.api.name
  policy_arn = aws_iam_policy.api.arn
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.project_name}-api"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "api_logs" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.api.arn}:*"]
  }
}

resource "aws_iam_role_policy" "api_logs" {
  name   = "escribir-sus-propios-logs"
  role   = aws_iam_role.api.id
  policy = data.aws_iam_policy_document.api_logs.json
}

resource "aws_lambda_function" "api" {
  function_name = "${var.project_name}-api"
  role          = aws_iam_role.api.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 15
  memory_size   = 512

  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256

  # Tope de gasto y de radio de impacto. Es una funcion que cualquiera puede
  # invocar: sin limite, un abuso se traduce en factura y en agotar la capacidad
  # de la cuenta para todo lo demas.
  reserved_concurrent_executions = var.api_reserved_concurrency

  environment {
    variables = {
      NODE_ENV                = "production"
      APPLICATIONS_TABLE_NAME = aws_dynamodb_table.applications.name
      VIDEOS_BUCKET_NAME      = aws_s3_bucket.videos.id
      COGNITO_USER_POOL_ID    = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID       = aws_cognito_user_pool_client.web.id

      # AWS_REGION NO se declara aqui: es una variable reservada que el entorno de
      # ejecucion ya provee, y declararla hace fallar el despliegue con
      # InvalidParameterValueException. La configuracion la lee igual.

      # Los origenes del navegador, que aqui NO se usan: la API se sirve bajo el
      # mismo origen que el frontend, asi que ninguna peticion suya cruza origenes.
      # Se declara porque la configuracion se valida al arrancar y la exige.
      #
      # Y NO se toma del dominio de la distribucion, aunque seria lo natural: eso
      # crearia un ciclo (funcion -> distribucion -> puerta de enlace -> funcion).
      CORS_ALLOWED_ORIGINS = join(",", var.allowed_upload_origins)
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]
}
