# Se empaqueta con archive_file para no depender de ninguna herramienta externa de
# construccion: son unas pocas lineas de JavaScript sin dependencias.
data "archive_file" "pre_signup" {
  type        = "zip"
  output_path = "${path.module}/build/pre-signup.zip"

  source {
    content  = file("${path.module}/lambda/pre-signup.mjs")
    filename = "index.mjs"
  }
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "pre_signup" {
  name               = "${var.project_name}-pre-signup"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

# Se crea explicitamente para fijar la retencion. Si se deja que Lambda lo cree al
# vuelo, la retencion es indefinida y los registros crecen sin control.
resource "aws_cloudwatch_log_group" "pre_signup" {
  name              = "/aws/lambda/${var.project_name}-pre-signup"
  retention_in_days = var.log_retention_days
}

# Minimo privilegio de verdad: solo escribir en SU grupo de registros. No se usa la
# politica gestionada AWSLambdaBasicExecutionRole porque concede logs sobre todos
# los recursos, y aqui no hace falta.
data "aws_iam_policy_document" "pre_signup_logs" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.pre_signup.arn}:*"]
  }
}

resource "aws_iam_role_policy" "pre_signup_logs" {
  name   = "escribir-sus-propios-logs"
  role   = aws_iam_role.pre_signup.id
  policy = data.aws_iam_policy_document.pre_signup_logs.json
}

resource "aws_lambda_function" "pre_signup" {
  function_name = "${var.project_name}-pre-signup"
  role          = aws_iam_role.pre_signup.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"
  timeout       = 5
  memory_size   = 128

  filename         = data.archive_file.pre_signup.output_path
  source_code_hash = data.archive_file.pre_signup.output_base64sha256

  depends_on = [aws_cloudwatch_log_group.pre_signup]
}

resource "aws_lambda_permission" "cognito_invoke_pre_signup" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_signup.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
