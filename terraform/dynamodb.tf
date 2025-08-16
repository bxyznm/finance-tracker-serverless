# DynamoDB Tables
# Aquí definimos todas las tablas de la base de datos NoSQL

# Tabla de Usuarios
resource "aws_dynamodb_table" "users" {
  name           = "${local.table_prefix}-users"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "user_id"

  attribute {
    name = "user_id"
    type = "S"  # String
  }

  attribute {
    name = "email"
    type = "S"
  }

  # Índice secundario global para buscar por email
  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name = "Users Table"
    Description = "Almacena información de usuarios registrados"
  })
}

# Tabla de Cuentas Bancarias
resource "aws_dynamodb_table" "accounts" {
  name           = "${local.table_prefix}-accounts"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "account_id"

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  # Índice para buscar cuentas por usuario
  global_secondary_index {
    name            = "UserAccountsIndex"
    hash_key        = "user_id"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name = "Accounts Table"
    Description = "Almacena cuentas bancarias de usuarios"
  })
}

# Tabla de Transacciones
resource "aws_dynamodb_table" "transactions" {
  name           = "${local.table_prefix}-transactions"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "transaction_id"

  attribute {
    name = "transaction_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"  # ISO timestamp string
  }

  # Índice para obtener transacciones por usuario
  global_secondary_index {
    name            = "UserTransactionsIndex"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  # Índice para obtener transacciones por cuenta
  global_secondary_index {
    name            = "AccountTransactionsIndex"
    hash_key        = "account_id"
    range_key       = "created_at"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name = "Transactions Table"
    Description = "Almacena todas las transacciones financieras"
  })
}

# Tabla de Categorías
resource "aws_dynamodb_table" "categories" {
  name           = "${local.table_prefix}-categories"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "category_id"

  attribute {
    name = "category_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"  # 'system' o 'custom'
  }

  # Índice para categorías del usuario
  global_secondary_index {
    name            = "UserCategoriesIndex"
    hash_key        = "user_id"
    range_key       = "type"
    projection_type = "ALL"
  }

  # Índice para categorías del sistema
  global_secondary_index {
    name            = "SystemCategoriesIndex"
    hash_key        = "type"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name = "Categories Table"
    Description = "Almacena categorias de transacciones sistema y personalizadas"
  })
}

# Tabla de Presupuestos
resource "aws_dynamodb_table" "budgets" {
  name           = "${local.table_prefix}-budgets"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "budget_id"

  attribute {
    name = "budget_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "period_start"
    type = "S"
  }

  # Índice para presupuestos por usuario
  global_secondary_index {
    name            = "UserBudgetsIndex"
    hash_key        = "user_id"
    range_key       = "period_start"
    projection_type = "ALL"
  }

  point_in_time_recovery {
    enabled = var.enable_point_in_time_recovery
  }

  tags = merge(local.common_tags, {
    Name = "Budgets Table"
    Description = "Almacena presupuestos de usuarios"
  })
}
