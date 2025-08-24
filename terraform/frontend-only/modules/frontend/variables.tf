# =============================================================================
# Variables para el Módulo Frontend - S3 Website Hosting
# =============================================================================

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "finance-tracker"
}

variable "environment" {
  description = "Ambiente de despliegue (dev, prod)"
  type        = string
  
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment debe ser 'dev' o 'prod'."
  }
}

variable "aws_region" {
  description = "Región de AWS - México Central"
  type        = string
  default     = "mx-central-1"  # México Central - Región nativa de México
}

variable "api_gateway_url" {
  description = "URL del API Gateway del backend"
  type        = string
  default     = ""
}

variable "common_tags" {
  description = "Tags comunes para todos los recursos"
  type        = map(string)
  default     = {}
}
