# Private. Only the distribution can read it, through origin access control.
resource "aws_s3_bucket" "web" {
  bucket        = "${var.project_name}-web-${random_id.bucket_suffix.hex}"
  force_destroy = true # Solo contiene artefactos de construccion: se regeneran.
}

resource "aws_s3_bucket_public_access_block" "web" {
  bucket = aws_s3_bucket.web.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "web" {
  bucket = aws_s3_bucket.web.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "web" {
  name                              = "${var.project_name}-web"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# The content security policy is the concrete counterpart of keeping tokens in
# browser storage. What makes that risk acceptable is that no foreign script can
# run: script-src 'self', no unsafe-inline, no unsafe-eval.
#
# style-src DOES carry unsafe-inline, and that is a real concession: the dialog
# library injects its stylesheet at runtime and the progress bar sets its width
# with a style attribute.
#
# Storage appears in TWO directives because they are two different uses:
# connect-src for the upload, which is a request, and media-src for playback, which
# is a video element. Forgetting the second breaks playback only.
#
# default-src 'none' rather than 'self': it forces every directive to be explicit,
# so whatever is missing shows up in the console during verification.
locals {
  cognito_origin = "https://cognito-idp.${var.aws_region}.amazonaws.com"
  videos_origin  = "https://${aws_s3_bucket.videos.id}.s3.${var.aws_region}.amazonaws.com"

  content_security_policy = join("; ", [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' ${local.cognito_origin} ${local.videos_origin}",
    "media-src 'self' ${local.videos_origin}",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ])
}

resource "aws_cloudfront_response_headers_policy" "web" {
  name = "${var.project_name}-seguridad"

  security_headers_config {
    content_security_policy {
      content_security_policy = local.content_security_policy
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    # No preload: the distribution's default domain is shared with other accounts,
    # and requesting preload on it would affect third parties.
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }
  }
}

# Referenced by name rather than by hand-written id: the id is opaque.
data "aws_cloudfront_cache_policy" "optimizada" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "sin_cache" {
  name = "Managed-CachingDisabled"
}

# Forwards every viewer header EXCEPT Host. Both halves matter: Authorization must
# reach the API or no authenticated request works, and Host must stay out because
# API Gateway answers 403 to a Host that is not its own.
data "aws_cloudfront_origin_request_policy" "todo_menos_anfitrion" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name}: frontend y API bajo un unico origen"


  price_class = "PriceClass_100"

  # The custom domain is ADDED: the generated one keeps serving as a fallback.
  #
  # A name not listed here is rejected, which is what stops someone pointing their
  # domain at this distribution and serving our application under their brand.
  aliases = var.web_domain == "" ? [] : [var.web_domain]

  origin {
    origin_id                = "spa"
    domain_name              = aws_s3_bucket.web.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.web.id
  }

  origin {
    origin_id   = "api"
    domain_name = replace(aws_apigatewayv2_api.api.api_endpoint, "https://", "")

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "spa"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = data.aws_cloudfront_cache_policy.optimizada.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.web.id
  }

  # Not caching is not an optimisation in reverse: these are authenticated
  # responses, different for every applicant. A cached listing would serve one
  # person's applications to another.
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "api"
    viewer_protocol_policy = "https-only"
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.sin_cache.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.todo_menos_anfitrion.id
  }

  # Routing is resolved by the browser, so no file exists in the bucket for a
  # client route. Without this, reloading there returns the S3 error.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # sni-only rather than a dedicated IP: that costs hundreds of dollars a month and
  # is only needed for very old clients.
  viewer_certificate {
    cloudfront_default_certificate = var.web_domain == ""
    acm_certificate_arn            = var.web_domain == "" ? null : aws_acm_certificate_validation.web[0].certificate_arn
    ssl_support_method             = var.web_domain == "" ? null : "sni-only"
    minimum_protocol_version       = var.web_domain == "" ? null : "TLSv1.2_2021"
  }
}


data "aws_iam_policy_document" "web" {
  statement {
    sid       = "PermitirLecturaDesdeLaDistribucion"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.web.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.web.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "web" {
  bucket     = aws_s3_bucket.web.id
  policy     = data.aws_iam_policy_document.web.json
  depends_on = [aws_s3_bucket_public_access_block.web]
}
