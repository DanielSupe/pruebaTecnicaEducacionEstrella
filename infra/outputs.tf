# Never transcribed by hand into any code file: scripts/gen-env.sh reads them from
# "terraform output -json". The real alternative to a script is not "copying them
# carefully", it is getting one wrong eventually.

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

# The record to add at the DNS provider to validate the certificate.
output "certificate_validation_record" {
  description = "Registro CNAME de validacion del certificado. Vacio si no hay dominio propio."
  value = var.web_domain == "" ? null : {
    nombre = one(aws_acm_certificate.web[0].domain_validation_options).resource_record_name
    tipo   = one(aws_acm_certificate.web[0].domain_validation_options).resource_record_type
    valor  = one(aws_acm_certificate.web[0].domain_validation_options).resource_record_value
  }
}
