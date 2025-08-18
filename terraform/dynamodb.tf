# DynamoDB Single Table Design
# Siguiendo el patrón Single Table Design para optimizar rendimiento y costos

# Tabla principal - Single Table Design
resource "aws_dynamodb_table" "main" {
  name         = "${local.table_prefix}-main"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "pk" # Partition Key
  range_key    = "sk" # Sort Key

  # Atributos principales
  attribute {
    name = "pk"
    type = "S" # String - USER#{user_id}, ACCOUNT#{account_id}, etc.
  }

  attribute {
    name = "sk"
    type = "S" # String - METADATA, TRANSACTION#{timestamp}, etc.
  }

  attribute {
    name = "gsi1_pk"
    type = "S" # Para GSI1 - EMAIL#{email}, etc.
  }

  attribute {
    name = "gsi1_sk"
    type = "S" # Para GSI1 - USER#{user_id}, etc.
  }

  # Global Secondary Index 1 - Para consultas por email y otros patrones
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1_pk"
    range_key       = "gsi1_sk"
    projection_type = "ALL"
  }

  # Configuración de respaldo
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name        = "Main Table"
    Description = "Tabla principal usando Single Table Design para Finance Tracker"
  })
}

