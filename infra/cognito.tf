resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-users"

  # CRITICO: username_attributes, NO alias_attributes.
  #
  # Como alias, Cognito solo resuelve el correo cuando esta verificado. Dado que
  # aqui se auto-confirma sin verificar el correo, usar alias produciria usuarios
  # que se registran correctamente y NUNCA pueden iniciar sesion, con un error que
  # no apunta a la causa. Como username, el correo ES la identidad y la
  # verificacion es irrelevante para el inicio de sesion.
  username_attributes = ["email"]

  # Deliberadamente sin auto_verified_attributes: asi Cognito no envia correos en
  # ningun caso, que es lo coherente con no verificar.

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true

    # Sin simbolo obligatorio: el default de Cognito lo exige y es friccion
    # innecesaria para quien evalue la demostracion. Se documenta en el README.
    require_symbols = false
  }

  # "Olvide mi contrasena" queda fuera de alcance y ademas no tendria sentido con
  # correos ficticios que nadie puede leer.
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

  # Un secreto incrustado en una aplicacion de pagina unica no es un secreto:
  # cualquiera lo lee en el paquete descargado.
  generate_secret = false

  explicit_auth_flows = [
    # Lo que usa el frontend: la contrasena nunca viaja, se demuestra su
    # conocimiento sin enviarla.
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",

    # Solo para verificacion administrativa desde la linea de comandos: exige
    # credenciales de AWS, asi que no es superficie de ataque para un usuario final.
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
  ]

  # Token de acceso corto. La sesion persistente que pide el enunciado se sostiene
  # con la renovacion, no alargando el token de acceso.
  access_token_validity  = 1
  id_token_validity      = 1
  refresh_token_validity = 30

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Evita revelar si un correo esta registrado a traves de mensajes de error
  # distintos.
  prevent_user_existence_errors = "ENABLED"
}
