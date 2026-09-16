resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users"

  # CRITICAL: username_attributes, NOT alias_attributes.
  #
  # As an alias, Cognito only resolves the email once it is verified. Since sign-up
  # auto-confirms without verifying, using alias would produce users who register
  # correctly and can NEVER sign in, with an error that does not point at the
  # cause. As a username, the email IS the identity.
  username_attributes = ["email"]

  # Deliberately no auto_verified_attributes, so Cognito never sends email.

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true

    # No mandatory symbol: Cognito's default demands one and it is needless
    # friction for whoever tries the demo. Documented in the README.
    require_symbols = false
  }

  # Password recovery is out of scope and would be meaningless with fictional
  # addresses nobody can read.
  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 3
      max_length = 254
    }
  }

  lambda_config {
    pre_sign_up = aws_lambda_function.pre_signup.arn
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "${var.project_name}-web"
  user_pool_id = aws_cognito_user_pool.main.id

  # A secret embedded in a single-page app is not a secret: anyone reads it in the
  # downloaded bundle.
  generate_secret = false

  explicit_auth_flows = [
    # What the frontend uses: the password never travels.
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",

    # Administrative verification from the command line only: it requires AWS
    # credentials, so it is not attack surface for an end user.
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]

  # Short access token. The persistent session is held by refresh, not by making
  # the access token long-lived.
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Avoids revealing whether an address is registered through different error
  # messages.
  prevent_user_existence_errors = "ENABLED"
}
