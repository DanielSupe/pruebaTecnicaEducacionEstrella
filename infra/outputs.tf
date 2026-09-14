# Estos valores los consumen apps/api y apps/web.
#
# No se transcriben a mano a ningun archivo de codigo: scripts/gen-env.sh los lee
# de "terraform output -json" y genera los .env. La alternativa real a un script no
# es "copiarlos con cuidado", es copiarlos mal alguna vez.

output "aws_region" {
  description = "Region donde vive la infraestructura."
  value       = var.aws_region
}

output "dynamodb_table_name" {
  description = "Tabla de solicitudes."
  value       = aws_dynamodb_table.applications.name
}

output "videos_bucket_name" {
  description = "Bucket privado de videos de entrevista."
  value       = aws_s3_bucket.videos.id
}

output "cognito_user_pool_id" {
  description = "User Pool contra el que la API verifica los tokens."
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "App Client sin secreto que usa el navegador."
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_issuer_url" {
  description = "Emisor de los tokens. La API lo necesita para verificar la firma."
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

output "web_url" {
  description = "Direccion publica de la aplicacion. Sirve el frontend y la API bajo /api."
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "web_bucket_name" {
  description = "Bucket del frontend. Lo usa el script de publicacion."
  value       = aws_s3_bucket.web.id
}

output "cloudfront_distribution_id" {
  description = "Identificador de la distribucion, para invalidar la cache al publicar."
  value       = aws_cloudfront_distribution.web.id
}

output "api_gateway_url" {
  description = "Direccion directa de la puerta de enlace. El navegador no la usa: solo para diagnostico."
  value       = aws_apigatewayv2_api.api.api_endpoint
}
