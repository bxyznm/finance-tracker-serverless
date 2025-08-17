# =============================================================================
# Finance Tracker Serverless - Lambda Resources
# =============================================================================

# -----------------------------------------------------------------------------
# Lambda Layer para Dependencias
# -----------------------------------------------------------------------------

resource "aws_lambda_layer_version" "dependencies" {
  layer_name  = "${local.name_prefix}-dependencies"
  description = "Dependencies layer for Finance Tracker - ${var.environment} (${data.github_release.finance_tracker.release_tag})"

  s3_bucket        = aws_s3_bucket.deployment_assets.bucket
  s3_key           = aws_s3_object.layer_zip.key
  source_code_hash = aws_s3_object.layer_zip.etag

  compatible_runtimes = [var.lambda_runtime]

  skip_destroy = false

  depends_on = [aws_s3_object.layer_zip]
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
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.transactions.arn,
          aws_dynamodb_table.categories.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          "${aws_dynamodb_table.transactions.arn}/index/*",
          "${aws_dynamodb_table.categories.arn}/index/*"
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
    "auth"
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
    AWS_REGION           = var.aws_region
    USERS_TABLE          = aws_dynamodb_table.users.name
    TRANSACTIONS_TABLE   = aws_dynamodb_table.transactions.name
    CATEGORIES_TABLE     = aws_dynamodb_table.categories.name
    LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
    CORS_ALLOWED_ORIGINS = join(",", var.cors_allowed_origins)
  }, var.lambda_environment_variables)
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

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = local.common_lambda_environment
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

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = local.common_lambda_environment
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

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = local.common_lambda_environment
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

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = local.common_lambda_environment
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

  layers = [aws_lambda_layer_version.dependencies.arn]

  environment {
    variables = local.common_lambda_environment
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
