# =============================================================================
# Finance Tracker Serverless - DynamoDB Resources
# =============================================================================

# -----------------------------------------------------------------------------
# DynamoDB Table para Users
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "users" {
  name         = "${local.name_prefix}-users"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "user_id"

  # Configuración para PAY_PER_REQUEST
  dynamic "attribute" {
    for_each = var.dynamodb_billing_mode == "PAY_PER_REQUEST" ? [1] : []
    content {
      name = "user_id"
      type = "S"
    }
  }

  # Configuración para PROVISIONED
  dynamic "attribute" {
    for_each = var.dynamodb_billing_mode == "PROVISIONED" ? [1] : []
    content {
      name = "user_id"
      type = "S"
    }
  }

  dynamic "attribute" {
    for_each = var.dynamodb_billing_mode == "PROVISIONED" ? [1] : []
    content {
      name = "email"
      type = "S"
    }
  }

  # Capacidad solo para PROVISIONED
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  # GSI para buscar por email
  dynamic "global_secondary_index" {
    for_each = var.dynamodb_billing_mode == "PROVISIONED" ? [1] : [1]
    content {
      name     = "email-index"
      hash_key = "email"

      read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
      write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

      projection_type = "ALL"
    }
  }

  # Configurar atributos para GSI
  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
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
    Name = "${local.name_prefix}-users"
    Type = "dynamodb-table"
  })
}

# -----------------------------------------------------------------------------
# DynamoDB Table para Transacciones
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "transactions" {
  name         = "${local.name_prefix}-transactions"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "user_id"
  range_key    = "transaction_id"

  # Atributos principales
  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  # Capacidad solo para PROVISIONED
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  # GSI para buscar por fecha
  global_secondary_index {
    name      = "user-date-index"
    hash_key  = "user_id"
    range_key = "created_at"

    read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

    projection_type = "ALL"
  }

  # GSI para buscar por categoría
  global_secondary_index {
    name      = "user-category-index"
    hash_key  = "user_id"
    range_key = "category"

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
    Name = "${local.name_prefix}-transactions"
    Type = "dynamodb-table"
  })
}

# -----------------------------------------------------------------------------
# DynamoDB Table para Categorías
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "categories" {
  name         = "${local.name_prefix}-categories"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "user_id"
  range_key    = "category_id"

  # Atributos principales
  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "category_id"
    type = "S"
  }

  attribute {
    name = "category_type"
    type = "S"
  }

  # Capacidad solo para PROVISIONED
  read_capacity  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null

  # GSI para buscar por tipo de categoría
  global_secondary_index {
    name      = "user-type-index"
    hash_key  = "user_id"
    range_key = "category_type"

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
    Name = "${local.name_prefix}-categories"
    Type = "dynamodb-table"
  })
}

# -----------------------------------------------------------------------------
# DynamoDB Table para Terraform State Locking
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "terraform_state_lock" {
  name         = "terraform-state-lock-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  server_side_encryption {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name        = "terraform-state-lock-${var.environment}"
    Type        = "dynamodb-table"
    Purpose     = "terraform-state-locking"
    Description = "Table for Terraform state locking"
  })
}
