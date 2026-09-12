# Tabla unica de solicitudes.
#
# La clave compuesta resuelve el caso de uso de la vista "mis solicitudes" sin
# indices ni Scan: PK identifica al usuario y SK lleva un ULID, que es ordenable
# por tiempo. Consultar por PK en orden descendente devuelve las solicitudes mas
# recientes primero.
#
# No hay indice secundario a proposito: no existe panel de administracion, asi que
# un indice por estado seria codigo muerto que ademas duplica el coste de escritura.
resource "aws_dynamodb_table" "applications" {
  name = "${var.project_name}-applications"

  # Provisionada y no bajo demanda: la capa siempre gratuita de AWS esta definida
  # sobre capacidad provisionada (25 unidades de cada tipo), mientras que bajo
  # demanda se factura desde la primera peticion. El enunciado pide no incurrir en
  # costos y existia alternativa gratuita con la misma funcionalidad.
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

  # Limpia las solicitudes que quedaron pendientes de video y nadie retomo.
  # El borrado es eventual: DynamoDB puede tardar hasta 48 horas en aplicarlo.
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Desactivada de forma explicita: la recuperacion a un punto en el tiempo se
  # factura por GB almacenado y este es un entorno de demostracion con datos
  # ficticios.
  point_in_time_recovery {
    enabled = false
  }
}
