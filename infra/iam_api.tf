# Why the API needs write permission on S3 even though it never uploads the file:
# signing an upload policy delegates the SIGNER's permissions. S3 validates the
# upload against what the signer may do, so without PutObject the policy would be
# valid and the upload would fail anyway.
data "aws_iam_policy_document" "api" {
  statement {
    sid    = "EscribirSolicitudes"
    effect = "Allow"

    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
    ]

    resources = [aws_dynamodb_table.applications.arn]
  }

  statement {
    sid    = "AutorizarSubidaDeVideos"
    effect = "Allow"

    actions = [
      "s3:PutObject",
      "s3:PutObjectTagging",

      # What HeadObject requires, although the operation name does not suggest it.
      "s3:GetObject",
    ]

    # Under the videos prefix only, not the whole bucket.
    resources = ["${aws_s3_bucket.videos.arn}/videos/*"]
  }
}

resource "aws_iam_policy" "api" {
  name        = "${var.project_name}-api"
  description = "Permisos minimos de la API: registrar solicitudes y autorizar subidas de video."
  policy      = data.aws_iam_policy_document.api.json
}
