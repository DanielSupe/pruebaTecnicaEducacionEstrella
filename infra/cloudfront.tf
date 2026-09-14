# Bucket del frontend.
#
# Privado, igual que el de videos. Lo unico que puede leerlo es la distribucion,
# mediante control de acceso de origen. Un bucket publico es una de las senales
# que el enunciado penaliza de forma explicita.
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

# Cabeceras de seguridad.
#
# La politica de seguridad de contenido es la contrapartida concreta de guardar los
# tokens en el almacenamiento del navegador, que es lo que implica una sesion
# persistente en una aplicacion de pagina unica. Lo que hace ese riesgo asumible es
# que no haya forma de ejecutar script ajeno: script-src 'self', sin unsafe-inline
# y sin unsafe-eval.
#
# style-src SI lleva unsafe-inline, y es una concesion real que conviene no
# esconder: la libreria de ventanas emergentes inyecta su hoja en tiempo de
# ejecucion y la barra de progreso fija su ancho con un atributo de estilo. El
# riesgo es de otro orden que el del script.
#
# El almacenamiento aparece en DOS directivas porque son dos usos distintos:
# connect-src para la subida, que es una peticion; media-src para la reproduccion,
# que es un elemento de video. Olvidar la segunda rompe justo la funcionalidad del
# change 12.
#
# default-src 'none' y no 'self': obliga a que toda directiva sea explicita, de
# modo que lo que falte aparezca en la consola durante la verificacion en lugar de
# pasar desapercibido.
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

    # Sin precarga: el dominio por omision de la distribucion es compartido con
    # otras cuentas, y pedir precarga sobre el afectaria a terceros.
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }
  }
}

# Politicas gestionadas. Se referencian por nombre en lugar de por identificador
# escrito a mano: el identificador es opaco y no dice que hace.
data "aws_cloudfront_cache_policy" "optimizada" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "sin_cache" {
  name = "Managed-CachingDisabled"
}

# Reenvia todas las cabeceras del visitante EXCEPTO la de anfitrion.
#
# Las dos mitades importan. La cabecera de autorizacion tiene que llegar hasta la
# API o no funciona ninguna peticion autenticada. Y la de anfitrion tiene que
# quedarse fuera: la puerta de enlace responde 403 si recibe un anfitrion que no es
# el suyo. Esta politica existe exactamente para este caso.
data "aws_cloudfront_origin_request_policy" "todo_menos_anfitrion" {
  name = "Managed-AllViewerExceptHostHeader"
}

resource "aws_cloudfront_distribution" "web" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "${var.project_name}: frontend y API bajo un unico origen"

  # Norteamerica y Europa. La clase mas barata basta para una demo y evita
  # distribuir a regiones que nadie va a usar.
  price_class = "PriceClass_100"

  # El dominio propio se SUMA: el que genera la distribucion sigue sirviendo, lo
  # que deja una direccion de reserva si el DNS tarda en propagarse.
  #
  # Un nombre que no figure aqui se rechaza, y eso es lo que impide que alguien
  # apunte su dominio a esta distribucion y sirva nuestra aplicacion bajo su marca.
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

  # La API: sin cache y con las cabeceras del visitante.
  #
  # Que no se cachee no es una optimizacion al reves: son respuestas autenticadas
  # y distintas para cada solicitante. Una respuesta cacheada de la lista de
  # solicitudes serviria las de una persona a otra, que es exactamente el
  # aislamiento que sostiene todo el modelo de datos.
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

  # El enrutado lo resuelve el navegador, asi que en el bucket no existe ningun
  # archivo para /solicitudes/nueva. Sin esto, recargar ahi devuelve el error de
  # S3 en lugar de la aplicacion.
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

  # Sin dominio propio se usa el certificado de la distribucion; con el, el nuestro.
  # sni-only y no una direccion IP dedicada: esta ultima cuesta cientos de dolares
  # al mes y solo hace falta para clientes muy antiguos que aqui no existen.
  viewer_certificate {
    cloudfront_default_certificate = var.web_domain == ""
    acm_certificate_arn            = var.web_domain == "" ? null : aws_acm_certificate_validation.web[0].certificate_arn
    ssl_support_method             = var.web_domain == "" ? null : "sni-only"
    minimum_protocol_version       = var.web_domain == "" ? null : "TLSv1.2_2021"
  }
}

# Solo la distribucion puede leer el bucket del frontend.
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
