# Lambda Functions
# Define nuestras funciones serverless

# Instalar dependencias y crear ZIP con código fuente
resource "null_resource" "create_lambda_package" {
  triggers = {
    # Re-crear cuando cambien los archivos fuente o requirements
    source_hash = sha256(join("", [
      for f in fileset("${path.module}/../backend/src", "**/*.py") : 
      filesha256("${path.module}/../backend/src/${f}")
    ]))
    requirements_hash = filesha256("${path.module}/../backend/requirements.txt")
  }

  provisioner "local-exec" {
    command = <<-EOT
      cd ${path.module}/..
      
      # Limpiar archivos anteriores
      rm -f terraform/lambda-deployment.zip terraform/lambda-layer.zip
      rm -rf temp_lambda_package temp_layer_package
      
      # CREAR ZIP DEL CÓDIGO FUENTE (sin dependencias)
      mkdir -p temp_lambda_package
      cp -r backend/src/* temp_lambda_package/
      cd temp_lambda_package
      find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
      find . -name "*.pyc" -delete 2>/dev/null || true
      zip -r9 ../terraform/lambda-deployment.zip . -q
      cd ..
      rm -rf temp_lambda_package
      
      # CREAR ZIP DEL LAYER (solo dependencias)
      mkdir -p temp_layer_package/python
      cd temp_layer_package/python
      python3 -m pip install -r ../../backend/requirements.txt -t . --quiet
      find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
      find . -name "*.pyc" -delete 2>/dev/null || true
      find . -name "*.pyo" -delete 2>/dev/null || true
      find . -name ".DS_Store" -delete 2>/dev/null || true
      find . -name "*.dist-info" -type d -exec rm -rf {} + 2>/dev/null || true
      cd ..
      zip -r9 ../terraform/lambda-layer.zip . -q
      cd ..
      rm -rf temp_layer_package
      
      echo "✅ Lambda deployment ZIP y Layer creados exitosamente"
      ls -lh terraform/lambda-deployment.zip terraform/lambda-layer.zip
    EOT
    
    working_dir = path.module
  }
}

# Crear el archivo ZIP con el código fuente usando archive_file como backup
data "archive_file" "lambda_zip" {
  type             = "zip"
  source_dir       = "${path.module}/../backend/src"
  output_path      = "${path.module}/lambda-deployment-backup.zip"
  output_file_mode = "0666"
  
  depends_on = [null_resource.create_lambda_package]
}

# Lambda Layer con dependencias de Python
resource "aws_lambda_layer_version" "python_dependencies" {
  filename   = "${path.module}/lambda-layer.zip"
  layer_name = "${local.project_name}-${var.environment}-python-deps"
  source_code_hash = filebase64sha256("${path.module}/lambda-layer.zip")

  compatible_runtimes = [var.lambda_runtime]

  description = "Python dependencies for finance tracker (boto3, pydantic, fastapi, mangum, python-dotenv)"
  
  depends_on = [null_resource.create_lambda_package]
}

# Archivo ZIP con código fuente principal
data "local_file" "lambda_zip_manual" {
  filename = "${path.module}/lambda-deployment.zip"
  depends_on = [null_resource.create_lambda_package]
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
  handler         = "handlers.health.lambda_handler"
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
      DYNAMODB_TABLE            = aws_dynamodb_table.main.name
      DYNAMODB_GSI1_NAME        = "GSI1"
      DYNAMODB_GSI2_NAME        = "GSI2"
      TABLE_DESIGN              = "single-table"
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
  handler         = "handlers.users.lambda_handler"
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
      DYNAMODB_TABLE            = aws_dynamodb_table.main.name
      DYNAMODB_GSI1_NAME        = "GSI1"
      DYNAMODB_GSI2_NAME        = "GSI2"
      TABLE_DESIGN              = "single-table"
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
