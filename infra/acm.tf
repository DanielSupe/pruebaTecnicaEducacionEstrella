# In us-east-1, and that is not a choice: CloudFront only accepts certificates from
# that region, wherever everything else lives.
#
# DNS validation rather than email: email validation depends on a mailbox existing
# and being read, and leaves no checkable trace.
resource "aws_acm_certificate" "web" {
  count = var.web_domain == "" ? 0 : 1

  domain_name       = var.web_domain
  validation_method = "DNS"

  # Without this, changing the name would destroy the certificate in use before
  # issuing the new one.
  lifecycle {
    create_before_destroy = true
  }
}

# The validation record is added by hand by whoever administers the DNS, because
# the zone lives at the registrar. This resource waits until the certifier sees it:
# the only point of the deployment that depends on a human.
resource "aws_acm_certificate_validation" "web" {
  count = var.web_domain == "" ? 0 : 1

  certificate_arn         = aws_acm_certificate.web[0].arn
  validation_record_fqdns = [for o in aws_acm_certificate.web[0].domain_validation_options : o.resource_record_name]

  timeouts {
    create = "30m"
  }
}
