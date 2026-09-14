# Puerta de enlace de la API.
#
# Etapa $default y no una con nombre: una etapa con nombre antepone su nombre a la
# ruta, y habria que deshacerlo reescribiendo en el borde. Asi /api/v1/health llega
# tal cual a Express, sin capa de traduccion que exista solo para deshacer un
# prefijo que no hacia falta.
#
# SIN cors_configuration a proposito: el navegador solo habla con la distribucion,
# que sirve el frontend y la API bajo el mismo origen. Declarar CORS aqui seria
# configurar una politica para peticiones que nunca ocurren.
resource "aws_apigatewayv2_api" "api" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "api" {
  api_id                 = aws_apigatewayv2_api.api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

# Una sola ruta que lo recoge todo: el enrutado ya lo hace Express, y duplicarlo
# aqui significaria mantener dos listas de rutas que tienen que coincidir.
resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.api.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn

    # Sin cabeceras ni cadenas de consulta: un registro de acceso no deberia
    # acabar guardando tokens ni enlaces firmados.
    format = jsonencode({
      requestId = "$context.requestId"
      method    = "$context.httpMethod"
      path      = "$context.path"
      status    = "$context.status"
      latencia  = "$context.responseLatency"
    })
  }
}

resource "aws_cloudwatch_log_group" "api_access" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_permission" "apigateway_invoke_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*/*"
}
