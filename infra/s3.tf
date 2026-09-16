# The S3 namespace is global: a fixed name would collide with any other account
# that already took it.
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "videos" {
  # See the variable: the default does NOT destroy data.
  force_destroy = var.videos_bucket_force_destroy

  bucket = "${var.project_name}-videos-${random_id.bucket_suffix.hex}"
}

# All four options, not just the usual two.
resource "aws_s3_bucket_public_access_block" "videos" {
  bucket = aws_s3_bucket.videos.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3-managed keys. KMS would add key-usage traceability but charges per request.
resource "aws_s3_bucket_server_side_encryption_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# No versioning: it would double storage of files up to 200 MB against a 5 GB free
# tier, and each application writes its own key once.
resource "aws_s3_bucket_versioning" "videos" {
  bucket = aws_s3_bucket.videos.id

  versioning_configuration {
    status = "Disabled"
  }
}

# The browser uploads straight here with a signed policy, so the bucket must accept
# the request from the frontend origin. POST only: the signed upload uses nothing
# else.
resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  cors_rule {
    allowed_methods = ["POST"]
    # Added here rather than in the variable: it is known at apply time, and
    # writing it by hand would mean remembering to update it.
    allowed_origins = concat(
      var.allowed_upload_origins,
      ["https://${aws_cloudfront_distribution.web.domain_name}"],
      # Forgetting this would break ONLY the video upload and ONLY from that
      # domain: the rest of the application would look fine.
      var.web_domain == "" ? [] : ["https://${var.web_domain}"],
    )
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "Location"]
    max_age_seconds = 3000
  }
}

# A lifecycle rule cannot query DynamoDB: it filters by prefix, tag and age only.
# That is why the state travels in the object itself. The signed policy forces
# status=pending on upload, and confirmation retags to status=confirmed, which
# takes the object OUT of the first rule's reach.
#
# The direction matters: tagging on confirmation instead would leave an orphan with
# no tag, and it would live forever. The default must be the one that gets cleaned.
resource "aws_s3_bucket_lifecycle_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  rule {
    id     = "eliminar-videos-huerfanos"
    status = "Enabled"

    filter {
      tag {
        key   = "status"
        value = "pending"
      }
    }

    expiration {
      days = var.orphan_video_retention_days
    }
  }

  rule {
    id     = "tope-de-retencion"
    status = "Enabled"

    filter {}

    expiration {
      days = var.video_max_retention_days
    }
  }

  # No abort_incomplete_multipart_upload needed: a signed POST upload creates no
  # multipart uploads to abort.

  depends_on = [aws_s3_bucket_versioning.videos]
}

# Denies any request not travelling encrypted: a gap that blocking public access
# does not cover.
data "aws_iam_policy_document" "videos" {
  statement {
    sid       = "DenegarTransporteSinCifrar"
    effect    = "Deny"
    actions   = ["s3:*"]
    resources = [aws_s3_bucket.videos.arn, "${aws_s3_bucket.videos.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "videos" {
  bucket = aws_s3_bucket.videos.id
  policy = data.aws_iam_policy_document.videos.json

  # Must be applied after the public access block, or S3 may reject it as a
  # potentially public policy.
  depends_on = [aws_s3_bucket_public_access_block.videos]
}
