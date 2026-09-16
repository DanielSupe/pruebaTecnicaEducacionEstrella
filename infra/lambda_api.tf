# The bundle is built by esbuild (pnpm --filter api build) and only zipped here.
# Terraform does not build code: if it did, a plan would depend on having the Node
# dependencies installed.
data "archive_file" "api" {
  type        = "zip"
  output_path = "${path.module}/build/api.zip"
  source_dir  = "${path.module}/build/api"
}

resource "aws_iam_role" "api" {
  name               = "${var.project_name}-api"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}


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

  # Spend and blast-radius cap: anyone can invoke this function.
  reserved_concurrent_executions = var.api_reserved_concurrency

  environment {
    variables = {
      NODE_ENV                = "production"
      APPLICATIONS_TABLE_NAME = aws_dynamodb_table.applications.name
      VIDEOS_BUCKET_NAME      = aws_s3_bucket.videos.id
      COGNITO_USER_POOL_ID    = aws_cognito_user_pool.main.id
      COGNITO_CLIENT_ID       = aws_cognito_user_pool_client.web.id

      # AWS_REGION is NOT declared here: it is a reserved variable the runtime
      # already provides, and declaring it fails the deployment with
      # InvalidParameterValueException.

      # NOT used here: the API is served under the same origin as the frontend.
      # Declared because the config is validated at startup and requires it.
      #
      # And NOT taken from the distribution domain, which would be the natural
      # thing: that creates a cycle (function -> distribution -> gateway ->
      # function).
      CORS_ALLOWED_ORIGINS = join(",", var.allowed_upload_origins)
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]
}
