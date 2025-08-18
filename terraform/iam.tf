# IAM Roles y Policies
# Define los permisos que tendrán nuestras funciones Lambda

# Rol de ejecución para Lambda
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.project_name}-${var.environment}-lambda-execution-role"

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
    Name        = "Lambda Execution Role"
    Description = "Rol de ejecución para funciones Lambda"
  })
}

# Política básica de ejecución Lambda
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# Política personalizada para acceso a DynamoDB
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${local.project_name}-${var.environment}-lambda-dynamodb-policy"
  description = "Política para que Lambda acceda a DynamoDB"

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
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          # Tabla principal con Single Table Design
          aws_dynamodb_table.main.arn,
          # También incluir los índices GSI
          "${aws_dynamodb_table.main.arn}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# Adjuntar la política de DynamoDB al rol de Lambda
resource "aws_iam_role_policy_attachment" "lambda_dynamodb_policy_attachment" {
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Política adicional para CloudWatch Logs (más detallada)
resource "aws_iam_policy" "lambda_cloudwatch_policy" {
  name        = "${local.project_name}-${var.environment}-lambda-cloudwatch-policy"
  description = "Política para que Lambda escriba en CloudWatch Logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
      }
    ]
  })

  tags = local.common_tags
}

# Adjuntar la política de CloudWatch al rol de Lambda
resource "aws_iam_role_policy_attachment" "lambda_cloudwatch_policy_attachment" {
  policy_arn = aws_iam_policy.lambda_cloudwatch_policy.arn
  role       = aws_iam_role.lambda_execution_role.name
}

# Rol para API Gateway (para logging)
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  count = var.enable_api_gateway_logs ? 1 : 0
  name  = "${local.project_name}-${var.environment}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name        = "API Gateway CloudWatch Role"
    Description = "Rol para que API Gateway escriba logs"
  })
}

# Política para que API Gateway escriba en CloudWatch
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_policy" {
  count      = var.enable_api_gateway_logs ? 1 : 0
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
  role       = aws_iam_role.api_gateway_cloudwatch_role[0].name
}
