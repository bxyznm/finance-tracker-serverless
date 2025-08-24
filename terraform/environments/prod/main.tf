# =============================================================================
# Finance Tracker Serverless - Entorno Production
# =============================================================================

terraform {
  required_version = ">= 1.12.2"

  # Backend S3 para state remoto usando el mismo bucket de deployment assets
  backend "s3" {
    # El bucket se configurará dinámicamente via -backend-config
    # La región se configurará via -backend-config o AWS_DEFAULT_REGION/AWS_REGION env vars
    bucket = "finance-tracker-serverless-tfstates"
    key    = "terraform-state/prod/terraform.tfstate"
    
    # Configuración de seguridad
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"  # Versión actualizada con soporte completo para mx-central-1
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.4"   # Versión más reciente y estable
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"   # Versión más reciente
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"   # Versión más reciente
    }
  }
}

# -----------------------------------------------------------------------------
# Providers Configuration
# -----------------------------------------------------------------------------

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "finance-tracker"
      ManagedBy   = "terraform"
      CreatedBy   = "production-environment"
      Critical    = "true"
    }
  }
}

provider "github" {
  owner = var.github_owner
  token = var.github_token != "" ? var.github_token : null
  # Si github_token está vacío, el provider intentará usar la variable de entorno GITHUB_TOKEN
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

# Obtener el último release estable para producción
data "github_release" "latest_release" {
  repository  = var.github_repository
  owner       = var.github_owner
  retrieve_by = "latest"
}

# Obtener información del caller actual
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Local Values
# -----------------------------------------------------------------------------

locals {
  environment = "prod"
  
  # Tags específicos para producción
  prod_tags = {
    Environment = local.environment
    Purpose     = "production"
    Critical    = "true"
    Monitoring  = "enabled"
    Backup      = "enabled"
    CostCenter  = "production"
  }
  
  # Configuración específica para producción
  prod_config = {
    # DynamoDB con configuración robusta
    dynamodb_billing_mode = var.use_provisioned_capacity ? "PROVISIONED" : "PAY_PER_REQUEST"
    dynamodb_read_capacity  = 10
    dynamodb_write_capacity = 10
    
    # Lambda con más recursos para producción
    lambda_memory_size = var.lambda_memory_size
    lambda_timeout     = var.lambda_timeout
    
    # API Gateway con límites de producción
    api_throttling_rate_limit  = var.api_gateway_throttling_rate_limit
    api_throttling_burst_limit = var.api_gateway_throttling_burst_limit
    
    # Logs con retención más larga
    enable_api_gateway_logging = true
    api_gateway_log_level      = var.api_gateway_log_level
    
    # CORS más restrictivo para producción
    cors_allowed_origins = var.cors_allowed_origins
  }
}

# -----------------------------------------------------------------------------
# Finance Tracker Module
# -----------------------------------------------------------------------------

module "finance_tracker" {
  source = "../../modules/finance-tracker"

  # Configuración básica
  project_name = var.project_name
  environment  = local.environment
  aws_region   = var.aws_region

  # Configuración de GitHub (usa latest release, no prerelease)
  github_owner      = var.github_owner
  github_repository = var.github_repository
  dev_release_tag   = null # En prod siempre usamos el latest release

  # Configuración de DynamoDB
  dynamodb_billing_mode         = local.prod_config.dynamodb_billing_mode
  dynamodb_read_capacity        = local.prod_config.dynamodb_read_capacity
  dynamodb_write_capacity       = local.prod_config.dynamodb_write_capacity
  enable_point_in_time_recovery = true # Habilitado en prod para backups

  # Configuración de Lambda
  lambda_runtime           = var.lambda_runtime
  lambda_timeout           = local.prod_config.lambda_timeout
  lambda_memory_size       = local.prod_config.lambda_memory_size
  lambda_environment_variables = merge(var.lambda_environment_variables, {
    # Variables específicas para producción
    DEBUG_MODE = "false"
    LOG_LEVEL  = var.log_level
  })

  # Configuración de API Gateway
  api_gateway_throttling_rate_limit  = local.prod_config.api_throttling_rate_limit
  api_gateway_throttling_burst_limit = local.prod_config.api_throttling_burst_limit
  enable_api_gateway_logging         = local.prod_config.enable_api_gateway_logging
  api_gateway_log_level              = local.prod_config.api_gateway_log_level

  # Configuración de CORS
  cors_allowed_origins = local.prod_config.cors_allowed_origins
  cors_allowed_methods = var.cors_allowed_methods
  cors_allowed_headers = var.cors_allowed_headers

  # Configuración de Seguridad
  jwt_secret_key = var.jwt_secret_key

  # Tags
  common_tags = merge(var.common_tags, local.prod_tags)
}

# -----------------------------------------------------------------------------
# CloudWatch Alarms para Producción
# -----------------------------------------------------------------------------

# Alarm para errores de Lambda
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = module.finance_tracker.lambda_functions

  alarm_name          = "${var.project_name}-prod-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors for ${each.key}"
  alarm_actions       = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  dimensions = {
    FunctionName = each.value.function_name
  }

  tags = merge(local.prod_tags, {
    Name = "${var.project_name}-prod-${each.key}-errors-alarm"
    Type = "cloudwatch-alarm"
  })
}

# Alarm para duración de Lambda
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  for_each = module.finance_tracker.lambda_functions

  alarm_name          = "${var.project_name}-prod-${each.key}-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "20000" # 20 segundos
  alarm_description   = "This metric monitors lambda duration for ${each.key}"
  alarm_actions       = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  dimensions = {
    FunctionName = each.value.function_name
  }

  tags = merge(local.prod_tags, {
    Name = "${var.project_name}-prod-${each.key}-duration-alarm"
    Type = "cloudwatch-alarm"
  })
}

# Alarm para API Gateway 5xx errors
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_errors" {
  alarm_name          = "${var.project_name}-prod-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5xx errors"
  alarm_actions       = var.sns_alert_topic_arn != "" ? [var.sns_alert_topic_arn] : []

  dimensions = {
    ApiName = module.finance_tracker.api_gateway_id
    Stage   = local.environment
  }

  tags = merge(local.prod_tags, {
    Name = "${var.project_name}-prod-api-5xx-errors-alarm"
    Type = "cloudwatch-alarm"
  })
}

# -----------------------------------------------------------------------------
# Outputs específicos para producción
# -----------------------------------------------------------------------------

output "prod_info" {
  description = "Información específica del entorno de producción"
  value = {
    message              = "🚀 Entorno de producción desplegado exitosamente"
    release_used         = data.github_release.latest_release.release_tag
    high_availability    = true
    monitoring_enabled   = true
    backup_enabled       = true
    security_hardened    = true
    alarms_configured    = length(aws_cloudwatch_metric_alarm.lambda_errors) + length(aws_cloudwatch_metric_alarm.lambda_duration) + 1
  }
}
