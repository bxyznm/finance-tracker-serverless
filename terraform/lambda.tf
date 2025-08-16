# Lambda Functions
# Define nuestras funciones serverless

# Lambda Layer con dependencias de Python
resource "aws_lambda_layer_version" "python_dependencies" {
  filename   = "lambda-layer-new.zip"
  layer_name = "${local.project_name}-${var.environment}-python-deps"
  source_code_hash = filebase64sha256("lambda-layer-new.zip")

  compatible_runtimes = [var.lambda_runtime]

  description = "Python dependencies for finance tracker (boto3, pydantic, fastapi, mangum, python-dotenv)"
}

# Archivo ZIP con código fuente solamente (sin dependencias)
data "local_file" "lambda_zip_manual" {
  filename = "${path.module}/lambda-deployment-manual.zip"
}

# CloudWatch Log Group para Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.project_name}-${var.environment}-health-check"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "Lambda Health Check Logs"
  })
}

# CloudWatch Log Group para Users Lambda
resource "aws_cloudwatch_log_group" "users_lambda_logs" {
  name              = "/aws/lambda/${local.project_name}-${var.environment}-users"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "Lambda Users Logs"
  })
}

# Función Lambda para Health Check
resource "aws_lambda_function" "health_check" {
  filename         = data.local_file.lambda_zip_manual.filename
  function_name    = "${local.project_name}-${var.environment}-health-check"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "src.handlers.health.lambda_handler"
  source_code_hash = filebase64sha256(data.local_file.lambda_zip_manual.filename)
  
  runtime = var.lambda_runtime
  timeout = var.lambda_timeout
  memory_size = var.lambda_memory_size

  # Usar el Lambda Layer con las dependencias
  layers = [aws_lambda_layer_version.python_dependencies.arn]

  # Variables de entorno
  environment {
    variables = {
      ENVIRONMENT                = var.environment
      APP_AWS_REGION            = var.aws_region
      DYNAMODB_TABLE_PREFIX     = local.table_prefix
      USERS_TABLE               = aws_dynamodb_table.users.name
      ACCOUNTS_TABLE            = aws_dynamodb_table.accounts.name
      TRANSACTIONS_TABLE        = aws_dynamodb_table.transactions.name
      CATEGORIES_TABLE          = aws_dynamodb_table.categories.name
      BUDGETS_TABLE             = aws_dynamodb_table.budgets.name
      DEFAULT_CURRENCY          = var.default_currency
      DEFAULT_TIMEZONE          = var.default_timezone
      DEFAULT_LOCALE            = var.default_locale
      LOG_LEVEL                 = var.environment == "production" ? "INFO" : "DEBUG"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy_attachment.lambda_dynamodb_policy_attachment,
    aws_cloudwatch_log_group.lambda_logs,
  ]

  tags = merge(local.common_tags, {
    Name = "Health Check Lambda"
    Description = "Función para verificar el estado de la API"
  })
}

# Función Lambda para Users
resource "aws_lambda_function" "users" {
  filename         = data.local_file.lambda_zip_manual.filename
  function_name    = "${local.project_name}-${var.environment}-users"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "src.handlers.users.lambda_handler"
  source_code_hash = filebase64sha256(data.local_file.lambda_zip_manual.filename)
  
  runtime = var.lambda_runtime
  timeout = var.lambda_timeout
  memory_size = var.lambda_memory_size

  # Usar el Lambda Layer con las dependencias
  layers = [aws_lambda_layer_version.python_dependencies.arn]

  # Variables de entorno
  environment {
    variables = {
      ENVIRONMENT                = var.environment
      APP_AWS_REGION            = var.aws_region
      DYNAMODB_TABLE_PREFIX     = local.table_prefix
      USERS_TABLE               = aws_dynamodb_table.users.name
      ACCOUNTS_TABLE            = aws_dynamodb_table.accounts.name
      TRANSACTIONS_TABLE        = aws_dynamodb_table.transactions.name
      CATEGORIES_TABLE          = aws_dynamodb_table.categories.name
      BUDGETS_TABLE             = aws_dynamodb_table.budgets.name
      DEFAULT_CURRENCY          = var.default_currency
      DEFAULT_TIMEZONE          = var.default_timezone
      DEFAULT_LOCALE            = var.default_locale
      LOG_LEVEL                 = var.environment == "production" ? "INFO" : "DEBUG"
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy_attachment.lambda_dynamodb_policy_attachment,
    aws_cloudwatch_log_group.users_lambda_logs,
  ]

  tags = merge(local.common_tags, {
    Name = "Users Lambda"
    Description = "Función para gestión de usuarios"
  })
}

# Permiso para que API Gateway invoque la función Lambda
resource "aws_lambda_permission" "health_check_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.function_name
  principal     = "apigateway.amazonaws.com"

  # Permitir desde cualquier método y ruta del API Gateway
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Permiso para que API Gateway invoque la función Lambda de usuarios
resource "aws_lambda_permission" "users_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"

  # Permitir desde cualquier método y ruta del API Gateway
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
