# =============================================================================
# Finance Tracker Serverless - DynamoDB Single Table Design
# =============================================================================

# -----------------------------------------------------------------------------
# DynamoDB Main Table - Single Table Design
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "main" {
  name         = "${local.name_prefix}-main"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "pk" # Partition Key
  range_key    = "sk" # Sort Key

  # Atributos principales para Single Table Design
  attribute {
    name = "pk"
    type = "S" # USER#{user_id}, ACCOUNT#{account_id}, TRANSACTION#{transaction_id}, etc.
  }

  attribute {
    name = "sk"
    type = "S" # METADATA, TRANSACTION#{timestamp}, ACCOUNT#{account_id}, etc.
  }

  attribute {
    name = "gsi1_pk"
    type = "S" # Para GSI1 - EMAIL#{email}, USER#{user_id}, etc.
  }

  attribute {
    name = "gsi1_sk"
    type = "S" # Para GSI1 - USER#{user_id}, ACCOUNT#{account_id}, etc.
  }

  # Capacidad solo para PROVISIONED
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  # Global Secondary Index 1 - Para consultas por email y otros patrones
  global_secondary_index {
    name            = "GSI1"
    hash_key        = "gsi1_pk"
    range_key       = "gsi1_sk"
    projection_type = "ALL"

    # Capacidad solo para modo PROVISIONED
    read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }

  # Configuración de respaldo
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(var.common_tags, {
    Name        = "${local.name_prefix}-main"
    Description = "Tabla principal usando Single Table Design para Finance Tracker"
    Component   = "database"
  })
}
# 
#   server_side_encryption {
#     enabled = true
#   }
# 
#   tags = merge(local.common_tags, {
#     Name        = "terraform-state-lock-${var.environment}"
#     Type        = "dynamodb-table"
#     Purpose     = "terraform-state-locking"
#     Description = "Table for Terraform state locking"
#   })
# }
