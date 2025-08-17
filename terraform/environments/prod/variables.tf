# =============================================================================
# Finance Tracker Serverless - Variables para Entorno Production
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Básicas
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker"
}

variable "aws_region" {
  description = "Región de AWS donde desplegar los recursos"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# Variables de GitHub
# -----------------------------------------------------------------------------

variable "github_owner" {
  description = "Owner del repositorio de GitHub"
  type        = string
}

variable "github_repository" {
  description = "Nombre del repositorio de GitHub"
  type        = string
  default     = "finance-tracker-serverless"
}

variable "github_token" {
  description = "Token de GitHub para acceder a la API"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------------------------------
# Variables de DynamoDB
# -----------------------------------------------------------------------------

variable "use_provisioned_capacity" {
  description = "Usar capacidad provisionada para DynamoDB (recomendado para producción con tráfico predecible)"
  type        = bool
  default     = false # PAY_PER_REQUEST es más flexible para empezar
}

# -----------------------------------------------------------------------------
# Variables de Lambda
# -----------------------------------------------------------------------------

variable "lambda_runtime" {
  description = "Runtime de Python para Lambda"
  type        = string
  default     = "python3.12"
}

variable "lambda_memory_size" {
  description = "Memoria asignada a las funciones Lambda en MB"
  type        = number
  default     = 512 # Más memoria para producción

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "La memoria debe estar entre 128 MB y 10,240 MB."
  }
}

variable "lambda_timeout" {
  description = "Timeout en segundos para las funciones Lambda"
  type        = number
  default     = 30

  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "El timeout debe estar entre 1 y 900 segundos."
  }
}

variable "lambda_environment_variables" {
  description = "Variables de entorno adicionales para las funciones Lambda"
  type        = map(string)
  default = {
    ENVIRONMENT = "prod"
    DEBUG_MODE  = "false"
  }
}

variable "log_level" {
  description = "Nivel de logging para las funciones Lambda en producción"
  type        = string
  default     = "INFO"

  validation {
    condition     = contains(["ERROR", "WARN", "INFO", "DEBUG"], var.log_level)
    error_message = "El nivel de logging debe ser ERROR, WARN, INFO o DEBUG."
  }
}

# -----------------------------------------------------------------------------
# Variables de API Gateway
# -----------------------------------------------------------------------------

variable "api_gateway_throttling_rate_limit" {
  description = "Límite de rate para API Gateway (requests por segundo)"
  type        = number
  default     = 2000 # Mayor límite para producción
}

variable "api_gateway_throttling_burst_limit" {
  description = "Límite de burst para API Gateway"
  type        = number
  default     = 5000 # Mayor límite para producción
}

variable "api_gateway_log_level" {
  description = "Nivel de logging para API Gateway"
  type        = string
  default     = "INFO"

  validation {
    condition     = contains(["ERROR", "INFO"], var.api_gateway_log_level)
    error_message = "El nivel de logging debe ser ERROR o INFO."
  }
}

# -----------------------------------------------------------------------------
# Variables de CORS
# -----------------------------------------------------------------------------

variable "cors_allowed_origins" {
  description = "Lista de orígenes permitidos para CORS (debería ser específico en producción)"
  type        = list(string)
  default = [
    "https://finance-tracker.tudominio.com", # Cambia por tu dominio real
    "https://app.finance-tracker.com"        # Ejemplo de subdóminio de app
  ]
}

variable "cors_allowed_methods" {
  description = "Lista de métodos HTTP permitidos para CORS"
  type        = list(string)
  default     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}

variable "cors_allowed_headers" {
  description = "Lista de headers permitidos para CORS"
  type        = list(string)
  default = [
    "Content-Type",
    "X-Amz-Date",
    "Authorization",
    "X-Api-Key",
    "X-Amz-Security-Token",
    "X-Amz-User-Agent"
  ]
}

# -----------------------------------------------------------------------------
# Variables de Monitoring y Alertas
# -----------------------------------------------------------------------------

variable "sns_alert_topic_arn" {
  description = "ARN del tópico SNS para alertas de CloudWatch (opcional)"
  type        = string
  default     = ""
}

# -----------------------------------------------------------------------------
# Variables de Tags
# -----------------------------------------------------------------------------

variable "common_tags" {
  description = "Tags comunes a aplicar a todos los recursos"
  type        = map(string)
  default = {
    CreatedBy   = "terraform"
    Environment = "prod"
    Purpose     = "production"
    Critical    = "true"
    Monitoring  = "enabled"
    Backup      = "enabled"
  }
}
