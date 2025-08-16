# Variables de entrada para Terraform
# Estas variables se pueden personalizar para diferentes entornos

variable "aws_region" {
  description = "Región de AWS donde desplegar los recursos"
  type        = string
  default     = "mx-central-1"
}

variable "environment" {
  description = "Entorno de despliegue (dev, staging, production)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment debe ser dev, staging, o production."
  }
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker"
}

# Variables para DynamoDB
variable "dynamodb_billing_mode" {
  description = "Modo de facturación para DynamoDB"
  type        = string
  default     = "PAY_PER_REQUEST"
  
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "billing_mode debe ser PAY_PER_REQUEST o PROVISIONED."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Habilitar Point in Time Recovery para DynamoDB"
  type        = bool
  default     = true
}

# Variables para Lambda
variable "lambda_runtime" {
  description = "Runtime de Python para Lambda"
  type        = string
  default     = "python3.11"
}

variable "lambda_memory_size" {
  description = "Memoria asignada a las funciones Lambda (MB)"
  type        = number
  default     = 256
  
  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Memory size debe estar entre 128 y 10240 MB."
  }
}

variable "lambda_timeout" {
  description = "Timeout de las funciones Lambda (segundos)"
  type        = number
  default     = 30
  
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Timeout debe estar entre 1 y 900 segundos."
  }
}

# Variables para API Gateway
variable "api_gateway_stage_name" {
  description = "Nombre del stage de API Gateway"
  type        = string
  default     = "api"
}

variable "enable_api_gateway_logs" {
  description = "Habilitar logs de API Gateway"
  type        = bool
  default     = true
}

# Variables específicas de México
variable "default_currency" {
  description = "Moneda por defecto"
  type        = string
  default     = "MXN"
}

variable "default_timezone" {
  description = "Zona horaria por defecto"
  type        = string
  default     = "America/Mexico_City"
}

variable "default_locale" {
  description = "Locale por defecto"
  type        = string
  default     = "es_MX"
}
