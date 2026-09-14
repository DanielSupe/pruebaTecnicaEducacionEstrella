# Certificado del dominio propio.
#
# En us-east-1 y no es una eleccion: CloudFront solo acepta certificados de esa
# region, viva donde viva el resto. Aqui coincide con la region del proyecto, asi
# que no hace falta declarar un segundo proveedor apuntando a otra region, que es
# la complicacion habitual de este paso.
#
# Validacion por DNS y no por correo: la validacion por correo depende de que
# exista y se lea un buzon en el dominio, y no deja rastro comprobable. Un registro
# DNS se puede verificar desde fuera y repetir.
resource "aws_acm_certificate" "web" {
  count = var.web_domain == "" ? 0 : 1

  domain_name       = var.web_domain
  validation_method = "DNS"

  # Sin esto, cambiar el nombre destruiria el certificado en uso antes de emitir el
  # nuevo, y la distribucion se quedaria un rato sin certificado valido.
  lifecycle {
    create_before_destroy = true
  }
}

# Espera a que el certificado quede emitido.
#
# El registro de validacion lo anade a mano quien administra el DNS, porque la zona
# vive en el registrador y no en esta cuenta. Traerla aqui automatizaria el paso a
# cambio de una zona alojada al mes, que no entra en la capa gratuita.
#
# Este recurso se queda esperando hasta que el certificador ve el registro. Es el
# unico punto del despliegue que depende de una accion humana, y esta documentado.
resource "aws_acm_certificate_validation" "web" {
  count = var.web_domain == "" ? 0 : 1

  certificate_arn         = aws_acm_certificate.web[0].arn
  validation_record_fqdns = [for o in aws_acm_certificate.web[0].domain_validation_options : o.resource_record_name]

  timeouts {
    create = "30m"
  }
}
