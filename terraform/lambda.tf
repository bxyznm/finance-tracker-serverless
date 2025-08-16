# Lambda Functions
# Define nuestras funciones serverless

# Primero necesitamos empaquetar nuestro código Python
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/src"
  output_path = "${path.module}/lambda-deployment.zip"
  
  # Excluir archivos innecesarios
  excludes = [
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    "tests/"
  ]
}

# CloudWatch Log Group para Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.project_name}-${var.environment}-health-check"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = merge(local.common_tags, {
    Name = "Lambda Health Check Logs"
  })
}

# Función Lambda para Health Check
resource "aws_lambda_function" "health_check" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.project_name}-${var.environment}-health-check"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "handlers.health.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  
  runtime = var.lambda_runtime
  timeout = var.lambda_timeout
  memory_size = var.lambda_memory_size

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

# Permiso para que API Gateway invoque la función Lambda
resource "aws_lambda_permission" "health_check_api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.health_check.function_name
  principal     = "apigateway.amazonaws.com"

  # Permitir desde cualquier método y ruta del API Gateway
  source_arn = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}
