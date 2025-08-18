# =============================================================================
# Finance Tracker Serverless - Variables del Módulo
# =============================================================================

# -----------------------------------------------------------------------------
# Variables Requeridas
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker-serverless"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "El nombre del proyecto solo puede contener letras minúsculas, números y guiones."
  }
}

variable "environment" {
  description = "Ambiente de deployment (dev, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "El ambiente debe ser 'dev' o 'prod'."
  }
}

variable "aws_region" {
  description = "Región de AWS donde desplegar los recursos"
  type        = string
  default     = "mx-central-1"
}

# -----------------------------------------------------------------------------
# Variables de GitHub Release
# -----------------------------------------------------------------------------

variable "github_owner" {
  description = "Owner del repositorio de GitHub"
  type        = string
  default     = "bxyznm"
}

variable "github_repository" {
  description = "Nombre del repositorio de GitHub"
  type        = string
  default     = "finance-tracker-serverless"
}

variable "dev_release_tag" {
  description = "Tag del prerelease para el ambiente dev"
  type        = string
  default     = null
}

# -----------------------------------------------------------------------------
# Variables de DynamoDB
# -----------------------------------------------------------------------------

variable "dynamodb_billing_mode" {
  description = "Modo de facturación para DynamoDB"
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "El modo de facturación debe ser PAY_PER_REQUEST o PROVISIONED."
  }
}

variable "dynamodb_read_capacity" {
  description = "Capacidad de lectura para DynamoDB (solo si billing_mode es PROVISIONED)"
  type        = number
  default     = null
}

variable "dynamodb_write_capacity" {
  description = "Capacidad de escritura para DynamoDB (solo si billing_mode es PROVISIONED)"
  type        = number
  default     = null
}

variable "enable_point_in_time_recovery" {
  description = "Habilitar Point-in-Time Recovery para DynamoDB"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Variables de Lambda
# -----------------------------------------------------------------------------

variable "lambda_runtime" {
  description = "Runtime de Python para Lambda"
  type        = string
  default     = "python3.12"
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

variable "lambda_memory_size" {
  description = "Memoria asignada a las funciones Lambda en MB"
  type        = number
  default     = 128

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "La memoria debe estar entre 128 MB y 10,240 MB."
  }
}

variable "lambda_environment_variables" {
  description = "Variables de entorno adicionales para las funciones Lambda"
  type        = map(string)
  default     = {}
}

# -----------------------------------------------------------------------------
# Variables de API Gateway
# -----------------------------------------------------------------------------

variable "api_gateway_throttling_rate_limit" {
  description = "Límite de rate para API Gateway (requests por segundo)"
  type        = number
  default     = 1000
}

variable "api_gateway_throttling_burst_limit" {
  description = "Límite de burst para API Gateway"
  type        = number
  default     = 2000
}

variable "enable_api_gateway_logging" {
  description = "Habilitar logging para API Gateway"
  type        = bool
  default     = true
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
# Variables de Tags
# -----------------------------------------------------------------------------

variable "common_tags" {
  description = "Tags comunes a aplicar a todos los recursos"
  type        = map(string)
  default = {
    CreatedBy = "terraform"
    project_name = "finance-tracker-serverless"
  }
}

# -----------------------------------------------------------------------------
# Variables de Seguridad
# -----------------------------------------------------------------------------

variable "cors_allowed_origins" {
  description = "Lista de orígenes permitidos para CORS"
  type        = list(string)
  default     = ["*"]
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
