# =============================================================================
# Finance Tracker Serverless - Lambda Resources
# =============================================================================

# -----------------------------------------------------------------------------
# Datadog Lambda Layer
# -----------------------------------------------------------------------------

# Datadog Lambda Extension Layer para Python 3.12
data "aws_lambda_layer_version" "datadog_extension" {
  count = var.datadog_enabled ? 1 : 0
  
  layer_name = "Datadog-Extension"
  version    = 65  # Version más reciente para mx-central-1
  
  # Si la capa no existe en mx-central-1, usar una región compatible
  compatible_runtime = var.lambda_runtime
}

# Datadog Python Layer
data "aws_lambda_layer_version" "datadog_python" {
  count = var.datadog_enabled ? 1 : 0
  
  layer_name = "Datadog-Python312"
  version    = 115  # Version más reciente para Python 3.12
  
  compatible_runtime = var.lambda_runtime
}

# -----------------------------------------------------------------------------
# Lambda Layer para Dependencias
# -----------------------------------------------------------------------------

resource "aws_lambda_layer_version" "dependencies" {
  layer_name  = "${local.name_prefix}-dependencies"
  description = "Dependencies layer for Finance Tracker - ${var.environment} (${var.dev_release_tag != null ? var.dev_release_tag : (length(data.github_release.finance_tracker) > 0 ? data.github_release.finance_tracker[0].release_tag : "local-dev")})"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.layer_zip.key
  source_code_hash = aws_s3_object.layer_zip.etag

  compatible_runtimes = [var.lambda_runtime]

  # Force recreation when release tag changes to ensure fresh layer
  skip_destroy = false

  depends_on = [aws_s3_object.layer_zip]

  # Add lifecycle rule to ensure layer updates properly
  lifecycle {
    create_before_destroy = true
  }
}

# -----------------------------------------------------------------------------
# IAM Role para Lambda Functions
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.name_prefix}-lambda-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-execution-role"
    Type = "iam-role"
  })
}

# Adjuntar política básica de Lambda
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# Política personalizada para DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${local.name_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.main.arn,
          "${aws_dynamodb_table.main.arn}/index/*"
        ]
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Log Groups
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = toset([
    "health",
    "users",
    "transactions",
    "categories",
    "auth",
    "accounts"
  ])

  name              = "/aws/lambda/${local.name_prefix}-${each.key}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-${each.key}-logs"
    Type = "cloudwatch-log-group"
  })
}

# -----------------------------------------------------------------------------
# Lambda Functions
# -----------------------------------------------------------------------------

# Variables de entorno comunes para todas las funciones Lambda
locals {
  common_lambda_environment = merge({
    ENVIRONMENT          = var.environment
    PROJECT_NAME         = var.project_name
    # Nota: AWS_REGION es una variable reservada de Lambda, usamos APP_AWS_REGION en su lugar
    # Las funciones Lambda pueden obtener la región automáticamente via boto3.Session().region_name
    APP_AWS_REGION       = var.aws_region  
    DYNAMODB_TABLE       = aws_dynamodb_table.main.name  # Single Table Design
    LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
    CORS_ALLOWED_ORIGINS = join(",", var.cors_allowed_origins)
  }, var.lambda_environment_variables, var.datadog_enabled ? {
    # Datadog Environment Variables
    DD_API_KEY           = var.datadog_api_key
    DD_SITE              = var.datadog_site
    DD_SERVICE           = var.datadog_service_name
    DD_ENV               = var.datadog_env != "" ? var.datadog_env : var.environment
    DD_VERSION           = var.dev_release_tag != null ? var.dev_release_tag : (length(data.github_release.finance_tracker) > 0 ? data.github_release.finance_tracker[0].release_tag : "local-dev")
    DD_FLUSH_TO_LOG      = "true"
    DD_TRACE_ENABLED     = "true"
    DD_LOGS_INJECTION    = "true"
    DD_SERVERLESS_LOGS_ENABLED = "true"
    DD_CAPTURE_LAMBDA_PAYLOAD = "false"  # Para evitar capturar información sensible
    DD_LAMBDA_HANDLER    = "handlers.health.lambda_handler"  # Se sobrescribirá en cada función
  } : {})
  
  # Layers comunes - incluye Datadog si está habilitado
  common_layers = compact(concat(
    [aws_lambda_layer_version.dependencies.arn],
    var.datadog_enabled ? [
      try(data.aws_lambda_layer_version.datadog_extension[0].arn, ""),
      try(data.aws_lambda_layer_version.datadog_python[0].arn, "")
    ] : []
  ))
}

# Health Check Function
resource "aws_lambda_function" "health" {
  function_name = "${local.name_prefix}-health"
  description   = "Health check endpoint for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.health.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, var.datadog_enabled ? {
      DD_LAMBDA_HANDLER = "handlers.health.lambda_handler"
    } : {})
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-health"
    Type = "lambda-function"
  })
}

# Users Function
resource "aws_lambda_function" "users" {
  function_name = "${local.name_prefix}-users"
  description   = "User management for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.users.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, {
      JWT_SECRET_KEY = var.jwt_secret_key
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-users"
    Type = "lambda-function"
  })
}

# Transactions Function
resource "aws_lambda_function" "transactions" {
  function_name = "${local.name_prefix}-transactions"
  description   = "Transaction management for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.transactions.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, {
      JWT_SECRET_KEY = var.jwt_secret_key
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-transactions"
    Type = "lambda-function"
  })
}

# Categories Function
resource "aws_lambda_function" "categories" {
  function_name = "${local.name_prefix}-categories"
  description   = "Category management for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.categories.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, {
      JWT_SECRET_KEY = var.jwt_secret_key
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-categories"
    Type = "lambda-function"
  })
}

# Auth Function
resource "aws_lambda_function" "auth" {
  function_name = "${local.name_prefix}-auth"
  description   = "Authentication for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.auth.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, {
      JWT_SECRET_KEY = var.jwt_secret_key
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-auth"
    Type = "lambda-function"
  })
}

# Accounts Function
resource "aws_lambda_function" "accounts" {
  function_name = "${local.name_prefix}-accounts"
  description   = "Account management for Finance Tracker API - ${var.environment}"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.code_zip.key
  source_code_hash = aws_s3_object.code_zip.etag

  handler     = "handlers.accounts.lambda_handler"
  runtime     = var.lambda_runtime
  timeout     = var.lambda_timeout
  memory_size = var.lambda_memory_size

  role = aws_iam_role.lambda_execution_role.arn

  layers = local.common_layers

  environment {
    variables = merge(local.common_lambda_environment, {
      JWT_SECRET_KEY = var.jwt_secret_key
    })
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.lambda_logs
  ]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-accounts"
    Type = "lambda-function"
  })
}
