# =============================================================================
# Finance Tracker Serverless - DynamoDB Resources
# Single Table Design Implementation
# =============================================================================

# -----------------------------------------------------------------------------
# DynamoDB Single Table - Main Table
# Implementa Single Table Design para optimizar rendimiento y costos
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "main" {
  name         = "${local.name_prefix}-main"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "pk"
  range_key    = "sk"

  # Atributos principales requeridos por DynamoDB
  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  # Atributos para GSI1 (búsqueda por email, categorías, etc.)
  attribute {
    name = "gsi1_pk"
    type = "S"
  }

  attribute {
    name = "gsi1_sk"
    type = "S"
  }

  # Atributos para GSI2 (búsqueda por fecha, tipo, etc.)
  attribute {
    name = "gsi2_pk"
    type = "S"
  }

  attribute {
    name = "gsi2_sk"
    type = "S"
  }

  # Capacidad para tabla principal
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  # GSI1 - Para búsquedas por email, entidad específica
  # Ejemplo: EMAIL#{email} -> USER#{user_id}
  global_secondary_index {
    name     = "GSI1"
    hash_key = "gsi1_pk"
    range_key = "gsi1_sk"

    read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

    projection_type = "ALL"
  }

  # GSI2 - Para búsquedas por fecha, tipo, categoría
  # Ejemplo: USER#{user_id}#DATE -> {timestamp}
  global_secondary_index {
    name     = "GSI2"
    hash_key = "gsi2_pk"
    range_key = "gsi2_sk"

    read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

    projection_type = "ALL"
  }

  # Point-in-Time Recovery
  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-main"
    Type = "dynamodb-single-table"
    Pattern = "single-table-design"
    Description = "Main table using Single Table Design pattern for all entities"
  })
}

# -----------------------------------------------------------------------------
# DynamoDB Table para Terraform State Locking - DEPRECATED
# -----------------------------------------------------------------------------
# NOTA: Tabla de locking no necesaria - ahora usamos S3 native locking 
# con `use_lockfile = true` que es más simple y no requiere DynamoDB

# resource "aws_dynamodb_table" "terraform_state_lock" {
#   name         = "terraform-state-lock-${var.environment}"
#   billing_mode = "PAY_PER_REQUEST"
#   hash_key     = "LockID"
# 
#   attribute {
#     name = "LockID"
#     type = "S"
#   }
# 
#   point_in_time_recovery {
#     enabled = var.enable_point_in_time_recovery
#   }
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
