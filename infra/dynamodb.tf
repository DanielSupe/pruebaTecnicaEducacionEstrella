# The composite key answers "my applications" with no index and no Scan: PK is the
# user and SK carries a time-ordered ULID.
#
# No secondary index on purpose: there is no admin panel, so an index by status
# would be dead weight that also doubles the write cost.
resource "aws_dynamodb_table" "applications" {
  name = "${var.project_name}-applications"

  # Provisioned rather than on-demand: the always-free tier is defined over
  # provisioned capacity, while on-demand bills from the first request.
  billing_mode   = "PROVISIONED"
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity

  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # Deletion is eventual: DynamoDB may take up to 48 hours to apply it.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Explicitly off: point-in-time recovery bills per GB stored.
  point_in_time_recovery {
    enabled = false
  }
}
